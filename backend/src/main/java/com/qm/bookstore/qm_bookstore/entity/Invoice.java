package com.qm.bookstore.qm_bookstore.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "invoices",
    indexes = {
        @Index(name = "idx_invoice_order_id", columnList = "order_id"),
        @Index(name = "idx_invoice_status", columnList = "status"),
        @Index(name = "idx_invoice_created_at", columnList = "created_at")
    }
)
public class Invoice {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    
    // ========== ORDER REFERENCE ==========
    @Column(name = "order_id", nullable = false, unique = true)
    Long orderId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    Order order;
    
    // ========== INVOICE NUMBER ==========
    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    String invoiceNumber; // Format: INV-YYYYMMDD-XXXXX
    
    // ========== SELLER INFO (COMPANY) ==========
    @Column(name = "seller_name", nullable = false, length = 200)
    String sellerName;
    
    @Column(name = "seller_tax_code", length = 20)
    String sellerTaxCode;
    
    @Column(name = "seller_address", columnDefinition = "TEXT")
    String sellerAddress;
    
    @Column(name = "seller_phone", length = 20)
    String sellerPhone;
    
    @Column(name = "seller_email", length = 100)
    String sellerEmail;
    
    // ========== BUYER INFO (CUSTOMER) ==========
    @Column(name = "buyer_id", nullable = false)
    UUID buyerId;
    
    @Column(name = "buyer_name", nullable = false, length = 200)
    String buyerName;
    
    @Column(name = "buyer_tax_code", length = 20)
    String buyerTaxCode; // Optional - for company customers
    
    @Column(name = "buyer_address", columnDefinition = "TEXT")
    String buyerAddress;
    
    @Column(name = "buyer_phone", length = 20)
    String buyerPhone;
    
    @Column(name = "buyer_email", length = 100)
    String buyerEmail;
    
    // ========== AMOUNTS (SNAPSHOT FROM ORDER) ==========
    @Column(name = "subtotal_amount", nullable = false, precision = 12, scale = 2)
    BigDecimal subtotalAmount; // Tổng giá trị hàng hóa trước giảm giá
    
    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    BigDecimal discountAmount; // Tổng chiết khấu
    
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    BigDecimal totalAmount; // Doanh thu (sau giảm, chưa VAT, chưa ship)
    
    @Column(name = "vat_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    BigDecimal vatRate = new BigDecimal("10.00"); // VAT rate 10%
    
    @Column(name = "vat_amount", nullable = false, precision = 12, scale = 2)
    BigDecimal vatAmount; // Thuế VAT
    
    @Column(name = "shipping_fee", precision = 12, scale = 2)
    BigDecimal shippingFee; // Phí vận chuyển
    
    @Column(name = "total_pay", nullable = false, precision = 12, scale = 2)
    BigDecimal totalPay; // Tổng thanh toán
    
    // ========== INVOICE STATUS ==========
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    String status = "DRAFT"; // DRAFT, ISSUED, SIGNED, SENT, CANCELLED
    
    @Column(name = "payment_method", length = 50)
    String paymentMethod; // prepaid, cod
    
    @Column(name = "payment_status", length = 50)
    String paymentStatus; // paid, pending
    
    // ========== AUDIT & TRACKING ==========
    @Column(name = "issued_by")
    UUID issuedBy; // User ID who generated the invoice
    
    @Column(name = "issued_at")
    LocalDateTime issuedAt; // Thời điểm xuất hóa đơn
    
    // ========== DIGITAL SIGNATURE & HASH ==========
    @Column(name = "content_hash", length = 64)
    String contentHash; // SHA-256 hash của nội dung hóa đơn (bất biến)
    
    // ========== TIMESTAMPS ==========
    @Builder.Default
    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT NOW()")
    LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT NOW()")
    LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
