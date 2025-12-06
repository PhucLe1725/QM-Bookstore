package com.qm.bookstore.qm_bookstore.dto.transaction.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VerifyTransactionRequest {
    
    @NotNull(message = "Transaction ID is required")
    Long transactionId;
    
    @NotNull(message = "Expected amount is required")
    @Min(value = 0, message = "Expected amount must be greater than or equal to 0")
    BigDecimal expectedAmount;
    
    @NotBlank(message = "Order code is required")
    String orderCode; // Mã đơn hàng trong payment details
}
