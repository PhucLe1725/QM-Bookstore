package com.qm.bookstore.qm_bookstore.dto.inventory.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

/**
 * DTO tạo giao dịch kho mới
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryTransactionCreateRequest {

    @NotBlank(message = "Transaction type không được để trống")
    String transactionType; // IN, OUT, DAMAGED, STOCKTAKE

    String referenceType; // ORDER, MANUAL, STOCKTAKE

    Integer referenceId; // ID tham chiếu (order_id, ...)

    String note; // Ghi chú nghiệp vụ

    @NotEmpty(message = "Danh sách sản phẩm không được rỗng")
    @Valid
    List<InventoryTransactionItemRequest> items;
}
