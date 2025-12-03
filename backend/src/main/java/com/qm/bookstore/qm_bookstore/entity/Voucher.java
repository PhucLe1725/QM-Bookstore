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
@Table(name = "vouchers",
    indexes = {
        @Index(name = "idx_voucher_code", columnList = "code"),
        @Index(name = "idx_voucher_status", columnList = "status"),
        @Index(name = "idx_voucher_valid_time", columnList = "valid_from,valid_to")
    }
)
public class Voucher {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, unique = true, length = 50)
    String code;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    BigDecimal discountAmount; // Giá trị giảm (% hoặc số tiền cố định)

    @Column(name = "discount_type", nullable = false, length = 10)
    String discountType; // PERCENT hoặc FIXED

    @Column(name = "apply_to", nullable = false, length = 20)
    String applyTo; // ORDER hoặc SHIPPING

    @Column(name = "min_order_amount", precision = 12, scale = 2)
    @Builder.Default
    BigDecimal minOrderAmount = BigDecimal.ZERO; // Giá trị đơn hàng tối thiểu

    @Column(name = "max_discount", precision = 12, scale = 2)
    BigDecimal maxDiscount; // Giảm tối đa (chỉ dùng cho PERCENT)

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(name = "valid_from", nullable = false)
    LocalDateTime validFrom;

    @Column(name = "valid_to", nullable = false)
    LocalDateTime validTo;

    @Column(name = "usage_limit")
    @Builder.Default
    Integer usageLimit = 1; // Số lượt dùng tối đa

    @Column(name = "used_count")
    @Builder.Default
    Integer usedCount = 0; // Số lượt đã dùng

    @Column(name = "per_user_limit")
    @Builder.Default
    Integer perUserLimit = 1; // Số lần sử dụng tối đa cho mỗi user

    @Column(nullable = false)
    @Builder.Default
    Boolean status = true; // Trạng thái hoạt động

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
