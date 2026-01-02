package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.entity.PriceHistory;
import com.qm.bookstore.qm_bookstore.entity.Product;
import com.qm.bookstore.qm_bookstore.repository.PriceHistoryRepository;
import com.qm.bookstore.qm_bookstore.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PriceHistoryService {
    
    PriceHistoryRepository priceHistoryRepository;
    ProductRepository productRepository;
    
    /**
     * Ghi lại lịch sử thay đổi giá
     * Tự động được gọi khi cập nhật giá sản phẩm
     */
    @Transactional
    public PriceHistory recordPriceChange(Long productId, BigDecimal oldPrice, BigDecimal newPrice, 
                                          String changedBy, String reason) {
        log.info("[recordPriceChange] Recording price change for product {}: {} -> {}", 
                productId, oldPrice, newPrice);
        
        // Không ghi nếu giá không thay đổi
        if (oldPrice.compareTo(newPrice) == 0) {
            log.info("[recordPriceChange] Price unchanged, skipping history record");
            return null;
        }
        
        PriceHistory history = PriceHistory.builder()
                .productId(productId)
                .oldPrice(oldPrice)
                .newPrice(newPrice)
                .changedBy(changedBy)
                .reason(reason)
                .build();
        
        return priceHistoryRepository.save(history);
    }
    
    /**
     * Lấy toàn bộ lịch sử giá của một sản phẩm
     */
    public List<PriceHistory> getProductPriceHistory(Long productId) {
        return priceHistoryRepository.findByProductIdOrderByChangedAtDesc(productId);
    }
    
    /**
     * Lấy lịch sử giá của một sản phẩm (phân trang, with Product join)
     */
    public Page<PriceHistory> getProductPriceHistory(Long productId, Pageable pageable) {
        Page<PriceHistory> historyPage = priceHistoryRepository.findByProductIdOrderByChangedAtDesc(productId, pageable);
        // Force load product name for each record
        historyPage.getContent().forEach(h -> {
            if (h.getProduct() != null) {
                h.getProduct().getName();
            }
        });
        return historyPage;
    }
    
    /**
     * Lấy lịch sử giá mới nhất của một sản phẩm (with Product join)
     */
    public PriceHistory getLatestPriceChange(Long productId) {
        PriceHistory history = priceHistoryRepository.findLatestByProductId(productId);
        if (history != null && history.getProduct() != null) {
            // Force load product name
            history.getProduct().getName();
        }
        return history;
    }
    
    /**
     * Lấy lịch sử giá theo khoảng thời gian
     */
    public List<PriceHistory> getProductPriceHistoryInRange(Long productId, 
                                                             LocalDateTime startDate, 
                                                             LocalDateTime endDate) {
        return priceHistoryRepository.findByProductIdAndChangedAtBetweenOrderByChangedAtDesc(
                productId, startDate, endDate);
    }
    
    /**
     * Lấy lịch sử giá của nhiều sản phẩm
     */
    public List<PriceHistory> getMultipleProductsPriceHistory(List<Long> productIds) {
        return priceHistoryRepository.findByProductIdInOrderByChangedAtDesc(productIds);
    }
    
    /**
     * Đếm số lần thay đổi giá của một sản phẩm
     */
    public long countPriceChanges(Long productId) {
        return priceHistoryRepository.countByProductId(productId);
    }
    
    /**
     * Kiểm tra xem giá có tăng hay giảm so với lần trước
     */
    public String getPriceTrend(Long productId) {
        PriceHistory latest = getLatestPriceChange(productId);
        if (latest == null) {
            return "NO_HISTORY";
        }
        
        if (latest.getNewPrice().compareTo(latest.getOldPrice()) > 0) {
            return "INCREASED";
        } else if (latest.getNewPrice().compareTo(latest.getOldPrice()) < 0) {
            return "DECREASED";
        } else {
            return "UNCHANGED";
        }
    }
}
