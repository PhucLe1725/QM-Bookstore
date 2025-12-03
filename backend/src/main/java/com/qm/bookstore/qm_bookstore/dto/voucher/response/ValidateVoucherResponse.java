package com.qm.bookstore.qm_bookstore.dto.voucher.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ValidateVoucherResponse {
    
    Boolean valid;
    BigDecimal discountValue;  // Số tiền được giảm
    String applyTo;            // ORDER | SHIPPING
    String message;            // Thông báo lỗi nếu không valid
    
    // Voucher info
    String code;
    String discountType;
    BigDecimal discountAmount;
}
