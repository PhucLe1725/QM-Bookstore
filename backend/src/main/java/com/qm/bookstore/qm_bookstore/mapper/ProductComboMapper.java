package com.qm.bookstore.qm_bookstore.mapper;

import com.qm.bookstore.qm_bookstore.dto.productcombo.response.ProductComboResponse;
import com.qm.bookstore.qm_bookstore.entity.Product;
import com.qm.bookstore.qm_bookstore.entity.ProductCombo;
import com.qm.bookstore.qm_bookstore.entity.ProductComboItem;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ProductComboMapper {
    
    /**
     * Convert ProductCombo entity to ProductComboResponse DTO
     */
    public static ProductComboResponse toResponse(ProductCombo combo) {
        if (combo == null) {
            return null;
        }
        
        List<ProductComboResponse.ComboItemResponse> itemResponses = new ArrayList<>();
        BigDecimal totalOriginalPrice = BigDecimal.ZERO;
        int totalProducts = 0;
        
        if (combo.getComboItems() != null) {
            for (ProductComboItem item : combo.getComboItems()) {
                Product product = item.getProduct();
                if (product != null) {
                    BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    totalOriginalPrice = totalOriginalPrice.add(subtotal);
                    totalProducts += item.getQuantity();
                    
                    ProductComboResponse.ComboItemResponse itemResponse = ProductComboResponse.ComboItemResponse.builder()
                            .id(item.getId())
                            .productId(product.getId())
                            .productName(product.getName())
                            .productImageUrl(product.getImageUrl())
                            .productPrice(product.getPrice())
                            .quantity(item.getQuantity())
                            .subtotal(subtotal)
                            .build();
                    
                    itemResponses.add(itemResponse);
                }
            }
        }
        
        // Calculate discount
        BigDecimal discountAmount = totalOriginalPrice.subtract(combo.getPrice());
        Double discountPercentage = 0.0;
        if (totalOriginalPrice.compareTo(BigDecimal.ZERO) > 0) {
            discountPercentage = discountAmount
                    .divide(totalOriginalPrice, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }
        
        return ProductComboResponse.builder()
                .id(combo.getId())
                .name(combo.getName())
                .price(combo.getPrice())
                .imageUrl(combo.getImageUrl())
                .availability(combo.getAvailability())
                .createdAt(combo.getCreatedAt())
                .updatedAt(combo.getUpdatedAt())
                .items(itemResponses)
                .totalProducts(totalProducts)
                .totalOriginalPrice(totalOriginalPrice)
                .discountAmount(discountAmount)
                .discountPercentage(Math.round(discountPercentage * 100.0) / 100.0)
                .build();
    }
    
    /**
     * Convert list of ProductCombo entities to list of ProductComboResponse DTOs
     */
    public static List<ProductComboResponse> toResponseList(List<ProductCombo> combos) {
        if (combos == null) {
            return new ArrayList<>();
        }
        return combos.stream()
                .map(ProductComboMapper::toResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Convert ProductCombo to simple response (without items detail)
     */
    public static ProductComboResponse toSimpleResponse(ProductCombo combo) {
        if (combo == null) {
            return null;
        }
        
        int totalProducts = combo.getComboItems() != null ? 
                combo.getComboItems().stream()
                        .mapToInt(ProductComboItem::getQuantity)
                        .sum() : 0;
        
        return ProductComboResponse.builder()
                .id(combo.getId())
                .name(combo.getName())
                .price(combo.getPrice())
                .imageUrl(combo.getImageUrl())
                .availability(combo.getAvailability())
                .createdAt(combo.getCreatedAt())
                .updatedAt(combo.getUpdatedAt())
                .totalProducts(totalProducts)
                .build();
    }
}
