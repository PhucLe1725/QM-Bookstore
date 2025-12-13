package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // Find by user
    Page<Order> findByUserId(UUID userId, Pageable pageable);
    
    // Find by user and multiple status axes
    @Query("SELECT o FROM Order o WHERE o.userId = :userId " +
           "AND (:paymentStatus IS NULL OR o.paymentStatus = :paymentStatus) " +
           "AND (:fulfillmentStatus IS NULL OR o.fulfillmentStatus = :fulfillmentStatus) " +
           "AND (:orderStatus IS NULL OR o.orderStatus = :orderStatus)")
    Page<Order> findByUserIdAndStatuses(
        @Param("userId") UUID userId,
        @Param("paymentStatus") String paymentStatus,
        @Param("fulfillmentStatus") String fulfillmentStatus,
        @Param("orderStatus") String orderStatus,
        Pageable pageable
    );
    
    // Find by multiple status axes (admin)
    @Query("SELECT o FROM Order o WHERE " +
           "(:paymentStatus IS NULL OR o.paymentStatus = :paymentStatus) " +
           "AND (:fulfillmentStatus IS NULL OR o.fulfillmentStatus = :fulfillmentStatus) " +
           "AND (:orderStatus IS NULL OR o.orderStatus = :orderStatus)")
    Page<Order> findByStatuses(
        @Param("paymentStatus") String paymentStatus,
        @Param("fulfillmentStatus") String fulfillmentStatus,
        @Param("orderStatus") String orderStatus,
        Pageable pageable
    );
    
    // Find by date range
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :fromDate AND :toDate")
    Page<Order> findByDateRange(
        @Param("fromDate") LocalDateTime fromDate,
        @Param("toDate") LocalDateTime toDate,
        Pageable pageable
    );
    
    // Statistics: Total revenue (paid orders only)
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.paymentStatus = 'paid'")
    BigDecimal sumTotalRevenue();
    
    // Statistics: Total discount given
    @Query("SELECT SUM(o.discountAmount) FROM Order o WHERE o.paymentStatus = 'paid'")
    BigDecimal sumTotalDiscount();
    
    // Statistics: Revenue before discount
    @Query("SELECT SUM(o.subtotalAmount) FROM Order o WHERE o.paymentStatus = 'paid'")
    BigDecimal sumSubtotalRevenue();
    
    // Count by payment status
    Long countByPaymentStatus(String paymentStatus);
    
    // Count by order status
    Long countByOrderStatus(String orderStatus);
    
    // Check if order belongs to user
    boolean existsByIdAndUserId(Long id, UUID userId);
    
    // Check if user has purchased a product (paid and delivered orders)
    @Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END " +
           "FROM Order o JOIN o.orderItems oi " +
           "WHERE o.userId = :userId " +
           "AND oi.productId = :productId " +
           "AND o.paymentStatus = 'paid' " +
           "AND o.orderStatus != 'cancelled'")
    boolean hasUserPurchasedProduct(@Param("userId") UUID userId, @Param("productId") Long productId);
    
    // Find orders by date range (for reports)
    @Query("SELECT o FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate")
    List<Order> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}

