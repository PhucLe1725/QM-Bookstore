package com.qm.bookstore.qm_bookstore.dto.report;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DashboardSummaryResponse {
    
    BigDecimal totalRevenue;
    Integer totalOrders;
    Integer paidOrders;
    Integer cancelledOrders;
    Integer totalCustomers;
    Integer newCustomers;
    List<ProductReportResponse> topSellingProducts;
}
