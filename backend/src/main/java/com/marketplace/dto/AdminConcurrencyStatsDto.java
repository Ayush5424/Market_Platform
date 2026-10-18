package com.marketplace.dto;

import java.time.Instant;
import java.util.List;

public record AdminConcurrencyStatsDto(
        long aggregationDurationMs,
        int poolSize,
        int activeThreads,
        long completedTaskCount,
        String threadPoolName,
        List<String> concurrentTasksExecuted,
        Instant timestamp
) {}
