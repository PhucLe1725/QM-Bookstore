package com.qm.bookstore.qm_bookstore.entity;

import com.qm.bookstore.qm_bookstore.dto.order.ComboSnapshot;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "order_items",
    indexes = {
        @Index(name = "idx_order_item_order_id", columnList = "order_id"),
        @Index(name = "idx_order_item_product_id", columnList = "product_id"),
        @Index(name = "idx_order_item_category_id", columnList = "category_id")
    }
)
public class OrderItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "order_id", nullable = false)
    Long orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    Order order;

    // For single product
    @Column(name = "product_id")
    Long productId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    Product product;

    // For combo
    @Column(name = "combo_id")
    Integer comboId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "combo_id", insertable = false, updatable = false)
    ProductCombo combo;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", length = 20)
    @Builder.Default
    ItemType itemType = ItemType.PRODUCT;

    // Snapshot for combo (at order time)
    @Column(name = "combo_name")
    String comboName;

    @Type(JsonBinaryType.class)
    @Column(name = "combo_snapshot", columnDefinition = "jsonb")
    ComboSnapshot comboSnapshot;

    @Column(name = "category_id")
    Long categoryId; // Snapshot để thống kê theo thể loại

    @Column(nullable = false)
    Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    BigDecimal unitPrice; // Giá tại thời điểm đặt hàng

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    BigDecimal lineTotal; // unit_price * quantity

    @Builder.Default
    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT NOW()")
    LocalDateTime createdAt = LocalDateTime.now();
}
