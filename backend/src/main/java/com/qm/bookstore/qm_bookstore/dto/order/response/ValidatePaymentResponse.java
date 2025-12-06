package com.qm.bookstore.qm_bookstore.dto.order.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ValidatePaymentResponse {
    
    Boolean paymentConfirmed;
    
    Long transactionId;
    
    BigDecimal transactionAmount;
    
    LocalDateTime transactionTime;
    
    String transferContent;  // QMORD123
    
    String message;
}
