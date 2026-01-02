package com.qm.bookstore.qm_bookstore.dto.report;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response cho API biểu đồ cột doanh thu
 * Dùng cho frontend vẽ chart theo week/month/year
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RevenueChartResponse {
    
    /**
     * Loại khoảng thời gian: week | month | year
     */
    String periodType;
    
    /**
     * Mô tả khoảng thời gian
     * VD: "7 ngày gần nhất", "Tháng 1/2026", "Năm 2026"
     */
    String periodLabel;
    
    /**
     * Danh sách dữ liệu chart
     */
    List<ChartDataPoint> data;
    
    /**
     * Một điểm dữ liệu trên biểu đồ
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ChartDataPoint {
        /**
         * Số thứ tự thời gian (ngày hoặc tháng)
         * - week/month: 1-31 (ngày trong tháng)
         * - year: 1-12 (tháng trong năm)
         */
        Integer period;
        
        /**
         * Label hiển thị
         * - week/month: "01", "02", ... "31"
         * - year: "Th1", "Th2", ... "Th12"
         */
        String label;
        
        /**
         * Tổng doanh thu
         */
        BigDecimal revenue;
    }
}
