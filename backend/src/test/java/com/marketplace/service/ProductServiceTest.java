package com.marketplace.service;

import com.marketplace.dto.ProductDetailDto;
import com.marketplace.entity.Category;
import com.marketplace.entity.Product;
import com.marketplace.entity.Seller;
import com.marketplace.entity.SellerListing;
import com.marketplace.entity.SellerStatus;
import com.marketplace.repository.ProductRepository;
import com.marketplace.repository.SellerListingRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private SellerListingRepository sellerListingRepository;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private ProductService productService;

    @Test
    @DisplayName("Exclusion of unavailable listings and unapproved sellers from buyer discovery")
    void shouldExcludeUnapprovedSellersAndInsufficientStockFromEligibleOffers() {
        Category cat = new Category(1L, "Cement", "Cement desc", "layers");
        Product product = new Product(10L, "UltraTech Cement", "UltraTech", "High quality", "50kg Bag", cat, "http://img");

        Seller approvedSeller1 = new Seller(1L, "Seller 1", "Biz 1", "s1@test.com", "111", SellerStatus.APPROVED, BigDecimal.valueOf(4.5));
        Seller approvedSeller2 = new Seller(2L, "Seller 2", "Biz 2", "s2@test.com", "222", SellerStatus.APPROVED, BigDecimal.valueOf(4.7));
        Seller pendingSeller = new Seller(3L, "Pending Seller", "Biz 3", "s3@test.com", "333", SellerStatus.PENDING, BigDecimal.valueOf(4.0));
        Seller approvedSeller4 = new Seller(4L, "Seller 4", "Biz 4", "s4@test.com", "444", SellerStatus.APPROVED, BigDecimal.valueOf(4.2));

        // Listing 1: Approved seller, active, stock 100 >= moq 10, price $7.50 -> ELIGIBLE
        SellerListing listing1 = new SellerListing(101L, approvedSeller1, product, BigDecimal.valueOf(7.50), 100, 10, true);

        // Listing 2: Approved seller, active, stock 50 >= moq 20, price $7.10 -> ELIGIBLE & LOWEST!
        SellerListing listing2 = new SellerListing(102L, approvedSeller2, product, BigDecimal.valueOf(7.10), 50, 20, true);

        // Listing 3: Pending seller, price $6.50 -> MUST BE EXCLUDED!
        SellerListing listing3 = new SellerListing(103L, pendingSeller, product, BigDecimal.valueOf(6.50), 200, 5, true);

        // Listing 4: Approved seller, but stock (5) < moq (10) -> INSUFFICIENT STOCK! MUST BE EXCLUDED!
        SellerListing listing4 = new SellerListing(104L, approvedSeller4, product, BigDecimal.valueOf(6.90), 5, 10, true);

        when(productRepository.findByIdWithCategory(10L)).thenReturn(Optional.of(product));
        when(sellerListingRepository.findAllListingsByProductId(10L)).thenReturn(List.of(listing1, listing2, listing3, listing4));

        ProductDetailDto detail = productService.getProductDetail(10L);

        // Total offers returned in product detail is 4
        assertThat(detail.offers()).hasSize(4);

        // But eligibleSellersCount is exactly 2 (listing1 and listing2)
        assertThat(detail.eligibleSellersCount()).isEqualTo(2);

        // Lowest price is $7.10 (listing2), NOT $6.50 (pending seller) and NOT $6.90 (insufficient stock)
        assertThat(detail.lowestPrice()).isEqualByComparingTo(BigDecimal.valueOf(7.10));

        // Verify each offer availability flag
        assertThat(detail.offers().stream().filter(o -> o.listingId().equals(101L)).findFirst().get().isAvailable()).isTrue();
        assertThat(detail.offers().stream().filter(o -> o.listingId().equals(102L)).findFirst().get().isAvailable()).isTrue();
        assertThat(detail.offers().stream().filter(o -> o.listingId().equals(103L)).findFirst().get().isAvailable()).isFalse();
        assertThat(detail.offers().stream().filter(o -> o.listingId().equals(104L)).findFirst().get().isAvailable()).isFalse();
    }

    @Test
    @DisplayName("Product with no eligible offerings: lowest price is null and eligible count is 0")
    void shouldHandleProductWithNoEligibleSellers() {
        Category cat = new Category(2L, "Specialty", "Specialty desc", "star");
        Product product = new Product(20L, "Refractory Bricks", "Thermal", "desc", "100 Pcs", cat, "http://img");

        Seller rejectedSeller = new Seller(6L, "Bad Guy", "Rejected Biz", "bad@test.com", "999", SellerStatus.REJECTED, BigDecimal.valueOf(1.5));
        SellerListing listing = new SellerListing(201L, rejectedSeller, product, BigDecimal.valueOf(50.00), 100, 5, true);

        when(productRepository.findByIdWithCategory(20L)).thenReturn(Optional.of(product));
        when(sellerListingRepository.findAllListingsByProductId(20L)).thenReturn(List.of(listing));

        ProductDetailDto detail = productService.getProductDetail(20L);

        assertThat(detail.eligibleSellersCount()).isEqualTo(0);
        assertThat(detail.lowestPrice()).isNull();
        assertThat(detail.offers()).hasSize(1);
        assertThat(detail.offers().get(0).isAvailable()).isFalse();
    }
}
