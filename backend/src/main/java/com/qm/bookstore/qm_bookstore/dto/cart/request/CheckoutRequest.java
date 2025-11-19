package com.qm.bookstore.qm_bookstore.dto.cart.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckoutRequest {
    
    @NotBlank(message = "Shipping address is required")
    String shippingAddress;
    
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10,15}$", message = "Phone number must be 10-15 digits")
    String phoneNumber;
    
    String note;
    
    @NotBlank(message = "Payment method is required")
    String paymentMethod; // COD, BANK_TRANSFER, MOMO
}
