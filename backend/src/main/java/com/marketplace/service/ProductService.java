package com.marketplace.service;

import com.marketplace.dto.*;
import com.marketplace.entity.Category;
import com.marketplace.entity.Product;
import com.marketplace.entity.SellerListing;
import com.marketplace.exception.BadRequestException;
import com.marketplace.exception.ResourceNotFoundException;
import com.marketplace.repository.ProductRepository;
import com.marketplace.repository.SellerListingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final SellerListingRepository sellerListingRepository;
    private final CategoryService categoryService;

    public ProductService(ProductRepository productRepository,
                          SellerListingRepository sellerListingRepository,
                          CategoryService categoryService) {
        this.productRepository = productRepository;
        this.sellerListingRepository = sellerListingRepository;
        this.categoryService = categoryService;
    }

    public PagedResponse<ProductSummaryDto> searchProducts(Long categoryId,
                                                          String searchTerm,
                                                          String sortBy,
                                                          String sortDirection,
                                                          int page,
                                                          int size) {
        if (page < 0) {
            throw new BadRequestException("Page index cannot be negative");
        }
        if (size <= 0 || size > 100) {
            throw new BadRequestException("Page size must be between 1 and 100");
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<ProductSummaryDto> productPage = productRepository.searchProducts(categoryId, searchTerm, sortBy, sortDirection, pageable);
        return PagedResponse.from(productPage);
    }

    public ProductDetailDto getProductDetail(Long productId) {
        Product product = productRepository.findByIdWithCategory(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        List<SellerListing> listings = sellerListingRepository.findAllListingsByProductId(productId);

        List<SellerOfferDto> offers = listings.stream()
                .map(l -> new SellerOfferDto(
                        l.getId(),
                        l.getSeller().getId(),
                        l.getSeller().getName(),
                        l.getSeller().getBusinessName(),
                        l.getSeller().getRating(),
                        l.getPrice(),
                        l.getStockQuantity(),
                        l.getMinOrderQuantity(),
                        l.isEligibleForBuyerDiscovery()
                ))
                .toList();

        List<SellerOfferDto> eligibleOffers = offers.stream()
                .filter(SellerOfferDto::isAvailable)
                .toList();

        BigDecimal lowestPrice = eligibleOffers.isEmpty()
                ? null
                : eligibleOffers.stream()
                    .map(SellerOfferDto::price)
                    .min(BigDecimal::compareTo)
                    .orElse(null);

        return new ProductDetailDto(
                product.getId(),
                product.getName(),
                product.getBrand(),
                product.getDescription(),
                product.getUnit(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getImageUrl(),
                lowestPrice,
                eligibleOffers.size(),
                offers
        );
    }

    public Product getProductEntity(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    @Transactional
    public Product createProduct(CreateProductRequest request) {
        Category category = categoryService.getCategoryEntity(request.categoryId());

        Product product = new Product();
        product.setName(request.name().trim());
        product.setBrand(request.brand().trim());
        product.setDescription(request.description() != null ? request.description().trim() : null);
        product.setUnit(request.unit().trim());
        product.setCategory(category);
        product.setImageUrl(request.imageUrl() != null ? request.imageUrl().trim() : null);

        return productRepository.save(product);
    }
}
