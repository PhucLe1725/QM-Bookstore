package com.qm.bookstore.qm_bookstore.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "orders",
    indexes = {
        @Index(name = "idx_order_user_id", columnList = "user_id"),
        @Index(name = "idx_order_payment_status", columnList = "payment_status"),
        @Index(name = "idx_order_order_status", columnList = "order_status"),
        @Index(name = "idx_order_created_at", columnList = "created_at")
    }
)
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "user_id", nullable = false)
    UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    User user;

    // ========== AMOUNTS ==========
    @Column(name = "subtotal_amount", nullable = false, precision = 12, scale = 2)
    BigDecimal subtotalAmount; // Tổng tiền sản phẩm (trước giảm giá)

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    BigDecimal discountAmount = BigDecimal.ZERO; // Giảm từ voucher

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    BigDecimal totalAmount; // Tiền khách phải trả = subtotal - discount + shipping

    // ========== THREE STATUS AXES ==========
    @Column(name = "payment_status", length = 50)
    @Builder.Default
    String paymentStatus = "pending"; // pending, paid, failed, refunded

    @Column(name = "fulfillment_status", length = 50)
    String fulfillmentStatus; // shipping, delivered, pickup, returned

    @Column(name = "order_status", length = 50)
    @Builder.Default
    String orderStatus = "confirmed"; // confirmed, cancelled, closed

    // ========== PAYMENT & FULFILLMENT METHODS ==========
    @Column(name = "payment_method", length = 50)
    String paymentMethod; // prepaid, cod

    @Column(name = "fulfillment_method", length = 50)
    String fulfillmentMethod; // delivery, pickup

    // ========== VOUCHER ==========
    @Column(name = "voucher_id")
    Long voucherId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id", insertable = false, updatable = false)
    Voucher voucher;

    // ========== TRANSACTION ==========
    @Column(name = "transaction_id")
    Long transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", referencedColumnName = "id", insertable = false, updatable = false)
    Transaction transaction;

    @Column(name = "transfer_content", length = 200)
    String transferContent;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    String cancelReason;

    // ========== SHIPPING & DELIVERY INFO ==========
    @Column(name = "shipping_fee", precision = 12, scale = 2)
    BigDecimal shippingFee;

    @Column(name = "expected_delivery_time")
    LocalDateTime expectedDeliveryTime;

    @Column(name = "receiver_name", length = 100)
    String receiverName;

    @Column(name = "receiver_phone", length = 20)
    String receiverPhone;

    @Column(name = "receiver_address", columnDefinition = "TEXT")
    String receiverAddress;

    @Column(name = "note", columnDefinition = "TEXT")
    String note;

    @Builder.Default
    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT NOW()")
    LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT NOW()")
    LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @Builder.Default
    List<OrderItem> orderItems = new ArrayList<>();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}