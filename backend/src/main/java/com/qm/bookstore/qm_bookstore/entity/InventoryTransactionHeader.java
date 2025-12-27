package com.qm.bookstore.qm_bookstore.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Đại diện cho một sự kiện kho (IN/OUT/DAMAGED/STOCKTAKE)
 * Mỗi header có thể chứa nhiều sản phẩm
 * Gắn với nguồn phát sinh (ORDER/MANUAL/STOCKTAKE)
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "inventory_transaction_headers",
    indexes = {
        @Index(name = "idx_inventory_header_transaction_type", columnList = "transaction_type"),
        @Index(name = "idx_inventory_header_reference", columnList = "reference_type, reference_id"),
        @Index(name = "idx_inventory_header_created_at", columnList = "created_at")
    },
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_inventory_out_order",
            columnNames = {"reference_type", "reference_id", "transaction_type"}
        )
    }
)
public class InventoryTransactionHeader {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    /**
     * Loại giao dịch kho: IN, OUT, DAMAGED, STOCKTAKE
     */
    @Column(name = "transaction_type", nullable = false, length = 20)
    String transactionType;

    /**
     * Nguồn phát sinh: ORDER, MANUAL, STOCKTAKE
     */
    @Column(name = "reference_type", length = 30)
    String referenceType;

    /**
     * ID tham chiếu đến nguồn (order_id, ...)
     */
    @Column(name = "reference_id")
    Integer referenceId;

    /**
     * Ghi chú nghiệp vụ
     */
    @Column(columnDefinition = "TEXT")
    String note;

    /**
     * Thời gian tạo giao dịch
     */
    @Builder.Default
    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT NOW()")
    LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Danh sách chi tiết sản phẩm trong giao dịch
     */
    @OneToMany(mappedBy = "header", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<InventoryTransactionItem> items = new ArrayList<>();

    /**
     * Helper method để thêm item vào header
     */
    public void addItem(InventoryTransactionItem item) {
        items.add(item);
        item.setHeader(this);
        // IMPORTANT: Manually set headerId field because @JoinColumn has insertable=false
        if (this.id != null) {
            item.setHeaderId(this.id);
        }
    }

    /**
     * Helper method để xóa item khỏi header
     */
    public void removeItem(InventoryTransactionItem item) {
        items.remove(item);
        item.setHeader(null);
    }
}
