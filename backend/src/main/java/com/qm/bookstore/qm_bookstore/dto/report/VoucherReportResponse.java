package com.qm.bookstore.qm_bookstore.dto.report;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VoucherReportResponse {
    
    Long voucherId;
    String voucherCode;
    String discountType;
    BigDecimal discountAmount;
    Integer totalUsageCount;
    BigDecimal totalDiscountGiven;
    Integer uniqueUsers;
    Boolean isActive;
}
