package com.qm.bookstore.qm_bookstore.dto.invoice.response;

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
public class InvoiceResponse {
    
    Long invoiceId;
    String invoiceNumber;
    Long orderId;
    
    // Seller info
    SellerInfo seller;
    
    // Buyer info
    BuyerInfo buyer;
    
    // Amounts
    BigDecimal subtotalAmount;
    BigDecimal discountAmount;
    BigDecimal totalAmount;     // Doanh thu (không bao gồm VAT)
    BigDecimal vatRate;
    BigDecimal vatAmount;
    BigDecimal shippingFee;
    BigDecimal totalPay;        // Tổng thanh toán
    
    // Status
    String status;
    String paymentMethod;
    String paymentStatus;
    
    // Audit
    String issuedBy;
    LocalDateTime issuedAt;
    LocalDateTime createdAt;
    
    // Files
    String pdfDownloadUrl;
    
    // Items
    List<InvoiceItemResponse> items;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerInfo {
        String name;
        String taxCode;
        String address;
        String phone;
        String email;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BuyerInfo {
        String name;
        String taxCode;
        String address;
        String phone;
        String email;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceItemResponse {
        String productName;
        Integer quantity;
        BigDecimal unitPrice;
        BigDecimal lineTotal;
        String categoryName;
    }
}
