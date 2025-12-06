package com.qm.bookstore.qm_bookstore.dto.transaction.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TransactionResponse {
    
    Long id;
    String fingerprint;
    LocalDateTime transactionDate;
    String orderNumber;
    String debitAccount;
    String remitterName;
    String creditAccount;
    String beneficiaryName;
    String beneficiaryBank;
    BigDecimal amount;
    String paymentDetails;
    Boolean verified;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
