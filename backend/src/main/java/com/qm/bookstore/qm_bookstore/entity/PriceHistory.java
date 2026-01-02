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
@Table(name = "price_history",
    indexes = {
        @Index(name = "idx_price_history_product_id", columnList = "product_id"),
        @Index(name = "idx_price_history_changed_at", columnList = "changed_at")
    }
)
public class PriceHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    
    // ========== PRODUCT REFERENCE ==========
    @Column(name = "product_id", nullable = false)
    Long productId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    Product product;
    
    // ========== PRICE INFO ==========
    @Column(name = "old_price", nullable = false, precision = 12, scale = 2)
    BigDecimal oldPrice; // Giá cũ
    
    @Column(name = "new_price", nullable = false, precision = 12, scale = 2)
    BigDecimal newPrice; // Giá mới
    
    @Column(name = "change_percentage", precision = 6, scale = 2)
    BigDecimal changePercentage; // % thay đổi: ((newPrice - oldPrice) / oldPrice) * 100
    
    // ========== AUDIT ==========
    @Column(name = "changed_by")
    String changedBy; // UUID hoặc username của người thay đổi
    
    @Column(name = "changed_at", nullable = false)
    @Builder.Default
    LocalDateTime changedAt = LocalDateTime.now();
    
    @Column(name = "reason", columnDefinition = "TEXT")
    String reason; // Lý do thay đổi (optional)
    
    @PrePersist
    public void prePersist() {
        if (changedAt == null) {
            changedAt = LocalDateTime.now();
        }
        
        // Tính phần trăm thay đổi
        if (oldPrice != null && newPrice != null && oldPrice.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal change = newPrice.subtract(oldPrice);
            changePercentage = change.divide(oldPrice, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .setScale(2, java.math.RoundingMode.HALF_UP);
        }
    }
}
