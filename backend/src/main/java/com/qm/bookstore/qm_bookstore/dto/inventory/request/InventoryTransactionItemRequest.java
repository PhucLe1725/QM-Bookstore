package com.qm.bookstore.qm_bookstore.dto.inventory.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

/**
 * DTO cho từng dòng sản phẩm trong giao dịch kho
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryTransactionItemRequest {

    @NotNull(message = "Product ID không được để trống")
    Long productId;

    @NotBlank(message = "Change type không được để trống")
    String changeType; // PLUS hoặc MINUS

    @NotNull(message = "Quantity không được để trống")
    @Positive(message = "Quantity phải lớn hơn 0")
    Integer quantity;

    /**
     * Giá nhập đơn vị (bắt buộc cho giao dịch IN, optional cho OUT/DAMAGED)
     */
    @Positive(message = "Unit price phải lớn hơn 0")
    BigDecimal unitPrice;
}
