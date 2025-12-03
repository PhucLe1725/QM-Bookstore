package com.qm.bookstore.qm_bookstore.dto.order.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {
    
    Long orderId;
    
    BigDecimal subtotalAmount;  // Tổng tiền sản phẩm
    BigDecimal discountAmount;  // Giảm từ voucher
    BigDecimal shippingFee;     // Phí vận chuyển
    BigDecimal totalAmount;     // Tiền khách phải trả
    
    String paymentStatus;       // pending, paid, failed, refunded
    String fulfillmentStatus;   // shipping, delivered, pickup, returned
    String orderStatus;         // confirmed, cancelled, closed
    
    String paymentMethod;       // prepaid, cod
    String fulfillmentMethod;   // delivery, pickup
    
    Integer itemCount;
    LocalDateTime createdAt;
    
    List<OrderItemResponse> items;
}
