package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.InventoryTransactionHeader;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository cho InventoryTransactionHeader
 * Chứa các query kiểm tra duplicate và lọc lịch sử kho
 */
@Repository
public interface InventoryTransactionHeaderRepository extends JpaRepository<InventoryTransactionHeader, Long> {
    
    /**
     * Kiểm tra giao dịch xuất kho (OUT) từ đơn hàng đã tồn tại chưa
     * Dùng để chặn trùng OUT theo ORDER
     */
    @Query("SELECT h FROM InventoryTransactionHeader h " +
           "WHERE h.transactionType = 'OUT' " +
           "AND h.referenceType = 'ORDER' " +
           "AND h.referenceId = :orderId")
    Optional<InventoryTransactionHeader> findOutTransactionByOrderId(@Param("orderId") Integer orderId);

    /**
     * Kiểm tra đã tồn tại transaction với reference chưa
     */
    boolean existsByTransactionTypeAndReferenceTypeAndReferenceId(
        String transactionType, 
        String referenceType, 
        Integer referenceId
    );

    /**
     * Tìm tất cả transaction theo loại
     */
    Page<InventoryTransactionHeader> findByTransactionType(String transactionType, Pageable pageable);

    /**
     * Tìm tất cả transaction theo reference type
     */
    Page<InventoryTransactionHeader> findByReferenceType(String referenceType, Pageable pageable);

    /**
     * Tìm transaction theo reference
     */
    Page<InventoryTransactionHeader> findByReferenceTypeAndReferenceId(
        String referenceType, 
        Integer referenceId, 
        Pageable pageable
    );

    /**
     * Query phức tạp với nhiều filter (without JOIN FETCH to avoid pagination issues)
     */
    @Query("SELECT h FROM InventoryTransactionHeader h " +
           "WHERE (:transactionType IS NULL OR :transactionType = '' OR h.transactionType = :transactionType) " +
           "AND (:referenceType IS NULL OR :referenceType = '' OR h.referenceType = :referenceType) " +
           "AND (:referenceId IS NULL OR h.referenceId = :referenceId) " +
           "AND (:productId IS NULL OR EXISTS (" +
           "    SELECT 1 FROM InventoryTransactionItem i " +
           "    WHERE i.headerId = h.id AND i.productId = :productId" +
           "))")
    Page<InventoryTransactionHeader> findByFilters(
        @Param("transactionType") String transactionType,
        @Param("referenceType") String referenceType,
        @Param("referenceId") Integer referenceId,
        @Param("productId") Long productId,
        Pageable pageable
    );
}
