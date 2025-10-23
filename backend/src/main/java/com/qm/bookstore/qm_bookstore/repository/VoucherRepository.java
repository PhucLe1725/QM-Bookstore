package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findByCode(String code);
    
    @Query("SELECT v FROM Voucher v WHERE v.startDate <= :now AND v.endDate >= :now")
    List<Voucher> findActiveVouchers(LocalDateTime now);
    
    @Query("SELECT v FROM Voucher v WHERE v.code = :code AND v.startDate <= :now AND v.endDate >= :now")
    Optional<Voucher> findActiveVoucherByCode(String code, LocalDateTime now);
}
