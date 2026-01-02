package com.qm.bookstore.qm_bookstore.dto.productcombo.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductComboResponse {
    
    Integer id;
    String name;
    BigDecimal price;
    String imageUrl;
    Boolean availability;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    
    List<ComboItemResponse> items;
    
    // Calculated fields
    Integer totalProducts;
    BigDecimal totalOriginalPrice;  // Tổng giá gốc của các sản phẩm trong combo
    BigDecimal discountAmount;      // Số tiền giảm giá
    Double discountPercentage;      // % giảm giá
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ComboItemResponse {
        Integer id;
        Long productId;
        String productName;
        String productImageUrl;
        BigDecimal productPrice;
        Integer quantity;
        BigDecimal subtotal;  // productPrice * quantity
    }
}
