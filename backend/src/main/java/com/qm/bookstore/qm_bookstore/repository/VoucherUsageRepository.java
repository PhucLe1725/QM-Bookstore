package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.VoucherUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VoucherUsageRepository extends JpaRepository<VoucherUsage, Long> {
    
    /**
     * Đếm số lần user đã sử dụng voucher
     */
    @Query("SELECT COUNT(vu) FROM VoucherUsage vu WHERE vu.voucherId = :voucherId AND vu.userId = :userId")
    long countByVoucherIdAndUserId(@Param("voucherId") Long voucherId, @Param("userId") UUID userId);
    
    /**
     * Kiểm tra user đã sử dụng voucher cho order này chưa
     */
    boolean existsByVoucherIdAndOrderId(Long voucherId, Long orderId);
}
