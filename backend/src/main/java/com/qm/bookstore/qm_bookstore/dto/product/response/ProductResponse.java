package com.qm.bookstore.qm_bookstore.dto.product.response;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductResponse {
    Long id;
    Long categoryId;
    String categoryName;
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
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}