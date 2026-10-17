package com.marketplace.dto;

import java.time.OffsetDateTime;
import java.util.Map;

public record ApiErrorResponse(
        OffsetDateTime timestamp,
        int status,
        String error,
        String message,
        Map<String, String> validationErrors,
        String path
) {
    public static ApiErrorResponse of(int status, String error, String message, String path) {
        return new ApiErrorResponse(OffsetDateTime.now(), status, error, message, null, path);
    }

    public static ApiErrorResponse of(int status, String error, String message, Map<String, String> validationErrors, String path) {
        return new ApiErrorResponse(OffsetDateTime.now(), status, error, message, validationErrors, path);
    }
}
