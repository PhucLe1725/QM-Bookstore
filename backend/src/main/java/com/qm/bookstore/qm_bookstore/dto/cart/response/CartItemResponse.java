package com.qm.bookstore.qm_bookstore.dto.cart.response;

import com.qm.bookstore.qm_bookstore.dto.cart.ComboInCartResponse;
import com.qm.bookstore.qm_bookstore.entity.ItemType;
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
    
    // Item type: PRODUCT or COMBO
    ItemType itemType;
    
    // For PRODUCT type
    Long productId;
    String productName;
    String productImage;
    BigDecimal price;
    
    // For COMBO type
    ComboInCartResponse combo;
    
    // Common fields
    Integer quantity;
    BigDecimal subtotal; // price * quantity (or combo price * quantity)
    Boolean isSelected;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
