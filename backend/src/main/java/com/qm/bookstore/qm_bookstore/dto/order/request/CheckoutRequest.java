package com.qm.bookstore.qm_bookstore.dto.order.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckoutRequest {
    
    @NotBlank(message = "Payment method is required")
    String paymentMethod; // prepaid, cod
    
    @NotBlank(message = "Fulfillment method is required")
    String fulfillmentMethod; // delivery, pickup
    
    String voucherCode;
    
    String receiverName;
    
    @Pattern(regexp = "0[0-9]{9,10}", message = "Phone number must be 10-11 digits starting with 0")
    String receiverPhone;
    
    String receiverAddress;
    
    BigDecimal shippingFee; // Phí ship được tính từ frontend (based on distance)
    
    String note;
}
