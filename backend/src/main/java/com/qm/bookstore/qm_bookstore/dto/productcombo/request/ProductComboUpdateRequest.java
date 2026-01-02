package com.qm.bookstore.qm_bookstore.dto.productcombo.request;

import jakarta.validation.constraints.Positive;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductComboUpdateRequest {
    
    String name;
    
    @Positive(message = "Giá combo phải lớn hơn 0")
    BigDecimal price;
    
    String imageUrl;
    
    Boolean availability;
    
    List<ComboItemRequest> items;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ComboItemRequest {
        
        Long productId;
        
        @Positive(message = "Số lượng phải lớn hơn 0")
        Integer quantity;
    }
}
