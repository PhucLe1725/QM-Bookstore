package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.ProductComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductCommentRepository extends JpaRepository<ProductComment, Long> {
    
    // Lấy tất cả comments của một product
    List<ProductComment> findByProductIdOrderByCreatedAtDesc(Long productId);
    
    // Lấy tất cả comments gốc (không phải reply) của một product
    @Query("SELECT c FROM ProductComment c WHERE c.product.id = :productId AND c.parentComment IS NULL ORDER BY c.createdAt DESC")
    List<ProductComment> findRootCommentsByProductId(@Param("productId") Long productId);
    
    // Lấy tất cả replies của một comment
    @Query("SELECT c FROM ProductComment c WHERE c.parentComment.id = :parentId ORDER BY c.createdAt ASC")
    List<ProductComment> findRepliesByParentId(@Param("parentId") Long parentId);
    
    // Lấy tất cả comments của một user
    List<ProductComment> findByUserIdOrderByCreatedAtDesc(UUID userId);
    
    // Đếm số lượng comments của một product
    Long countByProductId(Long productId);
    
    // Đếm số lượng replies của một comment
    Long countByParentCommentId(Long parentId);
    
    // Admin: Get all comments with pagination
    @Query("SELECT c FROM ProductComment c ORDER BY c.createdAt DESC")
    Page<ProductComment> findAllComments(Pageable pageable);
    
    // Admin: Get all root comments (no parent) with pagination
    @Query("SELECT c FROM ProductComment c WHERE c.parentComment IS NULL ORDER BY c.createdAt DESC")
    Page<ProductComment> findAllRootComments(Pageable pageable);
}
