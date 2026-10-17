package com.marketplace.service;

import com.marketplace.entity.Seller;
import com.marketplace.entity.SellerStatus;
import com.marketplace.exception.ForbiddenException;
import com.marketplace.exception.ResourceNotFoundException;
import com.marketplace.exception.UnauthorizedSellerException;
import com.marketplace.repository.SellerRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SellerServiceTest {

    @Mock
    private SellerRepository sellerRepository;

    @InjectMocks
    private SellerService sellerService;

    @Test
    @DisplayName("Restrictions on pending seller: throws ForbiddenException")
    void shouldRejectPendingSellerFromListingOperations() {
        Seller pendingSeller = new Seller(5L, "Pending Guy", "Titan Steel", "titan@test.com", "123", SellerStatus.PENDING, BigDecimal.valueOf(4.0));
        when(sellerRepository.findById(5L)).thenReturn(Optional.of(pendingSeller));

        assertThatThrownBy(() -> sellerService.validateSellerForListingOperations(5L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("PENDING approval");
    }

    @Test
    @DisplayName("Restrictions on rejected seller: throws ForbiddenException")
    void shouldRejectRejectedSellerFromListingOperations() {
        Seller rejectedSeller = new Seller(6L, "Marcus Vance", "Blacklisted Ltd", "vance@test.com", "123", SellerStatus.REJECTED, BigDecimal.valueOf(2.0));
        when(sellerRepository.findById(6L)).thenReturn(Optional.of(rejectedSeller));

        assertThatThrownBy(() -> sellerService.validateSellerForListingOperations(6L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("REJECTED");
    }

    @Test
    @DisplayName("Approved seller: successfully passes validation")
    void shouldAllowApprovedSeller() {
        Seller approved = new Seller(1L, "Vikram Mehta", "Prime Builders", "prime@test.com", "123", SellerStatus.APPROVED, BigDecimal.valueOf(4.8));
        when(sellerRepository.findById(1L)).thenReturn(Optional.of(approved));

        Seller result = sellerService.validateSellerForListingOperations(1L);
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.isApproved()).isTrue();
    }

    @Test
    @DisplayName("Missing seller id: throws UnauthorizedSellerException")
    void shouldThrowWhenSellerIdIsNull() {
        assertThatThrownBy(() -> sellerService.getSellerEntity(null))
                .isInstanceOf(UnauthorizedSellerException.class)
                .hasMessageContaining("X-Seller-Id");
    }

    @Test
    @DisplayName("Unknown seller id: throws ResourceNotFoundException")
    void shouldThrowWhenSellerNotFound() {
        when(sellerRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sellerService.getSellerEntity(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found");
    }
}
