package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.role.request.RoleCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.role.request.RoleUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.role.response.RoleResponse;
import com.qm.bookstore.qm_bookstore.service.RoleService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý các API liên quan đến Role
 * Chỉ ADMIN mới có quyền truy cập
 */
@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasRole('admin')") // Tất cả endpoints đều cần ADMIN role
public class RoleController {
    
    RoleService roleService;
    
    /**
     * [ADMIN] Lấy danh sách tất cả roles
     * GET /api/roles
     */
    @GetMapping
    public ApiResponse<List<RoleResponse>> getAllRoles() {
        log.info("Getting all roles");
        List<RoleResponse> roles = roleService.getAllRoles();
        return ApiResponse.<List<RoleResponse>>builder()
                .code(HttpStatus.OK.value())
                .message("Retrieved all roles successfully")
                .result(roles)
                .build();
    }
    
    /**
     * [ADMIN] Lấy role theo ID
     * GET /api/roles/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<RoleResponse> getRoleById(@PathVariable Integer id) {
        log.info("Getting role by id: {}", id);
        RoleResponse role = roleService.getRoleById(id);
        return ApiResponse.<RoleResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Retrieved role successfully")
                .result(role)
                .build();
    }
    
    /**
     * [ADMIN] Lấy role theo name
     * GET /api/roles/name/{name}
     */
    @GetMapping("/name/{name}")
    public ApiResponse<RoleResponse> getRoleByName(@PathVariable String name) {
        log.info("Getting role by name: {}", name);
        RoleResponse role = roleService.getRoleByName(name);
        return ApiResponse.<RoleResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Retrieved role successfully")
                .result(role)
                .build();
    }
    
    /**
     * [ADMIN] Tạo role mới
     * POST /api/roles
     */
    @PostMapping
    public ApiResponse<RoleResponse> createRole(@Valid @RequestBody RoleCreateRequest request) {
        log.info("Creating new role with name: {}", request.getName());
        RoleResponse role = roleService.createRole(request);
        return ApiResponse.<RoleResponse>builder()
                .code(HttpStatus.CREATED.value())
                .message("Role created successfully")
                .result(role)
                .build();
    }
    
    /**
     * [ADMIN] Cập nhật role
     * PUT /api/roles/{id}
     */
    @PutMapping("/{id}")
    public ApiResponse<RoleResponse> updateRole(
            @PathVariable Integer id,
            @Valid @RequestBody RoleUpdateRequest request) {
        log.info("Updating role id: {}", id);
        RoleResponse role = roleService.updateRole(id, request);
        return ApiResponse.<RoleResponse>builder()
                .code(HttpStatus.OK.value())
                .message("Role updated successfully")
                .result(role)
                .build();
    }
    
    /**
     * [ADMIN] Xóa role
     * DELETE /api/roles/{id}
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRole(@PathVariable Integer id) {
        log.info("Deleting role id: {}", id);
        roleService.deleteRole(id);
        return ApiResponse.<Void>builder()
                .code(HttpStatus.OK.value())
                .message("Role deleted successfully")
                .build();
    }
}
