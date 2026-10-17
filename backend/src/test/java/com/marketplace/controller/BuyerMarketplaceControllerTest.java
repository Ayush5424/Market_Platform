package com.marketplace.controller;

import com.marketplace.dto.PagedResponse;
import com.marketplace.dto.ProductDetailDto;
import com.marketplace.dto.ProductSummaryDto;
import com.marketplace.exception.GlobalExceptionHandler;
import com.marketplace.service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BuyerMarketplaceController.class)
@Import(GlobalExceptionHandler.class)
class BuyerMarketplaceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @Test
    @DisplayName("Product search, filtering, and pagination via GET /api/v1/products")
    void shouldSearchAndPaginateProducts() throws Exception {
        ProductSummaryDto p1 = new ProductSummaryDto(
                1L, "UltraTech PPC Cement", "UltraTech", "High strength", "50kg Bag",
                1L, "Cement & Concrete", "http://img1", BigDecimal.valueOf(365.00), 2
        );
        PageImpl<ProductSummaryDto> page = new PageImpl<>(List.of(p1), PageRequest.of(0, 10), 1);
        PagedResponse<ProductSummaryDto> response = PagedResponse.from(page);

        when(productService.searchProducts(1L, "cement", "price", "asc", 0, 10))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/products")
                        .param("categoryId", "1")
                        .param("query", "cement")
                        .param("sortBy", "price")
                        .param("sortDirection", "asc")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].name").value("UltraTech PPC Cement"))
                .andExpect(jsonPath("$.content[0].lowestPrice").value(365.00))
                .andExpect(jsonPath("$.content[0].eligibleSellersCount").value(2))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/products/{id} returns product detail with seller offers")
    void shouldReturnProductDetail() throws Exception {
        ProductDetailDto detail = new ProductDetailDto(
                1L, "UltraTech PPC Cement", "UltraTech", "High strength", "50kg Bag",
                1L, "Cement & Concrete", "http://img1", BigDecimal.valueOf(365.00), 2, List.of()
        );

        when(productService.getProductDetail(1L)).thenReturn(detail);

        mockMvc.perform(get("/api/v1/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("UltraTech PPC Cement"))
                .andExpect(jsonPath("$.lowestPrice").value(365.00));
    }
}
