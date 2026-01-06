package com.qm.bookstore.qm_bookstore.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response representing a product within a combo in cart
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboItemInCartResponse {
    
    private Long productId;
    
    private String productName;
    
    private String imageUrl;
    
    private Integer quantity;
    
    private BigDecimal price;
}
