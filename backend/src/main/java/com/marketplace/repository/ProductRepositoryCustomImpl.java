package com.marketplace.repository;

import com.marketplace.dto.ProductSummaryDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class ProductRepositoryCustomImpl implements ProductRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<ProductSummaryDto> searchProducts(Long categoryId, String searchTerm, String sortBy, String sortDirection, Pageable pageable) {
        StringBuilder jpql = new StringBuilder(
                "SELECT new com.marketplace.dto.ProductSummaryDto(" +
                        " p.id, p.name, p.brand, p.description, p.unit, c.id, c.name, p.imageUrl, " +
                        " MIN(CASE WHEN (l.isActive = true AND l.stockQuantity >= l.minOrderQuantity AND s.status = com.marketplace.entity.SellerStatus.APPROVED) THEN l.price ELSE null END), " +
                        " COUNT(CASE WHEN (l.isActive = true AND l.stockQuantity >= l.minOrderQuantity AND s.status = com.marketplace.entity.SellerStatus.APPROVED) THEN 1 ELSE null END) " +
                        ") " +
                        "FROM Product p " +
                        "JOIN p.category c " +
                        "LEFT JOIN p.listings l " +
                        "LEFT JOIN l.seller s " +
                        "WHERE 1=1 "
        );

        StringBuilder countJpql = new StringBuilder(
                "SELECT COUNT(DISTINCT p.id) FROM Product p " +
                        "JOIN p.category c " +
                        "WHERE 1=1 "
        );

        Map<String, Object> params = new HashMap<>();

        if (categoryId != null) {
            jpql.append(" AND c.id = :categoryId ");
            countJpql.append(" AND c.id = :categoryId ");
            params.put("categoryId", categoryId);
        }

        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            jpql.append(" AND (LOWER(p.name) LIKE :term OR LOWER(p.brand) LIKE :term) ");
            countJpql.append(" AND (LOWER(p.name) LIKE :term OR LOWER(p.brand) LIKE :term) ");
            params.put("term", "%" + searchTerm.trim().toLowerCase() + "%");
        }

        jpql.append(" GROUP BY p.id, p.name, p.brand, p.description, p.unit, c.id, c.name, p.imageUrl ");

        // Database-side sorting
        boolean isDesc = "desc".equalsIgnoreCase(sortDirection);
        if ("price".equalsIgnoreCase(sortBy) || "lowestPrice".equalsIgnoreCase(sortBy)) {
            String dir = isDesc ? "DESC NULLS LAST" : "ASC NULLS LAST";
            jpql.append(" ORDER BY MIN(CASE WHEN (l.isActive = true AND l.stockQuantity >= l.minOrderQuantity AND s.status = com.marketplace.entity.SellerStatus.APPROVED) THEN l.price ELSE null END) ")
                    .append(dir)
                    .append(", p.name ASC ");
        } else if ("brand".equalsIgnoreCase(sortBy)) {
            String dir = isDesc ? "DESC" : "ASC";
            jpql.append(" ORDER BY p.brand ").append(dir).append(", p.name ASC ");
        } else {
            String dir = isDesc ? "DESC" : "ASC";
            jpql.append(" ORDER BY p.name ").append(dir).append(", p.id ASC ");
        }

        TypedQuery<ProductSummaryDto> query = entityManager.createQuery(jpql.toString(), ProductSummaryDto.class);
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql.toString(), Long.class);

        params.forEach((k, v) -> {
            query.setParameter(k, v);
            countQuery.setParameter(k, v);
        });

        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<ProductSummaryDto> results = query.getResultList();
        Long total = countQuery.getSingleResult();

        return new PageImpl<>(results, pageable, total);
    }
}
