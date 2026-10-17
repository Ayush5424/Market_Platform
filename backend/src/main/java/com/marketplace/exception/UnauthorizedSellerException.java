package com.marketplace.exception;

public class UnauthorizedSellerException extends RuntimeException {
    public UnauthorizedSellerException(String message) {
        super(message);
    }
}
