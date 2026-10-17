package com.marketplace.dto;

public record CategoryDto(
        Long id,
        String name,
        String description,
        String icon
) {}
