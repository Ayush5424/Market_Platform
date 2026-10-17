package com.marketplace.dto;

import java.math.BigDecimal;

public record SellerOfferDto(
        Long listingId,
        Long sellerId,
        String sellerName,
        String businessName,
        BigDecimal rating,
        BigDecimal price,
        Integer stockQuantity,
        Integer minOrderQuantity,
        boolean isAvailable
) {}
