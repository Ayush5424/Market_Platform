package com.marketplace.service;

import com.marketplace.dto.CreateListingRequest;
import com.marketplace.dto.SellerListingDto;
import com.marketplace.dto.UpdateListingRequest;
import com.marketplace.entity.Category;
import com.marketplace.entity.Product;
import com.marketplace.entity.Seller;
import com.marketplace.entity.SellerListing;
import com.marketplace.entity.SellerStatus;
import com.marketplace.exception.BadRequestException;
import com.marketplace.exception.ConflictException;
import com.marketplace.exception.ForbiddenException;
import com.marketplace.repository.SellerListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock
    private SellerListingRepository listingRepository;

    @Mock
    private SellerService sellerService;

    @Mock
    private ProductService productService;

    @InjectMocks
    private ListingService listingService;

    private Seller approvedSeller1;
    private Seller approvedSeller2;
    private Product sampleProduct;
    private Category sampleCategory;
    private SellerListing sampleListing;

    @BeforeEach
    void setUp() {
        approvedSeller1 = new Seller(1L, "Seller One", "Business One", "one@test.com", "123", SellerStatus.APPROVED, BigDecimal.valueOf(4.5));
        approvedSeller2 = new Seller(2L, "Seller Two", "Business Two", "two@test.com", "456", SellerStatus.APPROVED, BigDecimal.valueOf(4.0));
        sampleCategory = new Category(1L, "Cement", "Cement desc", "layers");
        sampleProduct = new Product(100L, "Sample Cement", "BrandA", "desc", "50kg Bag", sampleCategory, "http://image.url");
        sampleListing = new SellerListing(500L, approvedSeller1, sampleProduct, BigDecimal.valueOf(10.00), 100, 10, true);
        sampleListing.setVersion(1L);
    }

    @Test
    @DisplayName("Duplicate seller listing prevention: throws ConflictException when listing already exists for product")
    void shouldPreventDuplicateListingForSameSellerAndProduct() {
        when(sellerService.validateSellerForListingOperations(1L)).thenReturn(approvedSeller1);
        when(productService.getProductEntity(100L)).thenReturn(sampleProduct);
        when(listingRepository.existsBySellerIdAndProductId(1L, 100L)).thenReturn(true);

        CreateListingRequest request = new CreateListingRequest(100L, null, BigDecimal.valueOf(12.50), 50, 5, true);

        assertThatThrownBy(() -> listingService.createListing(1L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already have an existing listing");

        verify(listingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Invalid price validation: rejects zero or negative price")
    void shouldRejectInvalidPrice() {
        when(sellerService.validateSellerForListingOperations(1L)).thenReturn(approvedSeller1);
        when(productService.getProductEntity(100L)).thenReturn(sampleProduct);
        when(listingRepository.existsBySellerIdAndProductId(1L, 100L)).thenReturn(false);

        CreateListingRequest zeroPrice = new CreateListingRequest(100L, null, BigDecimal.ZERO, 50, 5, true);
        assertThatThrownBy(() -> listingService.createListing(1L, zeroPrice))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("greater than zero");

        CreateListingRequest negativePrice = new CreateListingRequest(100L, null, BigDecimal.valueOf(-5.00), 50, 5, true);
        assertThatThrownBy(() -> listingService.createListing(1L, negativePrice))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("greater than zero");
    }

    @Test
    @DisplayName("Invalid quantity validation: rejects negative stock and invalid MOQ")
    void shouldRejectInvalidQuantities() {
        when(sellerService.validateSellerForListingOperations(1L)).thenReturn(approvedSeller1);
        when(productService.getProductEntity(100L)).thenReturn(sampleProduct);
        when(listingRepository.existsBySellerIdAndProductId(1L, 100L)).thenReturn(false);

        CreateListingRequest negativeStock = new CreateListingRequest(100L, null, BigDecimal.valueOf(10.00), -1, 5, true);
        assertThatThrownBy(() -> listingService.createListing(1L, negativeStock))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("negative");

        CreateListingRequest zeroMoq = new CreateListingRequest(100L, null, BigDecimal.valueOf(10.00), 50, 0, true);
        assertThatThrownBy(() -> listingService.createListing(1L, zeroMoq))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("at least 1");
    }

    @Test
    @DisplayName("Seller ownership enforcement: rejects update attempt on another seller's listing")
    void shouldEnforceListingOwnershipOnUpdate() {
        when(sellerService.validateSellerForListingOperations(2L)).thenReturn(approvedSeller2);
        when(listingRepository.findById(500L)).thenReturn(Optional.of(sampleListing));

        UpdateListingRequest request = new UpdateListingRequest(BigDecimal.valueOf(15.00), 80, 5, true, 1L);

        // Seller 2 attempts to modify Seller 1's listing (500L)
        assertThatThrownBy(() -> listingService.updateListing(2L, 500L, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("You do not have permission");

        verify(listingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Concurrent update conflict handling: rejects update when optimistic locking version mismatches")
    void shouldRejectConcurrentUpdateOnVersionMismatch() {
        when(sellerService.validateSellerForListingOperations(1L)).thenReturn(approvedSeller1);
        when(listingRepository.findById(500L)).thenReturn(Optional.of(sampleListing));

        // Request has outdated version 0, but current version is 1
        UpdateListingRequest request = new UpdateListingRequest(BigDecimal.valueOf(15.00), 80, 5, true, 0L);

        assertThatThrownBy(() -> listingService.updateListing(1L, 500L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("modified concurrently");

        verify(listingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Listing activation and deactivation: toggles active state successfully")
    void shouldToggleListingActiveStatus() {
        when(sellerService.validateSellerForListingOperations(1L)).thenReturn(approvedSeller1);
        when(listingRepository.findById(500L)).thenReturn(Optional.of(sampleListing));
        when(listingRepository.save(any(SellerListing.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SellerListingDto deactivated = listingService.toggleListingStatus(1L, 500L, false);
        assertThat(deactivated.isActive()).isFalse();

        SellerListingDto reactivated = listingService.toggleListingStatus(1L, 500L, true);
        assertThat(reactivated.isActive()).isTrue();
    }
}
