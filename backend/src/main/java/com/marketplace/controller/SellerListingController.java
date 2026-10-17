package com.marketplace.controller;

import com.marketplace.dto.CreateListingRequest;
import com.marketplace.dto.PagedResponse;
import com.marketplace.dto.SellerListingDto;
import com.marketplace.dto.UpdateListingRequest;
import com.marketplace.exception.UnauthorizedSellerException;
import com.marketplace.service.ListingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/seller/listings")
public class SellerListingController {

    private final ListingService listingService;

    public SellerListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping
    public ResponseEntity<PagedResponse<SellerListingDto>> getMyListings(
            @RequestHeader(value = "X-Seller-Id", required = false) Long sellerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        validateHeader(sellerId);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(listingService.getSellerListings(sellerId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SellerListingDto> getListingById(
            @RequestHeader(value = "X-Seller-Id", required = false) Long sellerId,
            @PathVariable Long id
    ) {
        validateHeader(sellerId);
        return ResponseEntity.ok(listingService.getListingById(sellerId, id));
    }

    @PostMapping
    public ResponseEntity<SellerListingDto> createListing(
            @RequestHeader(value = "X-Seller-Id", required = false) Long sellerId,
            @Valid @RequestBody CreateListingRequest request
    ) {
        validateHeader(sellerId);
        SellerListingDto created = listingService.createListing(sellerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SellerListingDto> updateListing(
            @RequestHeader(value = "X-Seller-Id", required = false) Long sellerId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateListingRequest request
    ) {
        validateHeader(sellerId);
        SellerListingDto updated = listingService.updateListing(sellerId, id, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<SellerListingDto> toggleListingStatus(
            @RequestHeader(value = "X-Seller-Id", required = false) Long sellerId,
            @PathVariable Long id,
            @RequestParam boolean active
    ) {
        validateHeader(sellerId);
        SellerListingDto updated = listingService.toggleListingStatus(sellerId, id, active);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(
            @RequestHeader(value = "X-Seller-Id", required = false) Long sellerId,
            @PathVariable Long id
    ) {
        validateHeader(sellerId);
        listingService.deleteListing(sellerId, id);
        return ResponseEntity.noContent().build();
    }

    private void validateHeader(Long sellerId) {
        if (sellerId == null) {
            throw new UnauthorizedSellerException("Authentication required: Missing 'X-Seller-Id' header.");
        }
    }
}
