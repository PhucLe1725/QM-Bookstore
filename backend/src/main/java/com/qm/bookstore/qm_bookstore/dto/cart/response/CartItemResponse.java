package com.qm.bookstore.qm_bookstore.dto.cart.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartItemResponse {
    
    Long id;
    Long productId;
    String productName;
    String productImage;
    BigDecimal price;
    Integer quantity;
    BigDecimal subtotal; // price * quantity
    Boolean isSelected;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
