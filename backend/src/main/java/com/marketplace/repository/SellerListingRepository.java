package com.marketplace.repository;

import com.marketplace.entity.SellerListing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerListingRepository extends JpaRepository<SellerListing, Long> {

    @Query("SELECT l FROM SellerListing l " +
           "JOIN FETCH l.product p " +
           "JOIN FETCH p.category c " +
           "WHERE l.seller.id = :sellerId " +
           "ORDER BY l.updatedAt DESC")
    Page<SellerListing> findBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);

    Optional<SellerListing> findBySellerIdAndProductId(Long sellerId, Long productId);

    boolean existsBySellerIdAndProductId(Long sellerId, Long productId);

    @Query("SELECT l FROM SellerListing l " +
           "JOIN FETCH l.seller s " +
           "WHERE l.product.id = :productId " +
           "  AND l.isActive = true " +
           "  AND s.status = com.marketplace.entity.SellerStatus.APPROVED " +
           "  AND l.stockQuantity >= l.minOrderQuantity " +
           "ORDER BY l.price ASC")
    List<SellerListing> findEligibleListingsByProductId(@Param("productId") Long productId);

    @Query("SELECT l FROM SellerListing l " +
           "JOIN FETCH l.seller s " +
           "WHERE l.product.id = :productId " +
           "ORDER BY l.price ASC")
    List<SellerListing> findAllListingsByProductId(@Param("productId") Long productId);

    long countByIsActiveTrue();

    @Query("SELECT l FROM SellerListing l " +
           "JOIN FETCH l.seller s " +
           "JOIN FETCH l.product p " +
           "JOIN FETCH p.category c")
    List<SellerListing> findAllWithDetails();
}
