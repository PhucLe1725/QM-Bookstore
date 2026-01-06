package com.qm.bookstore.qm_bookstore.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.qm.bookstore.qm_bookstore.dto.invoice.request.GenerateInvoiceRequest;
import com.qm.bookstore.qm_bookstore.dto.invoice.response.InvoiceResponse;
import com.qm.bookstore.qm_bookstore.entity.*;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
@Slf4j
public class InvoiceService {
    
    final InvoiceRepository invoiceRepository;
    final OrderRepository orderRepository;
    final OrderItemRepository orderItemRepository;
    final UserRepository userRepository;
    final ProductRepository productRepository;
    final SystemConfigService systemConfigService;
    
    private static final BigDecimal VAT_RATE = new BigDecimal("10.00");
    private static final BigDecimal VAT_MULTIPLIER = new BigDecimal("0.10");
    
    /**
     * Generate invoice for an order
     * Backend xử lý toàn bộ logic, validate dữ liệu, không tin frontend
     */
    @Transactional
    public InvoiceResponse generateInvoice(UUID userId, GenerateInvoiceRequest request) {
        log.info("[generateInvoice] User {} requesting invoice for order {}", userId, request.getOrderId());
        
        // 1. VALIDATE: Đơn hàng tồn tại
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> {
                    log.error("[generateInvoice] Order {} not found", request.getOrderId());
                    return new AppException(ErrorCode.ORDER_NOT_FOUND);
                });
        
        // 2. VALIDATE: User có quyền xuất hóa đơn cho đơn này
        // Admin/Manager có thể xuất hóa đơn cho bất kỳ order nào
        // Customer chỉ xuất được hóa đơn cho order của mình
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        boolean isAdmin = user.getRole() != null && 
                ("admin".equalsIgnoreCase(user.getRole().getName()) || 
                 "manager".equalsIgnoreCase(user.getRole().getName()));
        
        if (!isAdmin && !order.getUserId().equals(userId)) {
            log.error("[generateInvoice] User {} does not own order {}", userId, request.getOrderId());
            throw new AppException(ErrorCode.ORDER_ACCESS_DENIED);
        }
        
        // 3. VALIDATE: Đơn đã thanh toán thành công
        if (!"paid".equalsIgnoreCase(order.getPaymentStatus())) {
            log.error("[generateInvoice] Order {} payment status is {}, not paid", 
                    request.getOrderId(), order.getPaymentStatus());
            throw new AppException(ErrorCode.INVOICE_ORDER_NOT_PAID);
        }
        
        // 4. VALIDATE: Đơn chưa bị hủy
        if ("cancelled".equalsIgnoreCase(order.getOrderStatus())) {
            log.error("[generateInvoice] Order {} is cancelled", request.getOrderId());
            throw new AppException(ErrorCode.INVOICE_ORDER_CANCELLED);
        }
        
        // 5. VALIDATE: Chưa xuất hóa đơn trước đó
        if (invoiceRepository.existsByOrderId(request.getOrderId())) {
            Invoice existingInvoice = invoiceRepository.findByOrderId(request.getOrderId()).get();
            log.warn("[generateInvoice] Invoice already exists for order {}: {}", 
                    request.getOrderId(), existingInvoice.getInvoiceNumber());
            
            // Return existing invoice instead of creating new one
            return mapToInvoiceResponse(existingInvoice);
        }
        
        // 6. VALIDATE AMOUNTS: Kiểm tra logic tiền từ database (KHÔNG TIN FRONTEND)
        validateOrderAmounts(order);
        
        // 7. Get buyer info
        User buyer = userRepository.findById(order.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // 8. Load seller info from SystemConfig
        String sellerName = getConfigValue("invoice.seller.name", "Lê Quang Minh");
        String sellerTaxCode = getConfigValue("invoice.seller.taxCode", "038204002582");
        String sellerAddress = getConfigValue("invoice.seller.address", "29B Lê Lợi, Xã Thường Xuân, Tỉnh Thanh Hóa");
        String sellerPhone = getConfigValue("invoice.seller.phone", "0325937878");
        String sellerEmail = getConfigValue("invoice.seller.email", "xuanphuctls.payment@gmail.com");
        
        // 9. Generate invoice number: INV-YYYYMMDD-XXXXX
        String invoiceNumber = generateInvoiceNumber();
        
        // 10. Create Invoice entity
        Invoice invoice = Invoice.builder()
                .orderId(order.getId())
                .invoiceNumber(invoiceNumber)
                // Seller info (from SystemConfig database)
                .sellerName(sellerName)
                .sellerTaxCode(sellerTaxCode)
                .sellerAddress(sellerAddress)
                .sellerPhone(sellerPhone)
                .sellerEmail(sellerEmail)
                // Buyer info (from DB)
                .buyerId(buyer.getId())
                .buyerName(request.getBuyerCompanyName() != null ? 
                        request.getBuyerCompanyName() : buyer.getFullName())
                .buyerTaxCode(request.getBuyerTaxCode())
                .buyerAddress(request.getBuyerCompanyAddress() != null ? 
                        request.getBuyerCompanyAddress() : buyer.getAddress())
                .buyerPhone(buyer.getPhoneNumber())
                .buyerEmail(buyer.getEmail())
                // Amounts (SNAPSHOT từ order - nguồn sự thật)
                .subtotalAmount(order.getSubtotalAmount())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())  // Doanh thu (không VAT)
                .vatRate(VAT_RATE)
                .vatAmount(order.getVatAmount())
                .shippingFee(order.getShippingFee())
                .totalPay(order.getTotalPay())  // Tổng thanh toán
                // Status
                .status("ISSUED")  // Mặc định là đã xuất
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                // Audit
                .issuedBy(userId)
                .issuedAt(LocalDateTime.now())
                .build();
        
        // 11. Generate content hash (để đảm bảo tính bất biến)
        String contentHash = generateContentHash(invoice);
        invoice.setContentHash(contentHash);
        
        // 12. Save invoice
        invoice = invoiceRepository.save(invoice);
        log.info("[generateInvoice] Created invoice {} for order {}", 
                invoice.getInvoiceNumber(), order.getId());
        
        // 13. Return response
        return mapToInvoiceResponse(invoice);
    }
    
    /**
     * CRITICAL: Validate order amounts according to strict rules
     * Backend là nguồn sự thật duy nhất - KHÔNG TIN FRONTEND
     */
    private void validateOrderAmounts(Order order) {
        log.info("[validateOrderAmounts] Validating amounts for order {}", order.getId());
        
        // Rule 1: total_amount = subtotal_amount - discount_amount
        BigDecimal expectedTotalAmount = order.getSubtotalAmount()
                .subtract(order.getDiscountAmount())
                .setScale(2, RoundingMode.HALF_UP);
        
        if (order.getTotalAmount().compareTo(expectedTotalAmount) != 0) {
            log.error("[validateOrderAmounts] Order {} total_amount mismatch. " +
                    "Expected: {}, Actual: {}", 
                    order.getId(), expectedTotalAmount, order.getTotalAmount());
            throw new AppException(ErrorCode.INVOICE_AMOUNT_VALIDATION_FAILED);
        }
        
        // Rule 2: vat_amount = total_amount * 10%
        BigDecimal expectedVatAmount = order.getTotalAmount()
                .multiply(VAT_MULTIPLIER)
                .setScale(2, RoundingMode.HALF_UP);
        
        if (order.getVatAmount().compareTo(expectedVatAmount) != 0) {
            log.error("[validateOrderAmounts] Order {} vat_amount mismatch. " +
                    "Expected: {}, Actual: {}", 
                    order.getId(), expectedVatAmount, order.getVatAmount());
            throw new AppException(ErrorCode.INVOICE_AMOUNT_VALIDATION_FAILED);
        }
        
        // Rule 3: total_pay = total_amount + vat_amount + shipping_fee
        BigDecimal shippingFee = order.getShippingFee() != null ? 
                order.getShippingFee() : BigDecimal.ZERO;
        BigDecimal expectedTotalPay = order.getTotalAmount()
                .add(order.getVatAmount())
                .add(shippingFee)
                .setScale(2, RoundingMode.HALF_UP);
        
        if (order.getTotalPay().compareTo(expectedTotalPay) != 0) {
            log.error("[validateOrderAmounts] Order {} total_pay mismatch. " +
                    "Expected: {}, Actual: {}", 
                    order.getId(), expectedTotalPay, order.getTotalPay());
            throw new AppException(ErrorCode.INVOICE_AMOUNT_VALIDATION_FAILED);
        }
        
        log.info("[validateOrderAmounts] Order {} amounts validated successfully", order.getId());
    }
    
    /**
     * Generate unique invoice number: INV-YYYYMMDD-XXXXX
     */
    private String generateInvoiceNumber() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = invoiceRepository.count() + 1;
        return String.format("INV-%s-%05d", dateStr, count);
    }
    
    /**
     * Generate SHA-256 hash of invoice content for immutability
     */
    private String generateContentHash(Invoice invoice) {
        try {
            String content = String.format("%s|%s|%s|%s|%s|%s|%s",
                    invoice.getInvoiceNumber(),
                    invoice.getOrderId(),
                    invoice.getTotalAmount(),
                    invoice.getVatAmount(),
                    invoice.getTotalPay(),
                    invoice.getBuyerId(),
                    invoice.getIssuedAt()
            );
            
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            
            return hexString.toString();
        } catch (Exception e) {
            log.error("[generateContentHash] Error generating hash", e);
            return null;
        }
    }
    
    /**
     * Helper method to get config value from SystemConfig with fallback
     */
    private String getConfigValue(String configKey, String defaultValue) {
        try {
            return systemConfigService.getConfigByKey(configKey).getConfigValue();
        } catch (Exception e) {
            log.warn("[getConfigValue] Config key '{}' not found, using default: {}", configKey, defaultValue);
            return defaultValue;
        }
    }
    
    /**
     * Get invoice by order ID
     */
    public InvoiceResponse getInvoiceByOrderId(UUID userId, Long orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));
        
        // Validate permission: Admin/Manager can view any invoice
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        boolean isAdmin = user.getRole() != null && 
                ("admin".equalsIgnoreCase(user.getRole().getName()) || 
                 "manager".equalsIgnoreCase(user.getRole().getName()));
        
        if (!isAdmin && !invoice.getBuyerId().equals(userId)) {
            throw new AppException(ErrorCode.ORDER_ACCESS_DENIED);
        }
        
        return mapToInvoiceResponse(invoice);
    }
    
    /**
     * Get invoice PDF content for download
     * Generates PDF from invoice data using OpenHTMLtoPDF
     */
    public byte[] getInvoicePdf(UUID userId, Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));
        
        // Validate permission
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        boolean isAdmin = user.getRole() != null && 
                ("admin".equalsIgnoreCase(user.getRole().getName()) || 
                 "manager".equalsIgnoreCase(user.getRole().getName()));
        
        if (!isAdmin && !invoice.getBuyerId().equals(userId)) {
            throw new AppException(ErrorCode.INVOICE_ACCESS_DENIED);
        }
        
        // Get order and items for PDF generation
        Order order = orderRepository.findById(invoice.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        
        List<OrderItem> items = orderItemRepository.findByOrderId(invoice.getOrderId());
        
        return generateInvoicePdf(invoice, order, items);
    }
    
    /**
     * Generate PDF invoice content from HTML
     * Uses OpenHTMLtoPDF library (PDFBox backend)
     * No AGPL license issues, suitable for commercial use
     * Configured with Unicode font support for Vietnamese characters
     */
    private byte[] generateInvoicePdf(Invoice invoice, Order order, List<OrderItem> items) {
        try {
            String html = buildInvoiceHtml(invoice, order, items);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            
            // Load DejaVu Sans font for Vietnamese character support
            try {
                // Try to load from classpath (embedded in openhtmltopdf-pdfbox)
                java.io.InputStream fontStream = getClass().getClassLoader()
                    .getResourceAsStream("fonts/DejaVuSans.ttf");
                if (fontStream != null) {
                    builder.useFont(() -> fontStream, "DejaVu Sans");
                } else {
                    log.warn("[generateInvoicePdf] DejaVu Sans font not found in classpath, using fallback");
                }
            } catch (Exception fontEx) {
                log.warn("[generateInvoicePdf] Failed to load DejaVu Sans font: {}", fontEx.getMessage());
            }
            
            builder.withHtmlContent(html, null);
            builder.toStream(outputStream);
            builder.run();

            return outputStream.toByteArray();
        } catch (Exception e) {
            log.error("[generateInvoicePdf] Failed to generate PDF for invoice {}", invoice.getId(), e);
            throw new AppException(ErrorCode.INVOICE_PDF_GENERATION_FAILED);
        }
    }
    
    /**
     * Build HTML content for invoice PDF
     * Focuses on presentation only, no business logic
     */
    private String buildInvoiceHtml(Invoice invoice, Order order, List<OrderItem> items) {
        StringBuilder html = new StringBuilder();
        html.append("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8"/>
                <style>
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        font-family: 'DejaVu Sans', sans-serif;
                        font-size: 12px;
                        margin: 0;
                        padding: 20px;
                        line-height: 1.6;
                    }
                    h1 {
                        text-align: center;
                        color: #333;
                        margin-bottom: 10px;
                        font-size: 20px;
                    }
                    .invoice-number {
                        text-align: center;
                        font-size: 14px;
                        margin-bottom: 30px;
                    }
                    .section {
                        margin-bottom: 20px;
                    }
                    h3 {
                        color: #555;
                        border-bottom: 2px solid #4CAF50;
                        padding-bottom: 5px;
                        margin-bottom: 10px;
                    }
                    p {
                        margin: 5px 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 16px;
                    }
                    th, td {
                        border: 1px solid #ccc;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background: #4CAF50;
                        color: white;
                        font-weight: bold;
                    }
                    .right {
                        text-align: right;
                    }
                    .summary {
                        margin-top: 20px;
                        text-align: right;
                    }
                    .summary p {
                        margin: 8px 0;
                    }
                    .total {
                        font-size: 16px;
                        font-weight: bold;
                        color: #4CAF50;
                    }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        font-size: 11px;
                        color: #666;
                    }
                    .hash {
                        font-size: 9px;
                        color: #999;
                        word-break: break-all;
                    }
                </style>
            </head>
            <body>
                <h1>HÓA ĐƠN ĐIỆN TỬ</h1>
                <p class="invoice-number">Số: """);
        html.append(invoice.getInvoiceNumber());
        html.append("""
                </p>

                <div class="section">
                    <h3>Thông tin người bán</h3>
                    <p><strong>Tên:</strong> """);
        html.append(escapeHtml(invoice.getSellerName()));
        html.append("""
                </p>
                    <p><strong>Mã số thuế:</strong> """);
        html.append(invoice.getSellerTaxCode());
        html.append("""
                </p>
                    <p><strong>Địa chỉ:</strong> """);
        html.append(escapeHtml(invoice.getSellerAddress()));
        html.append("""
                </p>
                    <p><strong>Điện thoại:</strong> """);
        html.append(invoice.getSellerPhone());
        html.append("""
                </p>
                    <p><strong>Email:</strong> """);
        html.append(invoice.getSellerEmail());
        html.append("""
                </p>
                </div>

                <div class="section">
                    <h3>Thông tin người mua</h3>
                    <p><strong>Tên:</strong> """);
        html.append(escapeHtml(invoice.getBuyerName()));
        html.append("""
                </p>
            """);
        
        if (invoice.getBuyerTaxCode() != null && !invoice.getBuyerTaxCode().isEmpty()) {
            html.append("        <p><strong>Mã số thuế:</strong> ");
            html.append(invoice.getBuyerTaxCode());
            html.append("</p>\n");
        }
        
        html.append("        <p><strong>Địa chỉ:</strong> ");
        html.append(escapeHtml(invoice.getBuyerAddress()));
        html.append("""
                </p>
                    <p><strong>Điện thoại:</strong> """);
        html.append(invoice.getBuyerPhone());
        html.append("""
                </p>
                    <p><strong>Email:</strong> """);
        html.append(invoice.getBuyerEmail());
        html.append("""
                </p>
                </div>

                <div class="section">
                    <h3>Chi tiết hóa đơn</h3>
                    <table>
                        <tr>
                            <th style="width: 50px;">STT</th>
                            <th>Sản phẩm</th>
                            <th style="width: 80px;" class="right">SL</th>
                            <th style="width: 120px;" class="right">Đơn giá</th>
                            <th style="width: 120px;" class="right">Thành tiền</th>
                        </tr>
            """);

        int index = 1;
        for (OrderItem item : items) {
            // Check if this is a combo or single product
            String productName;
            if (item.getItemType() == ItemType.COMBO) {
                // For combo: use combo name from snapshot
                productName = item.getComboName() != null ? item.getComboName() : "Combo Product";
            } else {
                // For single product: fetch from database
                Product product = productRepository.findById(item.getProductId()).orElse(null);
                productName = product != null ? product.getName() : "Unknown Product";
            }
            
            html.append("            <tr>\n");
            html.append("                <td>").append(index++).append("</td>\n");
            html.append("                <td>").append(escapeHtml(productName)).append("</td>\n");
            html.append("                <td class=\"right\">").append(item.getQuantity()).append("</td>\n");
            html.append("                <td class=\"right\">").append(formatCurrency(item.getUnitPrice())).append("</td>\n");
            html.append("                <td class=\"right\">").append(formatCurrency(item.getLineTotal())).append("</td>\n");
            html.append("            </tr>\n");
        }

        html.append("""
                    </table>
                </div>

                <div class="summary">
                    <p>Tổng tiền hàng: """);
        html.append(formatCurrency(invoice.getSubtotalAmount()));
        html.append("</p>\n");
        
        if (invoice.getDiscountAmount() != null && invoice.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            html.append("        <p>Giảm giá: -");
            html.append(formatCurrency(invoice.getDiscountAmount()));
            html.append("</p>\n");
        }
        
        html.append("        <p>Tiền sau giảm giá: ");
        html.append(formatCurrency(invoice.getTotalAmount()));
        html.append("</p>\n");
        html.append("        <p>VAT (");
        html.append(invoice.getVatRate());
        html.append("%): ");
        html.append(formatCurrency(invoice.getVatAmount()));
        html.append("</p>\n");
        
        if (invoice.getShippingFee() != null && invoice.getShippingFee().compareTo(BigDecimal.ZERO) > 0) {
            html.append("        <p>Phí vận chuyển: ");
            html.append(formatCurrency(invoice.getShippingFee()));
            html.append("</p>\n");
        }
        
        html.append("        <p class=\"total\">Tổng thanh toán: ");
        html.append(formatCurrency(invoice.getTotalPay()));
        html.append("""
                </p>
                </div>

                <div class="footer">
                    <p><strong>Ngày xuất:</strong> """);
        html.append(invoice.getIssuedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        html.append("""
                </p>
                    <p><strong>Phương thức thanh toán:</strong> """);
        String paymentMethodDisplay = "cod".equalsIgnoreCase(invoice.getPaymentMethod()) 
            ? "Thanh toán khi nhận hàng" 
            : "Chuyển khoản online";
        html.append(escapeHtml(paymentMethodDisplay));
        html.append("""
                </p>
                </div>
            </body>
            </html>
            """);

        return html.toString();
    }
    
    /**
     * Escape HTML special characters
     */
    private String escapeHtml(String str) {
        if (str == null) return "";
        return str.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
    
    /**
     * Format currency for display
     */
    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0 đ";
        return String.format("%,.0f đ", amount);
    }
    
    /**
     * Get user's invoices
     */
    public List<InvoiceResponse> getInvoicesByUserId(UUID userId) {
        List<Invoice> invoices = invoiceRepository.findByBuyerIdOrderByCreatedAtDesc(userId);
        return invoices.stream()
                .map(this::mapToInvoiceResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Map Invoice entity to response DTO
     */
    private InvoiceResponse mapToInvoiceResponse(Invoice invoice) {
        // Get order items
        List<OrderItem> items = orderItemRepository.findByOrderId(invoice.getOrderId());
        List<InvoiceResponse.InvoiceItemResponse> itemResponses = items.stream()
                .map(item -> {
                    String itemName;
                    String categoryName = null;
                    
                    // Check if this is a combo or single product
                    if (item.getItemType() == ItemType.COMBO) {
                        // For combo: use combo name from snapshot
                        itemName = item.getComboName() != null ? item.getComboName() : "Combo Product";
                        // Combo doesn't have category in invoice
                    } else {
                        // For single product: fetch from database
                        Product product = productRepository.findById(item.getProductId()).orElse(null);
                        itemName = product != null ? product.getName() : "Unknown Product";
                        categoryName = product != null && product.getCategory() != null ? 
                                product.getCategory().getName() : null;
                    }
                    
                    return InvoiceResponse.InvoiceItemResponse.builder()
                            .productName(itemName)
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .lineTotal(item.getLineTotal())
                            .categoryName(categoryName)
                            .build();
                })
                .collect(Collectors.toList());
        
        return InvoiceResponse.builder()
                .invoiceId(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .orderId(invoice.getOrderId())
                .seller(InvoiceResponse.SellerInfo.builder()
                        .name(invoice.getSellerName())
                        .taxCode(invoice.getSellerTaxCode())
                        .address(invoice.getSellerAddress())
                        .phone(invoice.getSellerPhone())
                        .email(invoice.getSellerEmail())
                        .build())
                .buyer(InvoiceResponse.BuyerInfo.builder()
                        .name(invoice.getBuyerName())
                        .taxCode(invoice.getBuyerTaxCode())
                        .address(invoice.getBuyerAddress())
                        .phone(invoice.getBuyerPhone())
                        .email(invoice.getBuyerEmail())
                        .build())
                .subtotalAmount(invoice.getSubtotalAmount())
                .discountAmount(invoice.getDiscountAmount())
                .totalAmount(invoice.getTotalAmount())
                .vatRate(invoice.getVatRate())
                .vatAmount(invoice.getVatAmount())
                .shippingFee(invoice.getShippingFee())
                .totalPay(invoice.getTotalPay())
                .status(invoice.getStatus())
                .paymentMethod(invoice.getPaymentMethod())
                .paymentStatus(invoice.getPaymentStatus())
                .issuedBy(invoice.getIssuedBy() != null ? invoice.getIssuedBy().toString() : null)
                .issuedAt(invoice.getIssuedAt())
                .createdAt(invoice.getCreatedAt())
                .pdfDownloadUrl("/api/invoices/" + invoice.getId() + "/download/pdf")
                .items(itemResponses)
                .build();
    }
    
}

