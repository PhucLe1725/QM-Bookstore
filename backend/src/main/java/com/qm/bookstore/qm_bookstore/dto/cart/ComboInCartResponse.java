package com.qm.bookstore.qm_bookstore.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response representing a combo in cart
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboInCartResponse {
    
    private Integer id;
    
    private String name;
    
    private String imageUrl;
    
    private BigDecimal price;
    
    private BigDecimal originalPrice;
    
    private BigDecimal discountAmount;
    
    private Double discountPercentage;
    
    private List<ComboItemInCartResponse> items;
}
