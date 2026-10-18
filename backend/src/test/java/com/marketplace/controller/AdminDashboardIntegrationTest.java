package com.marketplace.controller;

import com.marketplace.dto.AdminDashboardResponse;
import com.marketplace.dto.SellerDto;
import com.marketplace.entity.SellerStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AdminDashboardIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    @DisplayName("Admin Dashboard: Concurrent aggregation returns live sellers, product listings, categories, and telemetry")
    void testAdminDashboardMetricsAggregation() {
        ResponseEntity<AdminDashboardResponse> response = restTemplate.getForEntity("/api/v1/admin/dashboard", AdminDashboardResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        AdminDashboardResponse dashboard = response.getBody();
        assertThat(dashboard).isNotNull();

        // 1. Overview counts
        assertThat(dashboard.overview().totalSellersCount()).isEqualTo(6);
        assertThat(dashboard.overview().liveSellersCount()).isEqualTo(4); // 4 Approved suppliers
        assertThat(dashboard.overview().pendingSellersCount()).isEqualTo(1); // 1 Pending
        assertThat(dashboard.overview().rejectedSellersCount()).isEqualTo(1); // 1 Rejected
        assertThat(dashboard.overview().totalCategoriesCount()).isEqualTo(6); // 6 heavy material categories
        assertThat(dashboard.overview().totalProductsCount()).isGreaterThanOrEqualTo(12);
        assertThat(dashboard.overview().activeListingsCount()).isGreaterThan(0);
        assertThat(dashboard.overview().totalStockUnits()).isGreaterThan(0);

        // 2. Concurrency execution telemetry
        assertThat(dashboard.concurrencyStats()).isNotNull();
        assertThat(dashboard.concurrencyStats().threadPoolName()).startsWith("admin-worker-");
        assertThat(dashboard.concurrencyStats().concurrentTasksExecuted()).isNotEmpty();
        assertThat(dashboard.concurrencyStats().aggregationDurationMs()).isGreaterThanOrEqualTo(0);

        // 3. Seller breakdown metrics
        assertThat(dashboard.sellerMetrics()).hasSize(6);
        assertThat(dashboard.sellerMetrics()).anyMatch(s -> s.businessName().equals("Prime Builders Supply") && s.activeListings() > 0);

        // 4. Category breakdown metrics
        assertThat(dashboard.categoryMetrics()).hasSize(6);
        assertThat(dashboard.categoryMetrics()).anyMatch(c -> c.name().equals("Cement & Concrete") && c.activeListingsCount() > 0);
    }

    @Test
    @DisplayName("Admin Dashboard: Real-time sync on seller status change (live sellers count changes dynamically)")
    void testRealtimeSyncOnSellerStatusChange() {
        // Initial state: David Chen (ID 5) is PENDING
        ResponseEntity<AdminDashboardResponse> initialRes = restTemplate.getForEntity("/api/v1/admin/dashboard", AdminDashboardResponse.class);
        assertThat(initialRes.getBody().overview().liveSellersCount()).isEqualTo(4);

        // Admin approves seller #5
        ResponseEntity<SellerDto> patchRes = restTemplate.exchange(
                "/api/v1/admin/sellers/5/status?status=APPROVED",
                org.springframework.http.HttpMethod.PUT,
                null,
                SellerDto.class
        );
        assertThat(patchRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(patchRes.getBody().status()).isEqualTo(SellerStatus.APPROVED);

        // Verify synced dashboard immediately reflects new live seller count
        ResponseEntity<AdminDashboardResponse> syncedRes = restTemplate.getForEntity("/api/v1/admin/dashboard", AdminDashboardResponse.class);
        assertThat(syncedRes.getBody().overview().liveSellersCount()).isEqualTo(5);

        // Revert back to PENDING for idempotency
        restTemplate.exchange(
                "/api/v1/admin/sellers/5/status?status=PENDING",
                org.springframework.http.HttpMethod.PUT,
                null,
                SellerDto.class
        );
    }

    @Test
    @DisplayName("Admin Dashboard: Concurrent stress test simulating parallel multi-threaded aggregation requests")
    void testConcurrentProcessWorkload() throws InterruptedException {
        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    ResponseEntity<AdminDashboardResponse> res = restTemplate.getForEntity("/api/v1/admin/dashboard", AdminDashboardResponse.class);
                    if (res.getStatusCode() == HttpStatus.OK && res.getBody() != null && res.getBody().overview().liveSellersCount() >= 4) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception ignored) {
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean completedInTime = latch.await(20, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completedInTime).isTrue();
        assertThat(successCount.get()).isEqualTo(threadCount);

        // Test simulate concurrency endpoint
        ResponseEntity<Map> benchmarkRes = restTemplate.postForEntity("/api/v1/admin/dashboard/simulate-concurrency?threads=8", null, Map.class);
        assertThat(benchmarkRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(benchmarkRes.getBody()).containsKey("workersExecuted");
        assertThat(benchmarkRes.getBody().get("workersExecuted")).isEqualTo(8);
    }
}
