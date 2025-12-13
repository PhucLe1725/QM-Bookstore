package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    
    // Find by order
    List<OrderItem> findByOrderId(Long orderId);
    
    // Delete by order
    void deleteByOrderId(Long orderId);
    
    // Count items in order
    Long countByOrderId(Long orderId);
    
    // Statistics: Revenue by category (paid orders only)
    @Query("SELECT oi.categoryId, SUM(oi.lineTotal) " +
           "FROM OrderItem oi " +
           "JOIN oi.order o " +
           "WHERE o.paymentStatus = 'paid' " +
           "GROUP BY oi.categoryId")
    List<Object[]> sumRevenueByCategoryForPaidOrders();
    
    // Statistics: Top selling products
    @Query("SELECT oi.productId, SUM(oi.quantity), SUM(oi.lineTotal) " +
           "FROM OrderItem oi " +
           "JOIN oi.order o " +
           "WHERE o.paymentStatus = 'paid' " +
           "GROUP BY oi.productId " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingProducts(Pageable pageable);
    
    // Find by order IDs (for reports)
    @Query("SELECT oi FROM OrderItem oi WHERE oi.orderId IN :orderIds")
    List<OrderItem> findByOrderIdIn(List<Long> orderIds);
}
