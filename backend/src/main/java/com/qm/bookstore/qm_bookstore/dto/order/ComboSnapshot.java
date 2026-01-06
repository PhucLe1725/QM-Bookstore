package com.qm.bookstore.qm_bookstore.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Snapshot of product combo at order time
 * This preserves the exact state of the combo when purchased,
 * protecting against future changes to combo configuration or prices
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboSnapshot {
    /**
     * List of products included in the combo at order time
     */
    private List<ComboItemSnapshot> items;
    
    /**
     * Total original price of all products (before discount)
     */
    private BigDecimal originalPrice;
    
    /**
     * Discount amount applied to the combo
     */
    private BigDecimal discountAmount;
    
    /**
     * Discount percentage applied to the combo
     */
    private BigDecimal discountPercentage;
}
