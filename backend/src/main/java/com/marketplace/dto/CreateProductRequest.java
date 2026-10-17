package com.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateProductRequest(
        @NotBlank(message = "Product name is required")
        @Size(max = 255, message = "Product name cannot exceed 255 characters")
        String name,

        @NotBlank(message = "Brand is required")
        @Size(max = 100, message = "Brand cannot exceed 100 characters")
        String brand,

        String description,

        @NotBlank(message = "Unit of measurement is required (e.g. 50kg Bag, Ton, Cubic Meter)")
        @Size(max = 50, message = "Unit cannot exceed 50 characters")
        String unit,

        @NotNull(message = "Category ID is required")
        Long categoryId,

        @Size(max = 500, message = "Image URL cannot exceed 500 characters")
        String imageUrl
) {}
