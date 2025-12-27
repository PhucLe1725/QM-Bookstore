package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.InventoryTransactionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository cho InventoryTransactionItem
 */
@Repository
public interface InventoryTransactionItemRepository extends JpaRepository<InventoryTransactionItem, Long> {
    
    /**
     * Tìm tất cả items của một header
     */
    List<InventoryTransactionItem> findByHeaderId(Long headerId);

    /**
     * Tìm tất cả items theo product
     */
    List<InventoryTransactionItem> findByProductId(Long productId);

    /**
     * Xóa tất cả items của một header
     */
    void deleteByHeaderId(Long headerId);

    /**
     * Tính tổng biến động tồn kho theo sản phẩm
     * PLUS = +, MINUS = -
     */
    @Query("SELECT " +
           "CASE WHEN i.changeType = 'PLUS' THEN SUM(i.quantity) ELSE 0 END - " +
           "CASE WHEN i.changeType = 'MINUS' THEN SUM(i.quantity) ELSE 0 END " +
           "FROM InventoryTransactionItem i " +
           "WHERE i.productId = :productId " +
           "GROUP BY i.changeType")
    Integer calculateNetChangeByProductId(@Param("productId") Long productId);
}
