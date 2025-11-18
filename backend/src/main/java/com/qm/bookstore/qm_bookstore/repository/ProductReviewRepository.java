package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    
    @Query("SELECT pr FROM ProductReview pr WHERE pr.product.id = :productId ORDER BY pr.createdAt DESC")
    List<ProductReview> findByProductId(@Param("productId") Long productId);
    
    @Query("SELECT pr FROM ProductReview pr WHERE pr.userId = :userId ORDER BY pr.createdAt DESC")
    List<ProductReview> findByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT pr FROM ProductReview pr WHERE pr.product.id = :productId AND pr.userId = :userId")
    Optional<ProductReview> findByProductIdAndUserId(@Param("productId") Long productId, @Param("userId") UUID userId);
    
    @Query("SELECT AVG(pr.rating) FROM ProductReview pr WHERE pr.product.id = :productId")
    Double getAverageRatingByProductId(@Param("productId") Long productId);
    
    @Query("SELECT COUNT(pr) FROM ProductReview pr WHERE pr.product.id = :productId")
    Long countByProductId(@Param("productId") Long productId);
    
    boolean existsByProductIdAndUserId(Long productId, UUID userId);
}
