package com.qm.bookstore.qm_bookstore.dto.voucher.request;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VoucherUpdateRequest {
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    String description;
    
    @FutureOrPresent(message = "Valid from must be present or future")
    LocalDateTime validFrom;
    
    @Future(message = "Valid to must be in the future")
    LocalDateTime validTo;
    
    @Min(value = 1, message = "Usage limit must be at least 1")
    Integer usageLimit;
    
    @Min(value = 1, message = "Per user limit must be at least 1")
    Integer perUserLimit;
    
    Boolean status;
    
    @DecimalMin(value = "0.0", message = "Min order amount must be greater than or equal to 0")
    BigDecimal minOrderAmount;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Max discount must be greater than 0")
    BigDecimal maxDiscount;
}
