package com.qm.bookstore.qm_bookstore.dto.report;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RevenueReportResponse {
    
    BigDecimal totalRevenue;
    BigDecimal totalDiscount;
    BigDecimal totalShippingFee;
    Integer totalOrders;
    Integer paidOrders;
    Integer cancelledOrders;
    
    List<RevenueByDate> revenueByDate;
    List<RevenueByPaymentMethod> revenueByPaymentMethod;
    List<RevenueByCategory> revenueByCategory;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueByDate {
        LocalDate date;
        BigDecimal revenue;
        Integer orderCount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueByPaymentMethod {
        String paymentMethod;
        BigDecimal revenue;
        Integer orderCount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueByCategory {
        Long categoryId;
        String categoryName;
        BigDecimal revenue;
        Integer quantity;
    }
}
