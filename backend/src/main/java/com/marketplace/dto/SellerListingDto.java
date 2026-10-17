package com.marketplace.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record SellerListingDto(
        Long id,
        Long sellerId,
        String sellerBusinessName,
        Long productId,
        String productName,
        String productBrand,
        String productUnit,
        String productImageUrl,
        Long categoryId,
        String categoryName,
        BigDecimal price,
        Integer stockQuantity,
        Integer minOrderQuantity,
        Boolean isActive,
        Long version,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
