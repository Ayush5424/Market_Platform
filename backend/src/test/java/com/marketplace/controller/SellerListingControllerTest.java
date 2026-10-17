package com.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.dto.CreateListingRequest;
import com.marketplace.dto.SellerListingDto;
import com.marketplace.dto.UpdateListingRequest;
import com.marketplace.exception.ConflictException;
import com.marketplace.exception.ForbiddenException;
import com.marketplace.exception.GlobalExceptionHandler;
import com.marketplace.service.ListingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SellerListingController.class)
@Import(GlobalExceptionHandler.class)
class SellerListingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ListingService listingService;

    @Test
    @DisplayName("Missing X-Seller-Id header returns 401 Unauthorized")
    void shouldReturn401WhenSellerHeaderMissing() throws Exception {
        mockMvc.perform(get("/api/v1/seller/listings"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Invalid price and quantity validation returns 400 Bad Request")
    void shouldReturn400WhenPayloadInvalid() throws Exception {
        // Price is 0 (must be >= 0.01), stock is -5 (must be >= 0), moq is 0 (must be >= 1)
        CreateListingRequest invalid = new CreateListingRequest(1L, null, BigDecimal.ZERO, -5, 0, true);

        mockMvc.perform(post("/api/v1/seller/listings")
                        .header("X-Seller-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.price").exists())
                .andExpect(jsonPath("$.validationErrors.stockQuantity").exists())
                .andExpect(jsonPath("$.validationErrors.minOrderQuantity").exists());
    }

    @Test
    @DisplayName("Seller ownership enforcement: returns 403 Forbidden on another seller's listing")
    void shouldReturn403WhenForbidden() throws Exception {
        UpdateListingRequest update = new UpdateListingRequest(BigDecimal.valueOf(10.0), 100, 10, true, 0L);

        when(listingService.updateListing(eq(2L), eq(500L), any()))
                .thenThrow(new ForbiddenException("Forbidden: You do not have permission to access or modify listings owned by another seller."));

        mockMvc.perform(put("/api/v1/seller/listings/500")
                        .header("X-Seller-Id", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("Concurrent update conflict: returns 409 Conflict on version mismatch")
    void shouldReturn409OnConflict() throws Exception {
        UpdateListingRequest update = new UpdateListingRequest(BigDecimal.valueOf(10.0), 100, 10, true, 0L);

        when(listingService.updateListing(eq(1L), eq(500L), any()))
                .thenThrow(new ConflictException("Listing has been modified concurrently."));

        mockMvc.perform(put("/api/v1/seller/listings/500")
                        .header("X-Seller-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"));
    }

    @Test
    @DisplayName("Valid create listing: returns 201 Created")
    void shouldReturn201OnValidCreate() throws Exception {
        CreateListingRequest valid = new CreateListingRequest(10L, null, BigDecimal.valueOf(380.00), 100, 5, true);

        SellerListingDto dto = new SellerListingDto(
                99L, 1L, "Prime Builders", 10L, "Sample Product", "Brand", "Bag", "http://img",
                1L, "Cement", BigDecimal.valueOf(380.00), 100, 5, true, 0L, OffsetDateTime.now(), OffsetDateTime.now()
        );

        when(listingService.createListing(eq(1L), any())).thenReturn(dto);

        mockMvc.perform(post("/api/v1/seller/listings")
                        .header("X-Seller-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(valid)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(99))
                .andExpect(jsonPath("$.price").value(380.00));
    }
}
