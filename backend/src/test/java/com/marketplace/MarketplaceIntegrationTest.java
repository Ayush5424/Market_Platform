package com.marketplace;

import com.marketplace.dto.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class MarketplaceIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    @DisplayName("Buyer Marketplace: Search, category filtering, lowest price calculation and exclusions")
    void testBuyerDiscoveryWorkflow() {
        // 1. Search products by query "UltraTech"
        ResponseEntity<Map> searchRes = restTemplate.getForEntity("/api/v1/products?query=UltraTech", Map.class);
        assertThat(searchRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map body = searchRes.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("totalElements")).isEqualTo(1);

        // 2. Product Detail for Product 1 (UltraTech PPC):
        // Seller 1: $6.20 (approved, active)
        // Seller 2: $5.95 (approved, active) -> Lowest price!
        // Seller 3: $6.50 (approved, INACTIVE) -> excluded from eligible
        ResponseEntity<ProductDetailDto> detailRes = restTemplate.getForEntity("/api/v1/products/1", ProductDetailDto.class);
        assertThat(detailRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        ProductDetailDto detail = detailRes.getBody();
        assertThat(detail).isNotNull();
        assertThat(detail.name()).isEqualTo("Portland Pozzolana Cement (PPC)");
        assertThat(detail.lowestPrice()).isEqualByComparingTo(BigDecimal.valueOf(5.95));
        assertThat(detail.eligibleSellersCount()).isEqualTo(2);

        // 3. Product 12 (Specialized Refractory Bricks): only PENDING and REJECTED sellers listed it
        // Buyer discovery must show 0 eligible sellers and lowestPrice null
        ResponseEntity<ProductDetailDto> p12Res = restTemplate.getForEntity("/api/v1/products/12", ProductDetailDto.class);
        assertThat(p12Res.getStatusCode()).isEqualTo(HttpStatus.OK);
        ProductDetailDto p12 = p12Res.getBody();
        assertThat(p12).isNotNull();
        assertThat(p12.lowestPrice()).isNull();
        assertThat(p12.eligibleSellersCount()).isEqualTo(0);

        // 4. Product 6 (Aggregates): Seller 4 has stock=8, moq=20 (stock < moq). Only Sellers 1 & 3 are eligible
        ResponseEntity<ProductDetailDto> p6Res = restTemplate.getForEntity("/api/v1/products/6", ProductDetailDto.class);
        assertThat(p6Res.getStatusCode()).isEqualTo(HttpStatus.OK);
        ProductDetailDto p6 = p6Res.getBody();
        assertThat(p6).isNotNull();
        assertThat(p6.eligibleSellersCount()).isEqualTo(2);
        assertThat(p6.lowestPrice()).isEqualByComparingTo(BigDecimal.valueOf(28.00));
    }

    @Test
    @DisplayName("Seller Security & Business Rules: Ownership, pending/rejected restrictions, duplicate prevention, optimistic locking")
    void testSellerBusinessRulesAndSecurity() {
        // 1. Missing X-Seller-Id header -> 401 Unauthorized
        ResponseEntity<ApiErrorResponse> missingHeader = restTemplate.getForEntity("/api/v1/seller/listings", ApiErrorResponse.class);
        assertThat(missingHeader.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // 2. Pending seller (ID 5) tries to create listing -> 403 Forbidden
        HttpHeaders pendingHeaders = new HttpHeaders();
        pendingHeaders.set("X-Seller-Id", "5");
        CreateListingRequest pendingReq = new CreateListingRequest(1L, null, BigDecimal.valueOf(10.0), 100, 10, true);
        HttpEntity<CreateListingRequest> pendingEntity = new HttpEntity<>(pendingReq, pendingHeaders);

        ResponseEntity<ApiErrorResponse> pendingRes = restTemplate.postForEntity("/api/v1/seller/listings", pendingEntity, ApiErrorResponse.class);
        assertThat(pendingRes.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(pendingRes.getBody().message()).contains("PENDING approval");

        // 3. Rejected seller (ID 6) tries to create listing -> 403 Forbidden
        HttpHeaders rejectedHeaders = new HttpHeaders();
        rejectedHeaders.set("X-Seller-Id", "6");
        HttpEntity<CreateListingRequest> rejectedEntity = new HttpEntity<>(pendingReq, rejectedHeaders);

        ResponseEntity<ApiErrorResponse> rejectedRes = restTemplate.postForEntity("/api/v1/seller/listings", rejectedEntity, ApiErrorResponse.class);
        assertThat(rejectedRes.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(rejectedRes.getBody().message()).contains("REJECTED");

        // 4. Duplicate listing prevention: Seller 1 already lists Product 1
        HttpHeaders seller1Headers = new HttpHeaders();
        seller1Headers.set("X-Seller-Id", "1");
        CreateListingRequest dupReq = new CreateListingRequest(1L, null, BigDecimal.valueOf(9.0), 50, 5, true);
        HttpEntity<CreateListingRequest> dupEntity = new HttpEntity<>(dupReq, seller1Headers);

        ResponseEntity<ApiErrorResponse> dupRes = restTemplate.postForEntity("/api/v1/seller/listings", dupEntity, ApiErrorResponse.class);
        assertThat(dupRes.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(dupRes.getBody().message()).contains("already have an existing listing");

        // 5. Seller ownership: Seller 2 attempts to modify Seller 1's listing (Listing ID 1 belongs to Seller 1)
        HttpHeaders seller2Headers = new HttpHeaders();
        seller2Headers.set("X-Seller-Id", "2");
        UpdateListingRequest stealReq = new UpdateListingRequest(BigDecimal.valueOf(8.0), 50, 5, true, 0L);
        HttpEntity<UpdateListingRequest> stealEntity = new HttpEntity<>(stealReq, seller2Headers);

        ResponseEntity<ApiErrorResponse> stealRes = restTemplate.exchange("/api/v1/seller/listings/1", HttpMethod.PUT, stealEntity, ApiErrorResponse.class);
        assertThat(stealRes.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(stealRes.getBody().message()).contains("permission");

        // 6. Optimistic locking: Seller 1 attempts update with outdated version (e.g. version 99)
        UpdateListingRequest staleReq = new UpdateListingRequest(BigDecimal.valueOf(6.10), 800, 50, true, 99L);
        HttpEntity<UpdateListingRequest> staleEntity = new HttpEntity<>(staleReq, seller1Headers);

        ResponseEntity<ApiErrorResponse> conflictRes = restTemplate.exchange("/api/v1/seller/listings/1", HttpMethod.PUT, staleEntity, ApiErrorResponse.class);
        assertThat(conflictRes.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(conflictRes.getBody().message()).contains("modified concurrently");

        // 7. Successful update: Seller 1 updates with matching version (version 0)
        UpdateListingRequest validUpdate = new UpdateListingRequest(BigDecimal.valueOf(6.15), 900, 50, true, 0L);
        HttpEntity<UpdateListingRequest> validUpdateEntity = new HttpEntity<>(validUpdate, seller1Headers);

        ResponseEntity<SellerListingDto> updateSuccess = restTemplate.exchange("/api/v1/seller/listings/1", HttpMethod.PUT, validUpdateEntity, SellerListingDto.class);
        assertThat(updateSuccess.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateSuccess.getBody().price()).isEqualByComparingTo(BigDecimal.valueOf(6.15));
        assertThat(updateSuccess.getBody().stockQuantity()).isEqualTo(900);
        assertThat(updateSuccess.getBody().version()).isEqualTo(1L); // Version incremented!
    }
}
