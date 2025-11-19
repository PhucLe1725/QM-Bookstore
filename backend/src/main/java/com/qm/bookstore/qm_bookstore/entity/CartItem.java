package com.qm.bookstore.qm_bookstore.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "cart_items")
public class CartItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "cart_id", nullable = false)
    Long cartId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", insertable = false, updatable = false)
    Cart cart;

    @Column(name = "product_id", nullable = false)
    Long productId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    Product product;

    @Column(nullable = false)
    Integer quantity;

    @Builder.Default
    @Column(name = "is_selected", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    Boolean isSelected = false;

    @Builder.Default
    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT NOW()")
    LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT NOW()")
    LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
