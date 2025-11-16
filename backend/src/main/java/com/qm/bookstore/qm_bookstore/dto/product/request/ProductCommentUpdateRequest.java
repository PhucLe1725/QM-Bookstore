package com.qm.bookstore.qm_bookstore.dto.product.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductCommentUpdateRequest {
    Long id;
    String content;
}
