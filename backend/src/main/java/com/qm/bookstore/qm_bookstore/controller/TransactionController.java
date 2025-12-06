package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.transaction.request.ConfirmPaymentRequest;
import com.qm.bookstore.qm_bookstore.dto.transaction.request.VerifyTransactionRequest;
import com.qm.bookstore.qm_bookstore.dto.transaction.response.ConfirmPaymentResponse;
import com.qm.bookstore.qm_bookstore.dto.transaction.response.TransactionResponse;
import com.qm.bookstore.qm_bookstore.dto.transaction.response.VerifyTransactionResponse;
import com.qm.bookstore.qm_bookstore.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {
    
    private final TransactionService transactionService;
    
    /**
     * Fetch transactions từ email
     * POST /api/transactions/fetch-from-email?maxEmails=10
     */
    @PostMapping("/fetch-from-email")
    public ApiResponse<List<TransactionResponse>> fetchFromEmail(
            @RequestParam(defaultValue = "10") Integer maxEmails) {
        log.info("[fetchFromEmail] Request to fetch {} emails", maxEmails);
        return ApiResponse.<List<TransactionResponse>>builder()
                .result(transactionService.fetchFromEmail(maxEmails))
                .build();
    }
    
    /**
     * Verify transaction
     * POST /api/transactions/verify
     */
    @PostMapping("/verify")
    public ApiResponse<VerifyTransactionResponse> verifyTransaction(
            @Valid @RequestBody VerifyTransactionRequest request) {
        log.info("[verifyTransaction] Request: {}", request);
        return ApiResponse.<VerifyTransactionResponse>builder()
                .result(transactionService.verifyTransaction(
                        request.getTransactionId(),
                        request.getExpectedAmount(),
                        request.getOrderCode()
                ))
                .build();
    }
    
    /**
     * Search by order code
     * GET /api/transactions/search?orderCode=QMORD12
     */
    @GetMapping("/search")
    public ApiResponse<List<TransactionResponse>> searchByOrderCode(
            @RequestParam String orderCode) {
        log.info("[searchByOrderCode] Order code: {}", orderCode);
        return ApiResponse.<List<TransactionResponse>>builder()
                .result(transactionService.searchByOrderCode(orderCode))
                .build();
    }
    
    /**
     * Get all transactions
     * GET /api/transactions
     */
    @GetMapping
    public ApiResponse<List<TransactionResponse>> getAllTransactions() {
        log.info("[getAllTransactions] Fetching all transactions");
        return ApiResponse.<List<TransactionResponse>>builder()
                .result(transactionService.getAllTransactions())
                .build();
    }
    
    /**
     * Confirm payment for order
     * POST /api/transactions/confirm-payment
     */
    @PostMapping("/confirm-payment")
    public ApiResponse<ConfirmPaymentResponse> confirmPayment(
            @Valid @RequestBody ConfirmPaymentRequest request) {
        log.info("[confirmPayment] Request: {}", request);
        return ApiResponse.<ConfirmPaymentResponse>builder()
                .result(transactionService.confirmPayment(
                        request.getTransactionId(),
                        request.getOrderId(),
                        request.getTransactionAmount()
                ))
                .build();
    }
}
