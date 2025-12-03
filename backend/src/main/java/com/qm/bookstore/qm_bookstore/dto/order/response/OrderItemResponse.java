package com.qm.bookstore.qm_bookstore.dto.order.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemResponse {
    
    Long productId;
    String productName;
    
    Long categoryId;
    String categoryName;
    
    Integer quantity;
    
    BigDecimal unitPrice;   // Giá tại thời điểm đặt hàng
    BigDecimal lineTotal;   // unitPrice * quantity
    
    String thumbnail;
}
