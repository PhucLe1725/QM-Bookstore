package com.qm.bookstore.qm_bookstore.dto.transaction.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConfirmPaymentRequest {
    
    @NotNull(message = "Transaction ID is required")
    Long transactionId;
    
    @NotNull(message = "Order ID is required")
    Long orderId;
    
    @NotNull(message = "Transaction amount is required")
    BigDecimal transactionAmount;
}
