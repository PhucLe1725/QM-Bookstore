package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.pricehistory.response.PriceHistoryResponse;
import com.qm.bookstore.qm_bookstore.dto.pricehistory.response.PriceTrendResponse;
import com.qm.bookstore.qm_bookstore.entity.PriceHistory;
import com.qm.bookstore.qm_bookstore.mapper.PriceHistoryMapper;
import com.qm.bookstore.qm_bookstore.service.PriceHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/price-history")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
@Slf4j
public class PriceHistoryController {
    
    PriceHistoryService priceHistoryService;
    
    /**
     * Get price history for a product
     * Lấy lịch sử giá của một sản phẩm
     */
    @GetMapping("/product/{productId}")
    public ApiResponse<List<PriceHistoryResponse>> getProductPriceHistory(
            @PathVariable Long productId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("[getProductPriceHistory] Getting price history for product {}", productId);
        
        List<PriceHistory> history;
        
        if (startDate != null && endDate != null) {
            history = priceHistoryService.getProductPriceHistoryInRange(productId, startDate, endDate);
        } else {
            Pageable pageable = PageRequest.of(page, size);
            Page<PriceHistory> historyPage = priceHistoryService.getProductPriceHistory(productId, pageable);
            history = historyPage.getContent();
        }
        
        // Convert to DTOs
        List<PriceHistoryResponse> responses = history.stream()
                .map(PriceHistoryMapper::toResponseSimple)
                .collect(Collectors.toList());
        
        return ApiResponse.<List<PriceHistoryResponse>>builder()
                .code(200)
                .message("Lấy lịch sử giá thành công")
                .result(responses)
                .build();
    }
    
    /**
     * Get latest price change for a product
     * Lấy thay đổi giá mới nhất của sản phẩm
     */
    @GetMapping("/product/{productId}/latest")
    public ApiResponse<PriceHistoryResponse> getLatestPriceChange(@PathVariable Long productId) {
        log.info("[getLatestPriceChange] Getting latest price change for product {}", productId);
        
        PriceHistory latestChange = priceHistoryService.getLatestPriceChange(productId);
        
        if (latestChange == null) {
            return ApiResponse.<PriceHistoryResponse>builder()
                    .code(404)
                    .message("Không tìm thấy lịch sử giá")
                    .build();
        }
        
        PriceHistoryResponse response = PriceHistoryMapper.toResponseSimple(latestChange);
        
        return ApiResponse.<PriceHistoryResponse>builder()
                .code(200)
                .message("Lấy thay đổi giá mới nhất thành công")
                .result(response)
                .build();
    }
    
    /**
     * Get price trend for a product
     * Lấy xu hướng giá của sản phẩm (tăng/giảm/không đổi)
     */
    @GetMapping("/product/{productId}/trend")
    public ApiResponse<PriceTrendResponse> getPriceTrend(@PathVariable Long productId) {
        log.info("[getPriceTrend] Getting price trend for product {}", productId);
        
        String trendString = priceHistoryService.getPriceTrend(productId);
        PriceHistory latestChange = priceHistoryService.getLatestPriceChange(productId);
        long changeCount = priceHistoryService.countPriceChanges(productId);
        
        // Get product info for name and current price
        var product = latestChange != null ? latestChange.getProduct() : null;
        
        PriceTrendResponse response = PriceHistoryMapper.buildTrendResponse(
                productId, trendString, latestChange, changeCount, product);
        
        return ApiResponse.<PriceTrendResponse>builder()
                .code(200)
                .message("Lấy xu hướng giá thành công")
                .result(response)
                .build();
    }
    
    /**
     * Get price change count for a product
     * Đếm số lần thay đổi giá của sản phẩm
     */
    @GetMapping("/product/{productId}/count")
    public ApiResponse<Long> getPriceChangeCount(@PathVariable Long productId) {
        log.info("[getPriceChangeCount] Counting price changes for product {}", productId);
        
        long count = priceHistoryService.countPriceChanges(productId);
        
        return ApiResponse.<Long>builder()
                .code(200)
                .message("Đếm số lần thay đổi giá thành công")
                .result(count)
                .build();
    }
}
