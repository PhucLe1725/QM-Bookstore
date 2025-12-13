package com.qm.bookstore.qm_bookstore.dto.report;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductReportResponse {
    
    Long productId;
    String productName;
    String categoryName;
    Integer totalQuantitySold;
    BigDecimal totalRevenue;
    Integer orderCount;
    BigDecimal averagePrice;
}
