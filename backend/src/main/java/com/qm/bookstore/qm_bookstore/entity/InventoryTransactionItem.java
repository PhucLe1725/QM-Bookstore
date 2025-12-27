package com.qm.bookstore.qm_bookstore.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Đại diện cho từng dòng sản phẩm trong giao dịch kho
 * Mang dấu tăng/giảm (PLUS/MINUS)
 * Là đơn vị thực sự tác động tồn kho
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "inventory_transaction_items",
    indexes = {
        @Index(name = "idx_inventory_item_header_id", columnList = "header_id"),
        @Index(name = "idx_inventory_item_product_id", columnList = "product_id")
    }
)
public class InventoryTransactionItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    /**
     * Tham chiếu đến header
     */
    @Column(name = "header_id", nullable = false)
    Long headerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "header_id", insertable = false, updatable = false)
    InventoryTransactionHeader header;

    /**
     * ID sản phẩm bị tác động
     */
    @Column(name = "product_id", nullable = false)
    Long productId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    Product product;

    /**
     * Loại thay đổi: PLUS (tăng), MINUS (giảm)
     */
    @Column(name = "change_type", nullable = false, length = 10)
    String changeType;

    /**
     * Số lượng thay đổi (luôn dương)
     */
    @Column(nullable = false)
    Integer quantity;
}
