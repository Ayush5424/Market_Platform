package com.marketplace.dto;

import com.marketplace.entity.SellerStatus;
import java.math.BigDecimal;

public record AdminSellerMetricDto(
        Long sellerId,
        String name,
        String businessName,
        String email,
        SellerStatus status,
        BigDecimal rating,
        long totalListings,
        long activeListings,
        long outOfStockListings,
        long totalStockUnits,
        BigDecimal inventoryValueInr
) {}
