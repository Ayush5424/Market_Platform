package com.marketplace.dto;

import java.time.Instant;

public record MarketplaceEventDto(
        String id,
        String eventType,
        String description,
        Instant timestamp
) {}
