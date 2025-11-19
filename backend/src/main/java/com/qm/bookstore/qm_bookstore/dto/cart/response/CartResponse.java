package com.qm.bookstore.qm_bookstore.dto.cart.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartResponse {
    
    Long cartId;
    List<CartItemResponse> items;
    CartSummary summary;
}
