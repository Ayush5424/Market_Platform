package com.marketplace.repository;

import com.marketplace.entity.Seller;
import com.marketplace.entity.SellerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<Seller, Long> {
    List<Seller> findAllByOrderByBusinessNameAsc();
    List<Seller> findByStatusOrderByBusinessNameAsc(SellerStatus status);
    Optional<Seller> findByEmailIgnoreCase(String email);
}
