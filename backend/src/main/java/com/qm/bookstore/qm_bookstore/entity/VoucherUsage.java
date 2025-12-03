package com.qm.bookstore.qm_bookstore.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "voucher_usage",
    indexes = {
        @Index(name = "idx_voucher_usage_user", columnList = "user_id,voucher_id"),
        @Index(name = "idx_voucher_usage_voucher", columnList = "voucher_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_voucher_order", columnNames = {"voucher_id", "order_id"})
    }
)
public class VoucherUsage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "voucher_id", nullable = false)
    Long voucherId;

    @Column(name = "user_id", nullable = false)
    UUID userId;

    @Column(name = "order_id", nullable = false)
    Long orderId;

    @Builder.Default
    @Column(name = "used_at", nullable = false)
    LocalDateTime usedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        usedAt = LocalDateTime.now();
    }
}
