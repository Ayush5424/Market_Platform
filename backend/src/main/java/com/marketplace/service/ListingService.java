package com.marketplace.service;

import com.marketplace.dto.CreateListingRequest;
import com.marketplace.dto.PagedResponse;
import com.marketplace.dto.SellerListingDto;
import com.marketplace.dto.UpdateListingRequest;
import com.marketplace.entity.Product;
import com.marketplace.entity.Seller;
import com.marketplace.entity.SellerListing;
import com.marketplace.exception.BadRequestException;
import com.marketplace.exception.ConflictException;
import com.marketplace.exception.ForbiddenException;
import com.marketplace.exception.ResourceNotFoundException;
import com.marketplace.repository.SellerListingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@Transactional
public class ListingService {

    private final SellerListingRepository listingRepository;
    private final SellerService sellerService;
    private final ProductService productService;
    private final AdminDashboardService adminDashboardService;

    public ListingService(SellerListingRepository listingRepository,
                          SellerService sellerService,
                          ProductService productService,
                          AdminDashboardService adminDashboardService) {
        this.listingRepository = listingRepository;
        this.sellerService = sellerService;
        this.productService = productService;
        this.adminDashboardService = adminDashboardService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<SellerListingDto> getSellerListings(Long currentSellerId, Pageable pageable) {
        // Validate seller exists
        sellerService.getSellerEntity(currentSellerId);
        Page<SellerListing> page = listingRepository.findBySellerId(currentSellerId, pageable);
        return PagedResponse.from(page.map(this::toDto));
    }

    @Transactional(readOnly = true)
    public SellerListingDto getListingById(Long currentSellerId, Long listingId) {
        SellerListing listing = getListingEntity(listingId);
        verifyOwnership(currentSellerId, listing);
        return toDto(listing);
    }

    public SellerListingDto createListing(Long currentSellerId, CreateListingRequest request) {
        Seller seller = sellerService.validateSellerForListingOperations(currentSellerId);

        Product product;
        if (request.productId() != null) {
            product = productService.getProductEntity(request.productId());
        } else if (request.newProduct() != null) {
            product = productService.createProduct(request.newProduct());
        } else {
            throw new BadRequestException("Either an existing productId or newProduct details must be provided.");
        }

        // Prevent duplicate listings for the same seller and product
        if (listingRepository.existsBySellerIdAndProductId(seller.getId(), product.getId())) {
            throw new ConflictException("You already have an existing listing for product '" + product.getName() + "'. Update the existing listing instead of creating a duplicate.");
        }

        validatePriceAndQuantities(request.price(), request.stockQuantity(), request.minOrderQuantity());

        SellerListing listing = new SellerListing();
        listing.setSeller(seller);
        listing.setProduct(product);
        listing.setPrice(request.price());
        listing.setStockQuantity(request.stockQuantity());
        listing.setMinOrderQuantity(request.minOrderQuantity());
        listing.setIsActive(request.isActive() != null ? request.isActive() : true);
        listing.setVersion(0L);

        SellerListing saved = listingRepository.saveAndFlush(listing);
        adminDashboardService.broadcastChange(
                "LISTING_CREATED",
                "New listing created for '" + saved.getProduct().getName() + "' by " + seller.getBusinessName()
        );
        return toDto(saved);
    }

    public SellerListingDto updateListing(Long currentSellerId, Long listingId, UpdateListingRequest request) {
        sellerService.validateSellerForListingOperations(currentSellerId);
        SellerListing listing = getListingEntity(listingId);

        // Verify seller ownership
        verifyOwnership(currentSellerId, listing);

        // Optimistic locking verification
        if (request.version() != null && !request.version().equals(listing.getVersion())) {
            throw new ConflictException("Listing has been modified concurrently. Expected version "
                    + listing.getVersion() + " but request had version " + request.version() + ". Please refresh and retry.");
        }

        validatePriceAndQuantities(request.price(), request.stockQuantity(), request.minOrderQuantity());

        listing.setPrice(request.price());
        listing.setStockQuantity(request.stockQuantity());
        listing.setMinOrderQuantity(request.minOrderQuantity());
        if (request.isActive() != null) {
            listing.setIsActive(request.isActive());
        }

        SellerListing updated = listingRepository.saveAndFlush(listing);
        adminDashboardService.broadcastChange(
                "LISTING_UPDATED",
                "Listing #" + listingId + " (" + updated.getProduct().getName() + ") updated by " + updated.getSeller().getBusinessName()
        );
        return toDto(updated);
    }

    public SellerListingDto toggleListingStatus(Long currentSellerId, Long listingId, boolean active) {
        sellerService.validateSellerForListingOperations(currentSellerId);
        SellerListing listing = getListingEntity(listingId);
        verifyOwnership(currentSellerId, listing);

        listing.setIsActive(active);
        SellerListing updated = listingRepository.save(listing);
        adminDashboardService.broadcastChange(
                "STATUS_TOGGLED",
                "Listing #" + listingId + " availability toggled to " + (active ? "ACTIVE" : "INACTIVE") + " by " + updated.getSeller().getBusinessName()
        );
        return toDto(updated);
    }

    public void deleteListing(Long currentSellerId, Long listingId) {
        sellerService.validateSellerForListingOperations(currentSellerId);
        SellerListing listing = getListingEntity(listingId);
        verifyOwnership(currentSellerId, listing);

        listingRepository.delete(listing);
        adminDashboardService.broadcastChange(
                "LISTING_DELETED",
                "Listing #" + listingId + " deleted by " + listing.getSeller().getBusinessName()
        );
    }

    private SellerListing getListingEntity(Long listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with id: " + listingId));
    }

    private void verifyOwnership(Long currentSellerId, SellerListing listing) {
        if (!listing.getSeller().getId().equals(currentSellerId)) {
            throw new ForbiddenException("Forbidden: You do not have permission to access or modify listings owned by another seller.");
        }
    }

    private void validatePriceAndQuantities(BigDecimal price, Integer stock, Integer moq) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Listing price must be greater than zero.");
        }
        if (stock == null || stock < 0) {
            throw new BadRequestException("Stock quantity cannot be negative.");
        }
        if (moq == null || moq <= 0) {
            throw new BadRequestException("Minimum order quantity must be at least 1.");
        }
    }

    public SellerListingDto toDto(SellerListing listing) {
        return new SellerListingDto(
                listing.getId(),
                listing.getSeller().getId(),
                listing.getSeller().getBusinessName(),
                listing.getProduct().getId(),
                listing.getProduct().getName(),
                listing.getProduct().getBrand(),
                listing.getProduct().getUnit(),
                listing.getProduct().getImageUrl(),
                listing.getProduct().getCategory().getId(),
                listing.getProduct().getCategory().getName(),
                listing.getPrice(),
                listing.getStockQuantity(),
                listing.getMinOrderQuantity(),
                listing.getIsActive(),
                listing.getVersion(),
                listing.getCreatedAt(),
                listing.getUpdatedAt()
        );
    }
}
