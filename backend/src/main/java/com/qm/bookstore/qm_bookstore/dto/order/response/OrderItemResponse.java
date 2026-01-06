package com.qm.bookstore.qm_bookstore.dto.order.response;

import com.qm.bookstore.qm_bookstore.dto.order.ComboSnapshot;
import com.qm.bookstore.qm_bookstore.entity.ItemType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemResponse {
    
    // Item type: PRODUCT or COMBO
    ItemType itemType;
    
    // For PRODUCT type
    Long productId;
    String productName;
    
    Long categoryId;
    String categoryName;
    
    // For COMBO type
    Integer comboId;
    String comboName;
    ComboSnapshot comboSnapshot;
    
    // Common fields
    Integer quantity;
    
    BigDecimal unitPrice;   // Giá tại thời điểm đặt hàng
    BigDecimal lineTotal;   // unitPrice * quantity
    
    String thumbnail;
}
