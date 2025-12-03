package com.qm.bookstore.qm_bookstore.dto.order.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckoutResponse {
    
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
    String paymentUrl;          // For prepaid method
    
    // Receiver info (for delivery)
    String receiverName;
    String receiverPhone;
    String receiverAddress;
    
    String note;
    
    LocalDateTime createdAt;
}
