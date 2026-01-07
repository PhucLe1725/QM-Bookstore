package com.qm.bookstore.qm_bookstore.dto.inventory.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

/**
 * DTO trả về thông tin chi tiết sản phẩm trong giao dịch kho
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryTransactionItemResponse {

    Long id;

    Long productId;

    String productName; // Tên sản phẩm

    String productSku; // SKU sản phẩm

    String changeType; // PLUS hoặc MINUS

    Integer quantity; // Số lượng thay đổi

    BigDecimal unitPrice; // Giá nhập đơn vị

    BigDecimal totalPrice; // Tổng giá trị (unitPrice × quantity)
}
