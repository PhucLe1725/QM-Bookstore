package com.qm.bookstore.qm_bookstore.dto.shipping;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingCalculationRequest {
    
    @NotBlank(message = "Receiver address is required")
    private String receiverAddress;
    
    @NotNull(message = "Subtotal is required")
    @Min(value = 0, message = "Subtotal must be positive")
    private Double subtotal;
    
    // Optional: If frontend already has coordinates from map selection, use them directly
    // to avoid geocoding errors
    private Double receiverLat;
    private Double receiverLng;
}
