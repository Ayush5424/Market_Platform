package com.marketplace.dto;

import java.math.BigDecimal;

public record AdminCategoryMetricDto(
        Long categoryId,
        String name,
        String description,
        String icon,
        long productsCount,
        long activeListingsCount,
        long totalListingsCount,
        BigDecimal lowestPrice
) {}
