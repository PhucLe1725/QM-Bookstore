package com.qm.bookstore.qm_bookstore.dto.voucher.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VoucherResponse {
    
    Long id;
    String code;
    BigDecimal discountAmount;
    String discountType;      // PERCENT | FIXED
    String applyTo;           // ORDER | SHIPPING
    BigDecimal minOrderAmount;
    BigDecimal maxDiscount;
    String description;
    LocalDateTime validFrom;
    LocalDateTime validTo;
    Integer usageLimit;
    Integer usedCount;
    Integer perUserLimit;    // Số lần mỗi user được sử dụng
    Boolean status;
    LocalDateTime createdAt;
    
    // Computed fields
    Integer remainingUsage;  // usageLimit - usedCount
    Boolean isActive;        // status && now >= validFrom && now <= validTo
}
