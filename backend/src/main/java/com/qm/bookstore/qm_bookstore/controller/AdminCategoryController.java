package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.category.*;
import com.qm.bookstore.qm_bookstore.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {
    
    private final CategoryService categoryService;
    
    /**
     * POST /api/admin/categories
     * Create new category
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CategoryDetailDTO>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        try {
            CategoryDetailDTO created = categoryService.createCategory(request);
            
            ApiResponse<CategoryDetailDTO> response = ApiResponse.<CategoryDetailDTO>builder()
                    .success(true)
                    .message("Category created successfully")
                    .result(created)
                    .build();
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            ApiResponse<CategoryDetailDTO> response = ApiResponse.<CategoryDetailDTO>builder()
                    .success(false)
                    .code(getErrorCode(e.getMessage()))
                    .message(e.getMessage())
                    .build();
            
            return ResponseEntity.status(getHttpStatus(e.getMessage())).body(response);
        }
    }
    
    /**
     * PUT /api/admin/categories/{id}
     * Update existing category
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDetailDTO>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        try {
            CategoryDetailDTO updated = categoryService.updateCategory(id, request);
            
            ApiResponse<CategoryDetailDTO> response = ApiResponse.<CategoryDetailDTO>builder()
                    .success(true)
                    .message("Category updated successfully")
                    .result(updated)
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse<CategoryDetailDTO> response = ApiResponse.<CategoryDetailDTO>builder()
                    .success(false)
                    .code(getErrorCode(e.getMessage()))
                    .message(e.getMessage())
                    .build();
            
            return ResponseEntity.status(getHttpStatus(e.getMessage())).body(response);
        }
    }
    
    /**
     * DELETE /api/admin/categories/{id}
     * Delete category (with optional force flag)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<DeleteResult>> deleteCategory(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") Boolean force
    ) {
        try {
            DeleteResult result = categoryService.deleteCategory(id, force);
            
            String message = result.getDeletedCount() == 1 
                    ? "Category deleted successfully"
                    : "Category and " + (result.getDeletedCount() - 1) + " children deleted successfully";
            
            ApiResponse<DeleteResult> response = ApiResponse.<DeleteResult>builder()
                    .success(true)
                    .message(message)
                    .result(result)
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse<DeleteResult> response = ApiResponse.<DeleteResult>builder()
                    .success(false)
                    .code(getErrorCode(e.getMessage()))
                    .message(e.getMessage())
                    .build();
            
            return ResponseEntity.status(getHttpStatus(e.getMessage())).body(response);
        }
    }
    
    /**
     * PATCH /api/admin/categories/{id}/toggle-status
     * Toggle category status (active/inactive)
     */
    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<CategoryDetailDTO>> toggleStatus(@PathVariable Long id) {
        try {
            CategoryDetailDTO updated = categoryService.toggleStatus(id);
            
            ApiResponse<CategoryDetailDTO> response = ApiResponse.<CategoryDetailDTO>builder()
                    .success(true)
                    .message("Category status updated")
                    .result(updated)
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse<CategoryDetailDTO> response = ApiResponse.<CategoryDetailDTO>builder()
                    .success(false)
                    .code(getErrorCode(e.getMessage()))
                    .message(e.getMessage())
                    .build();
            
            return ResponseEntity.status(getHttpStatus(e.getMessage())).body(response);
        }
    }
    
    /**
     * PATCH /api/admin/categories/{id}/move
     * Move category to new parent
     */
    @PatchMapping("/{id}/move")
    public ResponseEntity<ApiResponse<CategoryDetailDTO>> moveCategory(
            @PathVariable Long id,
            @Valid @RequestBody MoveCategoryRequest request
    ) {
        try {
            CategoryDetailDTO updated = categoryService.moveCategory(id, request.getNewParentId());
            
            ApiResponse<CategoryDetailDTO> response = ApiResponse.<CategoryDetailDTO>builder()
                    .success(true)
                    .message("Category moved successfully")
                    .result(updated)
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ApiResponse<CategoryDetailDTO> response = ApiResponse.<CategoryDetailDTO>builder()
                    .success(false)
                    .code(getErrorCode(e.getMessage()))
                    .message(e.getMessage())
                    .build();
            
            return ResponseEntity.status(getHttpStatus(e.getMessage())).body(response);
        }
    }
    
    /**
     * POST /api/admin/categories/bulk-delete
     * Delete multiple categories
     */
    @PostMapping("/bulk-delete")
    public ResponseEntity<ApiResponse<BulkDeleteResult>> bulkDeleteCategories(
            @Valid @RequestBody BulkDeleteCategoryRequest request
    ) {
        try {
            BulkDeleteResult result = categoryService.bulkDeleteCategories(
                    request.getCategoryIds(), 
                    request.getForce()
            );
            
            String message = result.getFailed().isEmpty()
                    ? "Deleted " + result.getDeletedCount() + " categories successfully"
                    : "Deleted " + result.getDeletedCount() + " out of " + 
                      (result.getDeletedCount() + result.getFailed().size()) + " categories";
            
            boolean success = result.getFailed().isEmpty();
            HttpStatus status = success ? HttpStatus.OK : HttpStatus.MULTI_STATUS;
            
            ApiResponse<BulkDeleteResult> response = ApiResponse.<BulkDeleteResult>builder()
                    .success(success)
                    .message(message)
                    .result(result)
                    .build();
            
            return ResponseEntity.status(status).body(response);
        } catch (Exception e) {
            ApiResponse<BulkDeleteResult> response = ApiResponse.<BulkDeleteResult>builder()
                    .success(false)
                    .code(5000)
                    .message(e.getMessage())
                    .build();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Helper: Get HTTP status based on error message
     */
    private HttpStatus getHttpStatus(String message) {
        if (message.contains("not found")) {
            return HttpStatus.NOT_FOUND;
        } else if (message.contains("already exists") || 
                   message.contains("Cannot delete") || 
                   message.contains("with children") ||
                   message.contains("with products")) {
            return HttpStatus.CONFLICT;
        } else if (message.contains("Cannot set") || 
                   message.contains("Cannot move") ||
                   message.contains("circular")) {
            return HttpStatus.BAD_REQUEST;
        }
        return HttpStatus.BAD_REQUEST;
    }
    
    /**
     * Helper: Get error code based on error message
     */
    private int getErrorCode(String message) {
        if (message.contains("not found")) {
            return 4004; // Not Found
        } else if (message.contains("already exists")) {
            return 4009; // Conflict - Duplicate
        } else if (message.contains("Cannot delete")) {
            return 4090; // Conflict - Cannot Delete
        } else if (message.contains("Cannot set") || message.contains("Cannot move")) {
            return 4000; // Bad Request - Invalid Operation
        }
        return 4000; // Generic Bad Request
    }
}
