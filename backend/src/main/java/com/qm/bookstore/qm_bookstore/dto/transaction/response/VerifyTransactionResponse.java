package com.qm.bookstore.qm_bookstore.dto.transaction.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VerifyTransactionResponse {
    
    Boolean verified;
    Long transactionId;
    String message;
}
