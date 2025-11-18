package com.qm.bookstore.qm_bookstore.dto.product.response;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductReviewResponse {
    Long id;
    Long productId;
    String productName;
    UUID userId;
    String username;
    String fullName;
    Integer rating;
    String content;
    LocalDateTime createdAt;
}
