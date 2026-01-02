package com.qm.bookstore.qm_bookstore.dto.pricehistory.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PriceHistoryResponse {
    
    Long id;
    Long productId;
    String productName;           // Joined from Product
    BigDecimal oldPrice;
    BigDecimal newPrice;
    BigDecimal changePercentage;  // % thay đổi
    String changedBy;             // UUID hoặc username
    LocalDateTime changedAt;
    String reason;                // Lý do thay đổi (optional)
}
