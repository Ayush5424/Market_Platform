package com.marketplace.service;

import com.marketplace.dto.SellerDto;
import com.marketplace.entity.Seller;
import com.marketplace.entity.SellerStatus;
import com.marketplace.exception.ForbiddenException;
import com.marketplace.exception.ResourceNotFoundException;
import com.marketplace.exception.UnauthorizedSellerException;
import com.marketplace.repository.SellerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SellerService {

    private final SellerRepository sellerRepository;

    public SellerService(SellerRepository sellerRepository) {
        this.sellerRepository = sellerRepository;
    }

    public List<SellerDto> getAllSellers() {
        return sellerRepository.findAllByOrderByBusinessNameAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public SellerDto getSellerById(Long id) {
        return toDto(getSellerEntity(id));
    }

    public Seller getSellerEntity(Long id) {
        if (id == null) {
            throw new UnauthorizedSellerException("Seller identity header (X-Seller-Id) is missing or invalid.");
        }
        return sellerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with id: " + id));
    }


    public Seller validateSellerForListingOperations(Long sellerId) {
        Seller seller = getSellerEntity(sellerId);
        if (seller.getStatus() == SellerStatus.PENDING) {
            throw new ForbiddenException("Seller account '" + seller.getBusinessName() + "' is currently PENDING approval. Only APPROVED sellers can create or modify listings.");
        }
        if (seller.getStatus() == SellerStatus.REJECTED) {
            throw new ForbiddenException("Seller account '" + seller.getBusinessName() + "' has been REJECTED. Listing operations are prohibited.");
        }
        return seller;
    }

    @Transactional
    public SellerDto updateSellerStatus(Long sellerId, SellerStatus newStatus) {
        Seller seller = getSellerEntity(sellerId);
        seller.setStatus(newStatus);
        Seller saved = sellerRepository.save(seller);
        return toDto(saved);
    }

    public SellerDto toDto(Seller seller) {
        return new SellerDto(
                seller.getId(),
                seller.getName(),
                seller.getBusinessName(),
                seller.getEmail(),
                seller.getPhone(),
                seller.getStatus(),
                seller.getRating()
        );
    }
}
