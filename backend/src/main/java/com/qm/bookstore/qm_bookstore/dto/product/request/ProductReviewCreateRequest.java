package com.qm.bookstore.qm_bookstore.dto.product.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductReviewCreateRequest {
    Long productId;
    UUID userId;
    Integer rating;  // 1-5
    String content;
}
