package com.qm.bookstore.qm_bookstore.dto.product.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductReviewUpdateRequest {
    Long id;
    Integer rating;  // 1-5
    String content;
}
