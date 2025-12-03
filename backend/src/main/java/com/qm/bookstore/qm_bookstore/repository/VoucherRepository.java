package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.Voucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    
    // Tìm voucher theo code
    Optional<Voucher> findByCode(String code);
    
    // Kiểm tra code đã tồn tại chưa
    boolean existsByCode(String code);
    
    // Tìm voucher active theo code (status = TRUE)
    @Query("SELECT v FROM Voucher v WHERE v.code = :code AND v.status = true")
    Optional<Voucher> findActiveVoucherByCode(@Param("code") String code);
    
    // Lấy danh sách voucher active và còn hiệu lực
    @Query("SELECT v FROM Voucher v WHERE v.status = true " +
           "AND v.validFrom <= :now AND v.validTo >= :now " +
           "AND v.usedCount < v.usageLimit")
    List<Voucher> findAvailableVouchers(@Param("now") LocalDateTime now);
    
    // Lấy tất cả voucher với filter
    @Query("SELECT v FROM Voucher v WHERE " +
           "(:status IS NULL OR v.status = :status) AND " +
           "(:applyTo IS NULL OR v.applyTo = :applyTo)")
    Page<Voucher> findByFilters(
        @Param("status") Boolean status,
        @Param("applyTo") String applyTo,
        Pageable pageable
    );
    
    // Tăng used_count an toàn (chỉ khi chưa đạt limit)
    @Modifying
    @Query("UPDATE Voucher v SET v.usedCount = v.usedCount + 1 " +
           "WHERE v.id = :id AND v.usedCount < v.usageLimit")
    int incrementUsedCount(@Param("id") Long id);
    
    // Giảm used_count (cho trường hợp rollback)
    @Modifying
    @Query("UPDATE Voucher v SET v.usedCount = v.usedCount - 1 " +
           "WHERE v.id = :id AND v.usedCount > 0")
    int decrementUsedCount(@Param("id") Long id);
}

