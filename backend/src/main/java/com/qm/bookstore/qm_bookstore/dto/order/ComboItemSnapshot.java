package com.qm.bookstore.qm_bookstore.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Snapshot of individual product within a combo at order time
 * Preserves product details as they were when the combo was purchased
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboItemSnapshot {
    /**
     * Product ID
     */
    private Long productId;
    
    /**
     * Product name at order time (frozen)
     */
    private String productName;
    
    /**
     * Quantity of this product in the combo
     */
    private Integer quantity;
    
    /**
     * Product price at order time (frozen)
     */
    private BigDecimal productPrice;
}
