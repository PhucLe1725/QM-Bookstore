package com.qm.bookstore.qm_bookstore.dto.order.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReorderResponse {
    
    Integer cartItemsAdded;
    
    List<String> unavailableProducts;
}
