package com.marketplace.service;

import com.marketplace.config.AsyncConfig;
import com.marketplace.dto.*;
import com.marketplace.entity.Category;
import com.marketplace.entity.Seller;
import com.marketplace.entity.SellerListing;
import com.marketplace.entity.SellerStatus;
import com.marketplace.repository.CategoryRepository;
import com.marketplace.repository.ProductRepository;
import com.marketplace.repository.SellerListingRepository;
import com.marketplace.repository.SellerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {

    private static final Logger log = LoggerFactory.getLogger(AdminDashboardService.class);
    private static final int MAX_RECENT_EVENTS = 25;

    private final SellerRepository sellerRepository;
    private final SellerListingRepository listingRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ThreadPoolTaskExecutor adminExecutor;

    private final List<SseEmitter> activeEmitters = new CopyOnWriteArrayList<>();
    private final ConcurrentLinkedDeque<MarketplaceEventDto> recentEvents = new ConcurrentLinkedDeque<>();

    public AdminDashboardService(
            SellerRepository sellerRepository,
            SellerListingRepository listingRepository,
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            @Qualifier(AsyncConfig.ADMIN_EXECUTOR) ThreadPoolTaskExecutor adminExecutor) {
        this.sellerRepository = sellerRepository;
        this.listingRepository = listingRepository;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.adminExecutor = adminExecutor;

        // Initialize system event
        recordEvent("SYSTEM_INIT", "Admin Real-Time Dashboard Service initialized with concurrent executor.");
    }

    /**
     * Aggregates all dashboard metrics concurrently using CompletableFutures.
     */
    public AdminDashboardResponse getDashboardMetrics() {
        long startTime = System.currentTimeMillis();
        List<String> executedTasks = new CopyOnWriteArrayList<>();

        // Fetch data snapshot needed for aggregation concurrently
        // Task 1: Seller statistics
        CompletableFuture<SellerStatsHolder> sellerStatsFuture = CompletableFuture.supplyAsync(() -> {
            executedTasks.add("Seller-Counts-And-Entities-Task (" + Thread.currentThread().getName() + ")");
            List<Seller> allSellers = sellerRepository.findAllByOrderByBusinessNameAsc();
            long liveCount = allSellers.stream().filter(s -> s.getStatus() == SellerStatus.APPROVED).count();
            long pendingCount = allSellers.stream().filter(s -> s.getStatus() == SellerStatus.PENDING).count();
            long rejectedCount = allSellers.stream().filter(s -> s.getStatus() == SellerStatus.REJECTED).count();
            return new SellerStatsHolder(allSellers, liveCount, pendingCount, rejectedCount);
        });

        // Task 2: Listings and inventory snapshot
        CompletableFuture<ListingsStatsHolder> listingsStatsFuture = CompletableFuture.supplyAsync(() -> {
            executedTasks.add("Listings-And-Inventory-Task (" + Thread.currentThread().getName() + ")");
            List<SellerListing> allListings = listingRepository.findAllWithDetails();
            long activeCount = allListings.stream().filter(l -> Boolean.TRUE.equals(l.getIsActive())).count();
            long totalStock = allListings.stream()
                    .filter(l -> Boolean.TRUE.equals(l.getIsActive()))
                    .mapToLong(l -> l.getStockQuantity() != null ? l.getStockQuantity() : 0)
                    .sum();
            BigDecimal totalInventoryValue = allListings.stream()
                    .filter(l -> Boolean.TRUE.equals(l.getIsActive()) && l.getPrice() != null && l.getStockQuantity() != null)
                    .map(l -> l.getPrice().multiply(BigDecimal.valueOf(l.getStockQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            return new ListingsStatsHolder(allListings, activeCount, totalStock, totalInventoryValue);
        });

        // Task 3: Categories and master products
        CompletableFuture<CatalogStatsHolder> catalogStatsFuture = CompletableFuture.supplyAsync(() -> {
            executedTasks.add("Catalog-Products-And-Categories-Task (" + Thread.currentThread().getName() + ")");
            List<Category> allCategories = categoryRepository.findAllByOrderByNameAsc();
            long productCount = productRepository.count();
            return new CatalogStatsHolder(allCategories, productCount);
        });

        // Await parallel data fetch tasks concurrently
        CompletableFuture.allOf(sellerStatsFuture, listingsStatsFuture, catalogStatsFuture).join();

        SellerStatsHolder sellerStats = sellerStatsFuture.join();
        ListingsStatsHolder listingsStats = listingsStatsFuture.join();
        CatalogStatsHolder catalogStats = catalogStatsFuture.join();

        // Concurrent Task 4: Detailed Seller Breakdown
        CompletableFuture<List<AdminSellerMetricDto>> sellerBreakdownFuture = CompletableFuture.supplyAsync(() -> {
            executedTasks.add("Seller-Breakdown-Worker (" + Thread.currentThread().getName() + ")");
            Map<Long, List<SellerListing>> listingsBySeller = listingsStats.allListings().stream()
                    .collect(Collectors.groupingBy(l -> l.getSeller().getId()));

            return sellerStats.allSellers().stream().map(seller -> {
                List<SellerListing> sellerListings = listingsBySeller.getOrDefault(seller.getId(), Collections.emptyList());
                long totalListings = sellerListings.size();
                long activeListings = sellerListings.stream().filter(l -> Boolean.TRUE.equals(l.getIsActive())).count();
                long outOfStock = sellerListings.stream()
                        .filter(l -> Boolean.TRUE.equals(l.getIsActive()) && (l.getStockQuantity() == null || l.getStockQuantity() <= 0))
                        .count();
                long totalStock = sellerListings.stream()
                        .filter(l -> Boolean.TRUE.equals(l.getIsActive()))
                        .mapToLong(l -> l.getStockQuantity() != null ? l.getStockQuantity() : 0)
                        .sum();
                BigDecimal inventoryVal = sellerListings.stream()
                        .filter(l -> Boolean.TRUE.equals(l.getIsActive()) && l.getPrice() != null && l.getStockQuantity() != null)
                        .map(l -> l.getPrice().multiply(BigDecimal.valueOf(l.getStockQuantity())))
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .setScale(2, RoundingMode.HALF_UP);

                return new AdminSellerMetricDto(
                        seller.getId(),
                        seller.getName(),
                        seller.getBusinessName(),
                        seller.getEmail(),
                        seller.getStatus(),
                        seller.getRating(),
                        totalListings,
                        activeListings,
                        outOfStock,
                        totalStock,
                        inventoryVal
                );
            }).toList();
        });

        // Concurrent Task 5: Detailed Category Breakdown
        CompletableFuture<List<AdminCategoryMetricDto>> categoryBreakdownFuture = CompletableFuture.supplyAsync(() -> {
            executedTasks.add("Category-Breakdown-Worker (" + Thread.currentThread().getName() + ")");
            Map<Long, List<SellerListing>> listingsByCategory = listingsStats.allListings().stream()
                    .collect(Collectors.groupingBy(l -> l.getProduct().getCategory().getId()));

            return catalogStats.allCategories().stream().map(cat -> {
                List<SellerListing> catListings = listingsByCategory.getOrDefault(cat.getId(), Collections.emptyList());
                long activeListings = catListings.stream().filter(l -> Boolean.TRUE.equals(l.getIsActive())).count();
                long totalListings = catListings.size();

                // Distinct products in this category that have listings or are listed
                long distinctProducts = catListings.stream().map(l -> l.getProduct().getId()).distinct().count();

                // Lowest price among active approved listings
                BigDecimal lowestPrice = catListings.stream()
                        .filter(l -> Boolean.TRUE.equals(l.getIsActive())
                                && l.getSeller().isApproved()
                                && l.getStockQuantity() != null
                                && l.getMinOrderQuantity() != null
                                && l.getStockQuantity() >= l.getMinOrderQuantity())
                        .map(SellerListing::getPrice)
                        .min(BigDecimal::compareTo)
                        .orElse(null);

                return new AdminCategoryMetricDto(
                        cat.getId(),
                        cat.getName(),
                        cat.getDescription(),
                        cat.getIcon(),
                        distinctProducts,
                        activeListings,
                        totalListings,
                        lowestPrice
                );
            }).toList();
        });

        CompletableFuture.allOf(sellerBreakdownFuture, categoryBreakdownFuture).join();

        List<AdminSellerMetricDto> sellerMetrics = sellerBreakdownFuture.join();
        List<AdminCategoryMetricDto> categoryMetrics = categoryBreakdownFuture.join();

        long durationMs = System.currentTimeMillis() - startTime;

        AdminDashboardOverviewDto overview = new AdminDashboardOverviewDto(
                sellerStats.liveCount(),
                sellerStats.allSellers().size(),
                sellerStats.pendingCount(),
                sellerStats.rejectedCount(),
                catalogStats.allCategories().size(),
                catalogStats.totalProducts(),
                listingsStats.activeCount(),
                listingsStats.allListings().size(),
                listingsStats.totalStock(),
                listingsStats.totalInventoryValue().setScale(2, RoundingMode.HALF_UP)
        );

        AdminConcurrencyStatsDto concurrencyStats = new AdminConcurrencyStatsDto(
                durationMs,
                adminExecutor.getPoolSize(),
                adminExecutor.getActiveCount(),
                adminExecutor.getThreadPoolExecutor().getCompletedTaskCount(),
                adminExecutor.getThreadNamePrefix(),
                executedTasks,
                Instant.now()
        );

        return new AdminDashboardResponse(
                overview,
                sellerMetrics,
                categoryMetrics,
                new ArrayList<>(recentEvents),
                concurrencyStats
        );
    }

    /**
     * Connect a new SSE client for real-time dashboard events.
     */
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(300_000L); // 5 min timeout
        activeEmitters.add(emitter);

        emitter.onCompletion(() -> activeEmitters.remove(emitter));
        emitter.onTimeout(() -> activeEmitters.remove(emitter));
        emitter.onError((e) -> activeEmitters.remove(emitter));

        // Immediately send initial state asynchronously on executor
        adminExecutor.execute(() -> {
            try {
                AdminDashboardResponse initialData = getDashboardMetrics();
                emitter.send(SseEmitter.event()
                        .name("dashboard-init")
                        .data(initialData));
            } catch (Exception ex) {
                log.warn("Failed to send initial SSE payload: {}", ex.getMessage());
                activeEmitters.remove(emitter);
            }
        });

        return emitter;
    }

    /**
     * Broadcast an update triggered by marketplace mutations (e.g., listing added, toggled, etc.)
     */
    public void broadcastChange(String eventType, String description) {
        recordEvent(eventType, description);

        // Run concurrent calculation and broadcast to all connected emitters
        adminExecutor.execute(() -> {
            try {
                AdminDashboardResponse payload = getDashboardMetrics();
                List<SseEmitter> deadEmitters = new ArrayList<>();

                for (SseEmitter emitter : activeEmitters) {
                    try {
                        emitter.send(SseEmitter.event()
                                .name("dashboard-sync")
                                .data(payload));
                    } catch (IOException | IllegalStateException e) {
                        deadEmitters.add(emitter);
                    }
                }
                activeEmitters.removeAll(deadEmitters);
            } catch (Exception ex) {
                log.error("Failed to broadcast dashboard update: {}", ex.getMessage(), ex);
            }
        });
    }

    /**
     * Periodic concurrent heartbeat sync every 10 seconds.
     */
    @Scheduled(fixedRate = 10000)
    public void scheduledSyncHeartbeat() {
        if (activeEmitters.isEmpty()) {
            return;
        }

        adminExecutor.execute(() -> {
            try {
                AdminDashboardResponse payload = getDashboardMetrics();
                List<SseEmitter> deadEmitters = new ArrayList<>();

                for (SseEmitter emitter : activeEmitters) {
                    try {
                        emitter.send(SseEmitter.event()
                                .name("dashboard-sync")
                                .data(payload));
                    } catch (Exception e) {
                        deadEmitters.add(emitter);
                    }
                }
                activeEmitters.removeAll(deadEmitters);
            } catch (Exception ex) {
                log.debug("Heartbeat broadcast error: {}", ex.getMessage());
            }
        });
    }

    /**
     * Simulates concurrent multi-threaded workload to demonstrate high concurrency.
     */
    public Map<String, Object> simulateConcurrentWorkload(int threadCount) {
        int workers = Math.max(1, Math.min(threadCount, 50));
        long startTime = System.currentTimeMillis();
        List<CompletableFuture<Long>> futures = new ArrayList<>();
        ExecutorService simulationExecutor = Executors.newFixedThreadPool(workers);

        try {
            for (int i = 0; i < workers; i++) {
                futures.add(CompletableFuture.supplyAsync(() -> {
                    long taskStart = System.currentTimeMillis();
                    getDashboardMetrics();
                    return System.currentTimeMillis() - taskStart;
                }, simulationExecutor));
            }

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        } finally {
            simulationExecutor.shutdown();
        }
        long totalDuration = System.currentTimeMillis() - startTime;

        List<Long> latencies = futures.stream().map(CompletableFuture::join).toList();
        double avgLatency = latencies.stream().mapToLong(Long::longValue).average().orElse(0.0);

        recordEvent("CONCURRENCY_TEST", "Simulated " + workers + " parallel dashboard requests completed in " + totalDuration + "ms (avg " + String.format("%.1f", avgLatency) + "ms)");
        broadcastChange("CONCURRENCY_TEST_COMPLETE", "Concurrent workload simulation of " + workers + " parallel threads finished successfully.");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("workersExecuted", workers);
        result.put("totalDurationMs", totalDuration);
        result.put("averageLatencyMs", avgLatency);
        result.put("activeThreadPoolSize", adminExecutor.getPoolSize());
        result.put("activeThreads", adminExecutor.getActiveCount());
        result.put("completedTasks", adminExecutor.getThreadPoolExecutor().getCompletedTaskCount());

        return result;
    }

    private void recordEvent(String eventType, String description) {
        MarketplaceEventDto event = new MarketplaceEventDto(
                UUID.randomUUID().toString().substring(0, 8),
                eventType,
                description,
                Instant.now()
        );
        recentEvents.addFirst(event);
        while (recentEvents.size() > MAX_RECENT_EVENTS) {
            recentEvents.pollLast();
        }
    }

    // Record holders for parallel stages
    private record SellerStatsHolder(List<Seller> allSellers, long liveCount, long pendingCount, long rejectedCount) {}
    private record ListingsStatsHolder(List<SellerListing> allListings, long activeCount, long totalStock, BigDecimal totalInventoryValue) {}
    private record CatalogStatsHolder(List<Category> allCategories, long totalProducts) {}
}
