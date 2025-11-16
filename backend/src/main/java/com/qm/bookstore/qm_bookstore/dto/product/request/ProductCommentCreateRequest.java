package com.qm.bookstore.qm_bookstore.dto.product.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductCommentCreateRequest {
    Long productId;
    UUID userId;
    String content;
    Long parentId; // null nếu là comment gốc, có giá trị nếu là reply
}
