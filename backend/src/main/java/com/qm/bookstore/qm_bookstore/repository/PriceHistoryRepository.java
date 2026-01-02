package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.PriceHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {
    
    /**
     * Lấy toàn bộ lịch sử giá của một sản phẩm
     */
    List<PriceHistory> findByProductIdOrderByChangedAtDesc(Long productId);
    
    /**
     * Lấy lịch sử giá của một sản phẩm (phân trang)
     */
    Page<PriceHistory> findByProductIdOrderByChangedAtDesc(Long productId, Pageable pageable);
    
    /**
     * Lấy lịch sử giá mới nhất của một sản phẩm
     */
    @Query("SELECT ph FROM PriceHistory ph WHERE ph.productId = :productId ORDER BY ph.changedAt DESC LIMIT 1")
    PriceHistory findLatestByProductId(@Param("productId") Long productId);
    
    /**
     * Lấy lịch sử giá theo khoảng thời gian
     */
    List<PriceHistory> findByProductIdAndChangedAtBetweenOrderByChangedAtDesc(
            Long productId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Lấy lịch sử giá của nhiều sản phẩm
     */
    List<PriceHistory> findByProductIdInOrderByChangedAtDesc(List<Long> productIds);
    
    /**
     * Đếm số lần thay đổi giá của một sản phẩm
     */
    long countByProductId(Long productId);
}
