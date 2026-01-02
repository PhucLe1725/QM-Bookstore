package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.report.*;
import com.qm.bookstore.qm_bookstore.service.ReportService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ReportController {

    ReportService reportService;

    /**
     * Get revenue report
     * GET /api/reports/revenue
     */
    @GetMapping("/revenue")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<RevenueReportResponse> getRevenueReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        log.info("[getRevenueReport] Generating revenue report from {} to {}", startDate, endDate);

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        RevenueReportResponse report = reportService.getRevenueReport(start, end);

        return ApiResponse.<RevenueReportResponse>builder()
                .code(1000)
                .message("Revenue report generated successfully")
                .result(report)
                .build();
    }

    /**
     * Get order statistics
     * GET /api/reports/orders
     */
    @GetMapping("/orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<OrderStatisticsResponse> getOrderStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        log.info("[getOrderStatistics] Generating order statistics from {} to {}", startDate, endDate);

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        OrderStatisticsResponse statistics = reportService.getOrderStatistics(start, end);

        return ApiResponse.<OrderStatisticsResponse>builder()
                .code(1000)
                .message("Order statistics generated successfully")
                .result(statistics)
                .build();
    }

    /**
     * Get top selling products
     * GET /api/reports/products/top-selling
     */
    @GetMapping("/products/top-selling")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<List<ProductReportResponse>> getTopSellingProducts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "10") int limit) {

        log.info("[getTopSellingProducts] Getting top {} products from {} to {}", limit, startDate, endDate);

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<ProductReportResponse> products = reportService.getTopSellingProducts(start, end, limit);

        return ApiResponse.<List<ProductReportResponse>>builder()
                .code(1000)
                .message("Top selling products retrieved successfully")
                .result(products)
                .build();
    }

    /**
     * Get user statistics
     * GET /api/reports/users
     */
    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<UserStatisticsResponse> getUserStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        log.info("[getUserStatistics] Generating user statistics from {} to {}", startDate, endDate);

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        UserStatisticsResponse statistics = reportService.getUserStatistics(start, end);

        return ApiResponse.<UserStatisticsResponse>builder()
                .code(1000)
                .message("User statistics generated successfully")
                .result(statistics)
                .build();
    }

    /**
     * Get voucher usage report
     * GET /api/reports/vouchers
     */
    @GetMapping("/vouchers")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<List<VoucherReportResponse>> getVoucherReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        log.info("[getVoucherReport] Generating voucher report from {} to {}", startDate, endDate);

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<VoucherReportResponse> report = reportService.getVoucherReport(start, end);

        return ApiResponse.<List<VoucherReportResponse>>builder()
                .code(1000)
                .message("Voucher report generated successfully")
                .result(report)
                .build();
    }

    /**
     * Get dashboard summary (quick overview)
     * GET /api/reports/dashboard
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<DashboardSummaryResponse> getDashboardSummary() {
        log.info("[getDashboardSummary] Generating dashboard summary");

        // Last 30 days
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusDays(30);

        RevenueReportResponse revenue = reportService.getRevenueReport(start, end);
        OrderStatisticsResponse orders = reportService.getOrderStatistics(start, end);
        UserStatisticsResponse users = reportService.getUserStatistics(start, end);
        List<ProductReportResponse> topProducts = reportService.getTopSellingProducts(start, end, 5);

        DashboardSummaryResponse summary = DashboardSummaryResponse.builder()
                .totalRevenue(revenue.getTotalRevenue())
                .totalOrders(orders.getTotalOrders())
                .paidOrders(orders.getPaidOrders())
                .cancelledOrders(orders.getCancelledOrders())
                .totalCustomers(users.getTotalUsers())
                .newCustomers(users.getNewUsersInPeriod())
                .topSellingProducts(topProducts)
                .build();

        return ApiResponse.<DashboardSummaryResponse>builder()
                .code(1000)
                .message("Dashboard summary generated successfully")
                .result(summary)
                .build();
    }

    /**
     * Get revenue chart data for admin dashboard
     * GET /api/reports/revenue-chart
     * 
     * @param period "week" | "month" | "year"
     * @param year Optional: Năm cụ thể (VD: 2025, 2024), mặc định = năm hiện tại
     * @param month Optional: Tháng cụ thể 1-12 (chỉ dùng khi period=month), mặc định = tháng hiện tại
     * @return Chart data optimized for column chart visualization
     */
    @GetMapping("/revenue-chart")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<RevenueChartResponse> getRevenueChart(
            @RequestParam(defaultValue = "week") String period,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        
        log.info("[getRevenueChart] Generating revenue chart for period: {}, year: {}, month: {}", period, year, month);
        
        // Validate period
        if (!period.matches("week|month|year")) {
            return ApiResponse.<RevenueChartResponse>builder()
                    .success(false)
                    .code(400)
                    .message("Invalid period. Valid values: week, month, year")
                    .build();
        }
        
        // Validate month if provided
        if (month != null && (month < 1 || month > 12)) {
            return ApiResponse.<RevenueChartResponse>builder()
                    .success(false)
                    .code(400)
                    .message("Invalid month. Valid values: 1-12")
                    .build();
        }
        
        // Validate year if provided (reasonable range)
        if (year != null && (year < 2000 || year > 2100)) {
            return ApiResponse.<RevenueChartResponse>builder()
                    .success(false)
                    .code(400)
                    .message("Invalid year. Valid range: 2000-2100")
                    .build();
        }
        
        RevenueChartResponse chartData = reportService.getRevenueChart(period, year, month);
        
        return ApiResponse.<RevenueChartResponse>builder()
                .success(true)
                .code(1000)
                .message("Revenue chart data generated successfully")
                .result(chartData)
                .build();
    }
}
