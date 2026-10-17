package com.marketplace.dto;

import com.marketplace.entity.SellerStatus;
import java.math.BigDecimal;

public record SellerDto(
        Long id,
        String name,
        String businessName,
        String email,
        String phone,
        SellerStatus status,
        BigDecimal rating
) {}
