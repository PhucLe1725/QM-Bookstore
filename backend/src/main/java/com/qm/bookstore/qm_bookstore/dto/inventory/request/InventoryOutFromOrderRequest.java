package com.qm.bookstore.qm_bookstore.dto.inventory.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * DTO tạo giao dịch xuất kho từ đơn hàng
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryOutFromOrderRequest {

    @NotNull(message = "Order ID không được để trống")
    Long orderId; // ID đơn hàng cần xuất kho

    String note; // Ghi chú (optional)
}
