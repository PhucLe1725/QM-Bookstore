package com.qm.bookstore.qm_bookstore.dto.voucher.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ValidateVoucherRequest {
    
    @NotBlank(message = "Voucher code is required")
    String voucherCode;
    
    @NotNull(message = "Order total is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Order total must be greater than 0")
    BigDecimal orderTotal; // Tổng tiền hàng trước giảm
    
    @NotNull(message = "Shipping fee is required")
    @DecimalMin(value = "0.0", message = "Shipping fee must be greater than or equal to 0")
    BigDecimal shippingFee; // Phí ship gốc
    
    UUID userId; // Optional: để check per-user limit
}
