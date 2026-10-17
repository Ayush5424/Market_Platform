package com.marketplace.repository;

import com.marketplace.dto.ProductSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductRepositoryCustom {
    Page<ProductSummaryDto> searchProducts(Long categoryId, String searchTerm, String sortBy, String sortDirection, Pageable pageable);
}
