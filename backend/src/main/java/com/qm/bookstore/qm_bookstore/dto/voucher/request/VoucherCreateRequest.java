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
public class VoucherCreateRequest {
    
    @NotBlank(message = "Voucher code is required")
    @Size(max = 50, message = "Code must not exceed 50 characters")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Code must contain only uppercase letters, numbers, underscore and dash")
    String code;
    
    @NotNull(message = "Discount amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Discount amount must be greater than 0")
    BigDecimal discountAmount;
    
    @NotBlank(message = "Discount type is required")
    @Pattern(regexp = "^(PERCENT|FIXED)$", message = "Discount type must be PERCENT or FIXED")
    String discountType;
    
    @NotBlank(message = "Apply to is required")
    @Pattern(regexp = "^(ORDER|SHIPPING)$", message = "Apply to must be ORDER or SHIPPING")
    String applyTo;
    
    @DecimalMin(value = "0.0", message = "Min order amount must be greater than or equal to 0")
    BigDecimal minOrderAmount;
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Max discount must be greater than 0")
    BigDecimal maxDiscount;
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    String description;
    
    @NotNull(message = "Valid from is required")
    @FutureOrPresent(message = "Valid from must be present or future")
    LocalDateTime validFrom;
    
    @NotNull(message = "Valid to is required")
    @Future(message = "Valid to must be in the future")
    LocalDateTime validTo;
    
    @Min(value = 1, message = "Usage limit must be at least 1")
    Integer usageLimit;
    
    @Min(value = 1, message = "Per user limit must be at least 1")
    @Builder.Default
    Integer perUserLimit = 1; // Số lần mỗi user được sử dụng voucher
    
    Boolean status;
}
