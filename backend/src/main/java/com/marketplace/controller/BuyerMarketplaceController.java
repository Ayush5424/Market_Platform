package com.marketplace.controller;

import com.marketplace.dto.PagedResponse;
import com.marketplace.dto.ProductDetailDto;
import com.marketplace.dto.ProductSummaryDto;
import com.marketplace.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products")
public class BuyerMarketplaceController {

    private final ProductService productService;

    public BuyerMarketplaceController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<PagedResponse<ProductSummaryDto>> searchProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        PagedResponse<ProductSummaryDto> response = productService.searchProducts(
                categoryId, query, sortBy, sortDirection, page, size
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailDto> getProductDetail(@PathVariable Long id) {
        ProductDetailDto detail = productService.getProductDetail(id);
        return ResponseEntity.ok(detail);
    }
}
