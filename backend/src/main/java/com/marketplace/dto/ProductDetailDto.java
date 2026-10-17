package com.marketplace.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProductDetailDto(
        Long id,
        String name,
        String brand,
        String description,
        String unit,
        Long categoryId,
        String categoryName,
        String imageUrl,
        BigDecimal lowestPrice,
        long eligibleSellersCount,
        List<SellerOfferDto> offers
) {}
