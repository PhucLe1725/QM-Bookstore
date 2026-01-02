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
public class PriceTrendResponse {
    
    Long productId;
    String productName;           // Tên sản phẩm
    BigDecimal currentPrice;      // Giá hiện tại
    TrendType trend;              // INCREASED, DECREASED, UNCHANGED, NO_HISTORY
    Integer changeCount;          // Số lần thay đổi
    LatestChangeInfo latestChange;
    
    public enum TrendType {
        INCREASED,
        DECREASED,
        UNCHANGED,
        NO_HISTORY
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class LatestChangeInfo {
        BigDecimal from;          // Giá cũ
        BigDecimal to;            // Giá mới
        BigDecimal percentage;    // % thay đổi
        LocalDateTime date;       // Ngày thay đổi
    }
}
