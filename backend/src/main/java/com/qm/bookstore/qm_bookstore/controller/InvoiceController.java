package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.invoice.request.GenerateInvoiceRequest;
import com.qm.bookstore.qm_bookstore.dto.invoice.response.InvoiceResponse;
import com.qm.bookstore.qm_bookstore.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Invoice Controller
 * Handles invoice generation, retrieval, and PDF download
 * All endpoints require authentication
 */
@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class InvoiceController {
    
    InvoiceService invoiceService;
    
    /**
     * Generate invoice for an order
     * POST /invoices/generate
     * 
     * Request body: { "orderId": 123, "buyerTaxCode": "...", "buyerCompanyName": "...", "buyerCompanyAddress": "..." }
     * 
     * @param request - Invoice generation request
     * @param jwt - Authenticated user JWT
     * @return InvoiceResponse
     */
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<InvoiceResponse>> generateInvoice(
            @RequestBody GenerateInvoiceRequest request,
            Authentication authentication) {
        
        UUID userId = UUID.fromString(authentication.getName());
        log.info("[POST /invoices/generate] User {} requesting invoice for order {}", userId, request.getOrderId());
        
        InvoiceResponse response = invoiceService.generateInvoice(userId, request);
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<InvoiceResponse>builder()
                        .code(1000)
                        .message("Invoice generated successfully")
                        .result(response)
                        .build());
    }
    
    /**
     * Get invoice by order ID
     * GET /invoices/order/{orderId}
     * 
     * @param orderId - Order ID
     * @param jwt - Authenticated user JWT
     * @return InvoiceResponse
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceByOrderId(
            @PathVariable Long orderId,
            Authentication authentication) {
        
        UUID userId = UUID.fromString(authentication.getName());
        log.info("[GET /invoices/order/{}] User {} requesting invoice", orderId, userId);
        
        InvoiceResponse response = invoiceService.getInvoiceByOrderId(userId, orderId);
        
        return ResponseEntity.ok(ApiResponse.<InvoiceResponse>builder()
                .code(1000)
                .message("Invoice retrieved successfully")
                .result(response)
                .build());
    }
    
    /**
     * Get all invoices for current user
     * GET /invoices/my-invoices
     * 
     * @param jwt - Authenticated user JWT
     * @return List of InvoiceResponse
     */
    @GetMapping("/my-invoices")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getMyInvoices(
            Authentication authentication) {
        
        UUID userId = UUID.fromString(authentication.getName());
        log.info("[GET /invoices/my-invoices] User {} requesting invoices", userId);
        
        List<InvoiceResponse> response = invoiceService.getInvoicesByUserId(userId);
        
        return ResponseEntity.ok(ApiResponse.<List<InvoiceResponse>>builder()
                .code(1000)
                .message("Invoices retrieved successfully")
                .result(response)
                .build());
    }
    
    /**
     * Download invoice PDF
     * GET /invoices/{invoiceId}/download/pdf
     * 
     * @param invoiceId - Invoice ID
     * @param jwt - Authenticated user JWT
     * @return PDF file as byte array
     */
    @GetMapping("/{invoiceId}/download/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(
            @PathVariable Long invoiceId,
            Authentication authentication) {
        
        UUID userId = UUID.fromString(authentication.getName());
        log.info("[GET /invoices/{}/download/pdf] User {} requesting PDF", invoiceId, userId);
        
        byte[] pdfBytes = invoiceService.getInvoicePdf(userId, invoiceId);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice-" + invoiceId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .body(pdfBytes);
    }
}
