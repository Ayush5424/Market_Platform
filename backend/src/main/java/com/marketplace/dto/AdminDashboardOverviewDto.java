package com.marketplace.dto;

import java.math.BigDecimal;

public record AdminDashboardOverviewDto(
        long liveSellersCount,
        long totalSellersCount,
        long pendingSellersCount,
        long rejectedSellersCount,
        long totalCategoriesCount,
        long totalProductsCount,
        long activeListingsCount,
        long totalListingsCount,
        long totalStockUnits,
        BigDecimal totalInventoryValueInr
) {}
