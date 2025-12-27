package com.qm.bookstore.qm_bookstore.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "transactions")
public class Transaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    
    @Column(nullable = false, length = 255)
    String fingerprint; // SHA-256 hash để tránh duplicate
    
    @Column(name = "transaction_date", nullable = false)
    LocalDateTime transactionDate;
    
    @Column(name = "credit_account", nullable = false, length = 50)
    String creditAccount; // Tài khoản người nhận (shop/business account)
    
    @Column(nullable = false, precision = 19, scale = 2)
    BigDecimal amount; // Số tiền giao dịch
    
    @Column(name = "payment_details", columnDefinition = "TEXT")
    String paymentDetails; // Nội dung chuyển khoản (từ email ngân hàng)
    
    @Column(nullable = false)
    @Builder.Default
    Boolean verified = false;
    
    @Column(name = "created_at")
    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
