package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    Optional<Transaction> findByFingerprint(String fingerprint);
    
    boolean existsByFingerprint(String fingerprint);
    
    List<Transaction> findByCreditAccount(String creditAccount);
    
    List<Transaction> findByPaymentDetailsContainingIgnoreCase(String orderCode);
    
    Optional<Transaction> findFirstByPaymentDetailsContainingIgnoreCaseAndVerifiedFalse(String orderCode);
    
    /**
     * Tìm transaction theo transfer content (QMORD123) và amount
     * Dùng cho validate payment
     */
    @Query("SELECT t FROM Transaction t WHERE " +
           "UPPER(t.paymentDetails) LIKE UPPER(CONCAT('%', :transferContent, '%')) " +
           "AND t.amount = :amount " +
           "AND t.transactionDate >= :afterDate " +
           "ORDER BY t.transactionDate DESC")
    Optional<Transaction> findByTransferContentAndAmountAndDateAfter(
        @Param("transferContent") String transferContent,
        @Param("amount") BigDecimal amount,
        @Param("afterDate") LocalDateTime afterDate
    );
}
