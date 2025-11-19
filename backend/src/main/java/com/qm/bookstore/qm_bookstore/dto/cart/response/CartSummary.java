package com.qm.bookstore.qm_bookstore.dto.cart.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartSummary {
    
    Integer totalItems;       // Tổng số items
    Integer selectedItems;    // Số items được chọn
    Integer totalQuantity;    // Tổng số lượng tất cả
    Integer selectedQuantity; // Tổng số lượng được chọn
    BigDecimal totalAmount;   // Tổng tiền tất cả
    BigDecimal selectedAmount; // Tổng tiền được chọn (dùng cho checkout)
}
