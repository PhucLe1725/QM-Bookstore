package com.qm.bookstore.qm_bookstore.dto.inventory.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO trả về thông tin giao dịch kho
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryTransactionResponse {

    Long id;

    String transactionType; // IN, OUT, DAMAGED, STOCKTAKE

    String referenceType; // ORDER, MANUAL, STOCKTAKE

    Integer referenceId; // ID tham chiếu

    String note; // Ghi chú

    LocalDateTime createdAt; // Thời gian tạo

    List<InventoryTransactionItemResponse> items; // Danh sách sản phẩm
}
