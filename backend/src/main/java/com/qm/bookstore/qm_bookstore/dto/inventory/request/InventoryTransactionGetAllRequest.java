package com.qm.bookstore.qm_bookstore.dto.inventory.request;

import com.qm.bookstore.qm_bookstore.dto.base.request.BaseGetAllRequest;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * DTO lọc lịch sử giao dịch kho
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryTransactionGetAllRequest extends BaseGetAllRequest {

    String transactionType; // IN, OUT, DAMAGED, STOCKTAKE

    String referenceType; // ORDER, MANUAL, STOCKTAKE

    Integer referenceId; // ID tham chiếu

    Long productId; // Filter theo sản phẩm
}
