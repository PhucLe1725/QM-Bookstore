package com.qm.bookstore.qm_bookstore.dto.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to add a product combo to cart
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddComboToCartRequest {
    
    @NotNull(message = "Combo ID is required")
    private Integer comboId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}
