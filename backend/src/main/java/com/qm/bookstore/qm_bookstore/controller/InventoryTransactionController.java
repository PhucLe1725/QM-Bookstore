package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.base.response.BaseGetAllResponse;
import com.qm.bookstore.qm_bookstore.dto.inventory.request.InventoryOutFromOrderRequest;
import com.qm.bookstore.qm_bookstore.dto.inventory.request.InventoryTransactionCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.inventory.request.InventoryTransactionGetAllRequest;
import com.qm.bookstore.qm_bookstore.dto.inventory.response.InventoryTransactionResponse;
import com.qm.bookstore.qm_bookstore.service.InventoryTransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller quản lý giao dịch kho
 * 
 * Endpoints:
 * - POST /api/inventory/transactions - Tạo giao dịch kho (IN/DAMAGED/STOCKTAKE)
 * - POST /api/inventory/transactions/out-from-order - Xuất kho từ đơn hàng
 * - GET /api/inventory/transactions/{id} - Chi tiết giao dịch
 * - GET /api/inventory/transactions - Danh sách giao dịch (có filter)
 */
@RestController
@RequestMapping("/api/inventory/transactions")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
@Slf4j
public class InventoryTransactionController {

    InventoryTransactionService inventoryTransactionService;

    /**
     * Tạo giao dịch kho thông thường
     * Dùng cho: IN (nhập kho), DAMAGED (hàng hỏng), STOCKTAKE (kiểm kê)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<InventoryTransactionResponse> createTransaction(
            @Valid @RequestBody InventoryTransactionCreateRequest request) {
        log.info("Creating inventory transaction: type={}", request.getTransactionType());
        
        InventoryTransactionResponse response = inventoryTransactionService.createTransaction(request);
        
        return ApiResponse.<InventoryTransactionResponse>builder()
                .success(true)
                .code(HttpStatus.CREATED.value())
                .message("Inventory transaction created successfully")
                .result(response)
                .build();
    }

    /**
     * Xuất kho từ đơn hàng
     * Dùng khi cần trừ kho cho đơn hàng (transaction_type = OUT, reference_type = ORDER)
     * Backend tự động lấy danh sách sản phẩm từ order_items
     */
    @PostMapping("/out-from-order")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<InventoryTransactionResponse> createOutFromOrder(
            @Valid @RequestBody InventoryOutFromOrderRequest request) {
        log.info("Creating OUT transaction from order: orderId={}", request.getOrderId());
        
        InventoryTransactionResponse response = inventoryTransactionService.createOutTransactionFromOrder(request);
        
        return ApiResponse.<InventoryTransactionResponse>builder()
                .success(true)
                .code(HttpStatus.CREATED.value())
                .message("Inventory OUT transaction from order created successfully")
                .result(response)
                .build();
    }

    /**
     * Lấy chi tiết giao dịch kho
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<InventoryTransactionResponse> getTransactionById(@PathVariable Long id) {
        log.info("Getting inventory transaction: id={}", id);
        
        InventoryTransactionResponse response = inventoryTransactionService.getTransactionById(id);
        
        return ApiResponse.<InventoryTransactionResponse>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Inventory transaction retrieved successfully")
                .result(response)
                .build();
    }

    /**
     * Lấy danh sách giao dịch kho với filter
     * Hỗ trợ filter theo:
     * - transactionType (IN/OUT/DAMAGED/STOCKTAKE)
     * - referenceType (ORDER/MANUAL/STOCKTAKE)
     * - referenceId (ID đơn hàng, ...)
     * - productId (ID sản phẩm)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<BaseGetAllResponse<InventoryTransactionResponse>> getAllTransactions(
            InventoryTransactionGetAllRequest request) {
        log.info("Getting all inventory transactions with filters: {}", request);
        
        BaseGetAllResponse<InventoryTransactionResponse> response = 
                inventoryTransactionService.getAllTransactions(request);
        
        return ApiResponse.<BaseGetAllResponse<InventoryTransactionResponse>>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Inventory transactions retrieved successfully")
                .result(response)
                .build();
    }
}
