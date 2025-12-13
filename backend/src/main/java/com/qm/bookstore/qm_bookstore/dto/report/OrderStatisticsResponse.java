package com.qm.bookstore.qm_bookstore.dto.report;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderStatisticsResponse {
    
    Integer totalOrders;
    Integer confirmedOrders;
    Integer cancelledOrders;
    Integer closedOrders;
    
    Integer pendingPaymentOrders;
    Integer paidOrders;
    Integer failedPaymentOrders;
    Integer refundedOrders;
    
    Integer shippingOrders;
    Integer deliveredOrders;
    Integer pickupOrders;
    Integer returnedOrders;
    
    List<OrdersByDate> ordersByDate;
    List<OrdersByStatus> ordersByStatus;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrdersByDate {
        LocalDate date;
        Integer orderCount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrdersByStatus {
        String status;
        Integer count;
        Double percentage;
    }
}
