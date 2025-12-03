package com.qm.bookstore.qm_bookstore.dto.order.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateOrderStatusRequest {
    
    // Three independent status axes
    String paymentStatus;      // pending, paid, failed, refunded
    String fulfillmentStatus;  // shipping, delivered, pickup, returned
    String orderStatus;        // confirmed, cancelled, closed
    
    String note;
}
