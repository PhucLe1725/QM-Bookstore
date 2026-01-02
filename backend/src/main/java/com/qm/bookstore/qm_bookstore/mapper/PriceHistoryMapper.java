package com.qm.bookstore.qm_bookstore.mapper;

import com.qm.bookstore.qm_bookstore.dto.pricehistory.response.PriceHistoryResponse;
import com.qm.bookstore.qm_bookstore.dto.pricehistory.response.PriceTrendResponse;
import com.qm.bookstore.qm_bookstore.entity.PriceHistory;
import com.qm.bookstore.qm_bookstore.entity.Product;

public class PriceHistoryMapper {
    
    /**
     * Convert PriceHistory entity to PriceHistoryResponse DTO
     */
    public static PriceHistoryResponse toResponse(PriceHistory priceHistory) {
        if (priceHistory == null) {
            return null;
        }
        
        return PriceHistoryResponse.builder()
                .id(priceHistory.getId())
                .productId(priceHistory.getProductId())
                .productName(priceHistory.getProduct() != null ? 
                        priceHistory.getProduct().getName() : null)
                .oldPrice(priceHistory.getOldPrice())
                .newPrice(priceHistory.getNewPrice())
                .changePercentage(priceHistory.getChangePercentage())
                .changedBy(priceHistory.getChangedBy())
                .changedAt(priceHistory.getChangedAt())
                .reason(priceHistory.getReason())
                .build();
    }
    
    /**
     * Convert PriceHistory entity to PriceHistoryResponse DTO (with product name)
     */
    public static PriceHistoryResponse toResponseSimple(PriceHistory priceHistory) {
        if (priceHistory == null) {
            return null;
        }
        
        return PriceHistoryResponse.builder()
                .id(priceHistory.getId())
                .productId(priceHistory.getProductId())
                .productName(priceHistory.getProduct() != null ? 
                        priceHistory.getProduct().getName() : null)
                .oldPrice(priceHistory.getOldPrice())
                .newPrice(priceHistory.getNewPrice())
                .changePercentage(priceHistory.getChangePercentage())
                .changedBy(priceHistory.getChangedBy())
                .changedAt(priceHistory.getChangedAt())
                .reason(priceHistory.getReason())
                .build();
    }
    
    /**
     * Build PriceTrendResponse from trend string and latest change
     */
    public static PriceTrendResponse buildTrendResponse(
            Long productId,
            String trendString,
            PriceHistory latestChange,
            long changeCount,
            Product product) {
        
        PriceTrendResponse.TrendType trendType;
        try {
            trendType = PriceTrendResponse.TrendType.valueOf(trendString);
        } catch (IllegalArgumentException e) {
            trendType = PriceTrendResponse.TrendType.NO_HISTORY;
        }
        
        PriceTrendResponse.LatestChangeInfo latestInfo = null;
        if (latestChange != null) {
            latestInfo = PriceTrendResponse.LatestChangeInfo.builder()
                    .from(latestChange.getOldPrice())
                    .to(latestChange.getNewPrice())
                    .percentage(latestChange.getChangePercentage())
                    .date(latestChange.getChangedAt())
                    .build();
        }
        
        return PriceTrendResponse.builder()
                .productId(productId)
                .productName(product != null ? product.getName() : null)
                .currentPrice(product != null ? product.getPrice() : null)
                .trend(trendType)
                .changeCount((int) changeCount)
                .latestChange(latestInfo)
                .build();
    }
}
