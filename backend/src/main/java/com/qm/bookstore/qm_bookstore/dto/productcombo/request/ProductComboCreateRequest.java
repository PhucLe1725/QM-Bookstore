package com.qm.bookstore.qm_bookstore.dto.productcombo.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
public class ProductComboCreateRequest {
    
    @NotBlank(message = "Tên combo không được để trống")
    String name;
    
    @NotNull(message = "Giá combo không được để trống")
    @Positive(message = "Giá combo phải lớn hơn 0")
    BigDecimal price;
    
    String imageUrl;
    
    Boolean availability = true;
    
    @NotEmpty(message = "Combo phải có ít nhất 1 sản phẩm")
    List<ComboItemRequest> items;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ComboItemRequest {
        
        @NotNull(message = "Product ID không được để trống")
        Long productId;
        
        @NotNull(message = "Số lượng không được để trống")
        @Positive(message = "Số lượng phải lớn hơn 0")
        Integer quantity;
    }
}
