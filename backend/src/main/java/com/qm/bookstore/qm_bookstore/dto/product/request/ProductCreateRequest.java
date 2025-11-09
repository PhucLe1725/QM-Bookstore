package com.qm.bookstore.qm_bookstore.dto.product.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductCreateRequest {
    Long categoryId;
    String name;
    String sku;
    BigDecimal price;
    String imageUrl;
    String shortDescription;
    String fullDescription;
    String brand;
    Boolean availability;
    Integer stockQuantity;
    Integer reorderLevel;
    Integer reorderQuantity;
}