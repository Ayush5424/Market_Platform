package com.marketplace.dto;

import java.math.BigDecimal;

public record ProductSummaryDto(
        Long id,
        String name,
        String brand,
        String description,
        String unit,
        Long categoryId,
        String categoryName,
        String imageUrl,
        BigDecimal lowestPrice,
        long eligibleSellersCount
) {}
