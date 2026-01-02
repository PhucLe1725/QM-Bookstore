package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.productcombo.request.ProductComboCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.productcombo.request.ProductComboUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.productcombo.response.ProductComboResponse;
import com.qm.bookstore.qm_bookstore.service.ProductComboService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Product Combo Controller
 * Quản lý combo sản phẩm
 * - Customer: Xem combos available
 * - Admin/Manager: Full CRUD operations
 */
@RestController
@RequestMapping("/api/product-combos")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ProductComboController {
    
    ProductComboService productComboService;
    
    /**
     * Tạo combo mới (Admin/Manager only)
     * POST /api/product-combos
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<ProductComboResponse> createCombo(@Valid @RequestBody ProductComboCreateRequest request) {
        log.info("[POST /api/product-combos] Creating combo: {}", request.getName());
        
        ProductComboResponse response = productComboService.createCombo(request);
        
        return ApiResponse.<ProductComboResponse>builder()
                .code(HttpStatus.CREATED.value())
                .message("Tạo combo thành công")
                .result(response)
                .build();
    }
    
    /**
     * Cập nhật combo (Admin/Manager only)
     * PUT /api/product-combos/{comboId}
     */
    @PutMapping("/{comboId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<ProductComboResponse> updateCombo(
            @PathVariable Integer comboId,
            @Valid @RequestBody ProductComboUpdateRequest request) {
        
        log.info("[PUT /api/product-combos/{}] Updating combo", comboId);
        
        ProductComboResponse response = productComboService.updateCombo(comboId, request);
        
        return ApiResponse.<ProductComboResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Cập nhật combo thành công")
                .result(response)
                .build();
    }
    
    /**
     * Lấy combo theo ID (Public)
     * GET /api/product-combos/{comboId}
     */
    @GetMapping("/{comboId}")
    public ApiResponse<ProductComboResponse> getComboById(@PathVariable Integer comboId) {
        log.info("[GET /api/product-combos/{}] Getting combo", comboId);
        
        ProductComboResponse response = productComboService.getComboById(comboId);
        
        return ApiResponse.<ProductComboResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Lấy thông tin combo thành công")
                .result(response)
                .build();
    }
    
    /**
     * Lấy tất cả combos (Public, có phân trang)
     * GET /api/product-combos
     * 
     * Query params:
     * - page: Số trang (default: 0)
     * - size: Số items per page (default: 20)
     * - sort: Trường sort (default: createdAt)
     * - direction: ASC hoặc DESC (default: DESC)
     * - available: Filter theo availability (optional)
     * - search: Tìm kiếm theo tên (optional)
     */
    @GetMapping
    public ApiResponse<Page<ProductComboResponse>> getAllCombos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String search) {
        
        log.info("[GET /api/product-combos] Getting combos - page: {}, size: {}, available: {}, search: {}", 
                page, size, available, search);
        
        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        
        Page<ProductComboResponse> response;
        
        if (search != null && !search.trim().isEmpty()) {
            response = productComboService.searchCombosByName(search, pageable);
        } else if (available != null) {
            response = productComboService.getCombosByAvailability(available, pageable);
        } else {
            response = productComboService.getAllCombos(pageable);
        }
        
        return ApiResponse.<Page<ProductComboResponse>>builder()
                .code(HttpStatus.OK.value())
                .message("Lấy danh sách combo thành công")
                .result(response)
                .build();
    }
    
    /**
     * Lấy combos chứa product cụ thể (Public)
     * GET /api/product-combos/by-product/{productId}
     */
    @GetMapping("/by-product/{productId}")
    public ApiResponse<List<ProductComboResponse>> getCombosByProductId(@PathVariable Long productId) {
        log.info("[GET /api/product-combos/by-product/{}] Getting combos", productId);
        
        List<ProductComboResponse> response = productComboService.getCombosByProductId(productId);
        
        return ApiResponse.<List<ProductComboResponse>>builder()
                .code(HttpStatus.OK.value())
                .message("Lấy danh sách combo chứa sản phẩm thành công")
                .result(response)
                .build();
    }
    
    /**
     * Toggle availability của combo (Admin/Manager only)
     * PATCH /api/product-combos/{comboId}/toggle-availability
     */
    @PatchMapping("/{comboId}/toggle-availability")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<ProductComboResponse> toggleAvailability(@PathVariable Integer comboId) {
        log.info("[PATCH /api/product-combos/{}/toggle-availability] Toggling availability", comboId);
        
        ProductComboResponse response = productComboService.toggleAvailability(comboId);
        
        return ApiResponse.<ProductComboResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Cập nhật trạng thái combo thành công")
                .result(response)
                .build();
    }
    
    /**
     * Xóa combo (Admin only)
     * DELETE /api/product-combos/{comboId}
     */
    @DeleteMapping("/{comboId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteCombo(@PathVariable Integer comboId) {
        log.info("[DELETE /api/product-combos/{}] Deleting combo", comboId);
        
        productComboService.deleteCombo(comboId);
        
        return ApiResponse.<Void>builder()
                .code(HttpStatus.OK.value())
                .message("Xóa combo thành công")
                .build();
    }
    
    /**
     * Đếm số combos (Admin/Manager only)
     * GET /api/product-combos/count
     */
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<Long> countCombos(@RequestParam(required = false) Boolean available) {
        log.info("[GET /api/product-combos/count] Counting combos - available: {}", available);
        
        long count = available != null && available ? 
                productComboService.countAvailableCombos() : 
                productComboService.countCombos();
        
        return ApiResponse.<Long>builder()
                .code(HttpStatus.OK.value())
                .message("Đếm số combo thành công")
                .result(count)
                .build();
    }
}
