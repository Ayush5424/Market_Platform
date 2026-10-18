package com.marketplace.dto;

import java.util.List;

public record AdminDashboardResponse(
        AdminDashboardOverviewDto overview,
        List<AdminSellerMetricDto> sellerMetrics,
        List<AdminCategoryMetricDto> categoryMetrics,
        List<MarketplaceEventDto> recentEvents,
        AdminConcurrencyStatsDto concurrencyStats
) {}
