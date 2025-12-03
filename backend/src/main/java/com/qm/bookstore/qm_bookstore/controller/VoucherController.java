package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.voucher.request.VoucherCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.voucher.request.VoucherUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.voucher.request.ValidateVoucherRequest;
import com.qm.bookstore.qm_bookstore.dto.voucher.response.VoucherResponse;
import com.qm.bookstore.qm_bookstore.dto.voucher.response.ValidateVoucherResponse;
import com.qm.bookstore.qm_bookstore.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý các API liên quan đến Voucher
 * - CRUD cho voucher (Admin)
 * - Lấy danh sách voucher khả dụng (Public)
 * - Validate voucher trước checkout (User)
 */
@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
@Slf4j
public class VoucherController {

    private final VoucherService voucherService;

    /**
     * [ADMIN] Tạo voucher mới
     * POST /api/vouchers
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VoucherResponse>> createVoucher(
            @Valid @RequestBody VoucherCreateRequest request) {
        log.info("Creating new voucher with code: {}", request.getCode());
        VoucherResponse voucher = voucherService.createVoucher(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<VoucherResponse>builder()
                        .code(HttpStatus.CREATED.value())
                        .message("Voucher created successfully")
                        .result(voucher)
                        .build());
    }

    /**
     * [ADMIN] Cập nhật voucher
     * PUT /api/vouchers/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VoucherResponse>> updateVoucher(
            @PathVariable Long id,
            @Valid @RequestBody VoucherUpdateRequest request) {
        log.info("Updating voucher id: {}", id);
        VoucherResponse voucher = voucherService.updateVoucher(id, request);
        return ResponseEntity.ok(ApiResponse.<VoucherResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Voucher updated successfully")
                .result(voucher)
                .build());
    }

    /**
     * [ADMIN] Xóa voucher (soft delete - set status = false)
     * DELETE /api/vouchers/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteVoucher(@PathVariable Long id) {
        log.info("Deleting voucher id: {}", id);
        voucherService.deleteVoucher(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(HttpStatus.OK.value())
                .message("Voucher deleted successfully")
                .build());
    }

    /**
     * [ADMIN/USER] Lấy thông tin chi tiết voucher theo ID
     * GET /api/vouchers/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherResponse>> getVoucher(@PathVariable Long id) {
        log.info("Getting voucher detail for id: {}", id);
        VoucherResponse voucher = voucherService.getVoucher(id);
        return ResponseEntity.ok(ApiResponse.<VoucherResponse>builder()
                .code(HttpStatus.OK.value())
                .result(voucher)
                .build());
    }

    /**
     * [ADMIN] Lấy danh sách tất cả voucher với phân trang và filter
     * GET /api/vouchers/admin/all?page=0&size=10&status=true&applyTo=ORDER
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<VoucherResponse>>> getAllVouchers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Boolean status,
            @RequestParam(required = false) String applyTo,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        
        log.info("Admin getting all vouchers - page: {}, size: {}, status: {}, applyTo: {}", 
                page, size, status, applyTo);
        
        Sort sort = sortDirection.equalsIgnoreCase("ASC") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<VoucherResponse> vouchers = voucherService.getVouchers(status, applyTo, pageable);
        return ResponseEntity.ok(ApiResponse.<Page<VoucherResponse>>builder()
                .code(HttpStatus.OK.value())
                .message("Retrieved vouchers successfully")
                .result(vouchers)
                .build());
    }

    /**
     * [PUBLIC] Lấy danh sách voucher khả dụng (active, trong thời gian valid, còn usage)
     * GET /api/vouchers/available
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<VoucherResponse>>> getAvailableVouchers() {
        log.info("Getting available vouchers for public");
        List<VoucherResponse> vouchers = voucherService.getAvailableVouchers();
        return ResponseEntity.ok(ApiResponse.<List<VoucherResponse>>builder()
                .code(HttpStatus.OK.value())
                .message("Retrieved available vouchers successfully")
                .result(vouchers)
                .build());
    }

    /**
     * [USER] Validate voucher trước khi checkout
     * POST /api/vouchers/validate
     * Body: { "voucherCode": "SAVE10", "orderTotal": 500000, "shippingFee": 30000, "userId": "uuid" }
     * Note: userId is optional - if provided, per-user limit will be checked
     */
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<ValidateVoucherResponse>> validateVoucher(
            @Valid @RequestBody ValidateVoucherRequest request) {
        log.info("Validating voucher code: {} for order total: {}, shipping fee: {}, userId: {}", 
                request.getVoucherCode(), request.getOrderTotal(), request.getShippingFee(), request.getUserId());
        
        ValidateVoucherResponse result = voucherService.validateVoucher(request);
        
        return ResponseEntity.ok(ApiResponse.<ValidateVoucherResponse>builder()
                .code(HttpStatus.OK.value())
                .message(result.getValid() ? "Voucher is valid" : "Voucher validation failed")
                .result(result)
                .build());
    }
}
