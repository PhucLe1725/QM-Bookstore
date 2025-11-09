package com.qm.bookstore.qm_bookstore.dto.product.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductUpdateRequest {
    Long id;
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