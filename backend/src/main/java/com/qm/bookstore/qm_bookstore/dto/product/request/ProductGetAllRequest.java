package com.qm.bookstore.qm_bookstore.dto.product.request;

import com.qm.bookstore.qm_bookstore.dto.base.request.BaseGetAllRequest;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductGetAllRequest extends BaseGetAllRequest {
    String name;
    String sku;
    Long categoryId;
    String brand;
    BigDecimal minPrice;
    BigDecimal maxPrice;
    Boolean availability;
}