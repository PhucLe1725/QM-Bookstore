package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.base.response.BaseGetAllResponse;
import com.qm.bookstore.qm_bookstore.dto.user.request.ChangePasswordRequest;
import com.qm.bookstore.qm_bookstore.dto.user.request.UserCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.user.request.UserGetAllRequest;
import com.qm.bookstore.qm_bookstore.dto.user.request.UserProfileUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.user.request.UserUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.user.response.UserResponse;
import com.qm.bookstore.qm_bookstore.service.UserService;
import com.qm.bookstore.qm_bookstore.entity.Role;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserController {

    @Autowired
    private UserService userService;

    // ===== CUSTOMER ENDPOINTS (Authenticated users can access) =====
    
    @GetMapping("/profile/me")
    public ApiResponse<UserResponse> getMyProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName(); // This is userId (set in JwtAuthenticationFilter)
        
        UserResponse userResponse = userService.getUserById(UUID.fromString(userId));
        return ApiResponse.<UserResponse>builder()
                .result(userResponse)
                .build();
    }

    @PutMapping("/profile/update")
    public ApiResponse<UserResponse> updateMyProfile(@RequestBody UserProfileUpdateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName(); // This is userId (set in JwtAuthenticationFilter)
        
        // Convert String userId to UUID
        UserResponse userResponse = userService.updateProfile(UUID.fromString(userId), request);
        
        return ApiResponse.<UserResponse>builder()
                .result(userResponse)
                .build();
    }

    /**
     * Đổi mật khẩu (Customer/User tự đổi)
     * POST /api/users/change-password
     * Requires: JWT token (authenticated user)
     */
    @PostMapping("/change-password")
    public ApiResponse<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = UUID.fromString(authentication.getName());
        
        log.info("[changePassword] User {} requesting password change", userId);
        userService.changePassword(userId, request);
        
        return ApiResponse.<String>builder()
                .success(true)
                .code(200)
                .message("Password changed successfully")
                .result("Your password has been updated. Please login again with your new password.")
                .build();
    }

    // ===== ADMIN ONLY ENDPOINTS =====

    @GetMapping("getAll")
   @PreAuthorize("hasRole('admin')")
    public ApiResponse<BaseGetAllResponse<UserResponse>> getAllUsers() {
        return ApiResponse.<BaseGetAllResponse<UserResponse>>builder()
                .result(userService.getAllUsers())
                .build();
    }

    @GetMapping("getAllPaginated")
   @PreAuthorize("hasRole('admin')")
    public ApiResponse<BaseGetAllResponse<UserResponse>> getAllUsersWithSort(
            @RequestParam(defaultValue = "0") Integer skipCount,
            @RequestParam(defaultValue = "10") Integer maxResultCount,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {
        return ApiResponse.<BaseGetAllResponse<UserResponse>>builder()
                .result(userService.getAllUsersWithSortAndPaging(skipCount, maxResultCount, sortBy, sortDirection))
                .build();
    }

   @PreAuthorize("hasRole('admin')")
    @GetMapping("getByUsername/{username}")
    public ApiResponse<UserResponse> getUserByUsername(@PathVariable String username) {
        UserResponse userResponse = userService.getUserByUsername(username);
        return ApiResponse.<UserResponse>builder()
                .result(userResponse)
                .build();
    }

   @PreAuthorize("hasRole('admin')")
    @GetMapping("getById/{id}")
    public ApiResponse<UserResponse> getUserById(@PathVariable UUID id) {
        UserResponse userResponse = userService.getUserById(id);
        return ApiResponse.<UserResponse>builder()
                .result(userResponse)
                .build();
    }

   @PreAuthorize("hasRole('admin')")
    @PostMapping("create")
    public ApiResponse<UserResponse> createUser(@RequestBody UserCreateRequest request) {
        UserResponse userResponse = userService.createUser(request);
        return ApiResponse.<UserResponse>builder()
                .result(userResponse)
                .build();
    }
@PreAuthorize("hasRole('ADMIN')")
    
    @PutMapping("update/{id}")
    public ApiResponse<UserResponse> updateUser(@PathVariable UUID id ,@RequestBody UserUpdateRequest request) {
        request.setId(id);
        UserResponse userResponse = userService.updateUser(request);
        return ApiResponse.<UserResponse>builder()
                .result(userResponse)
                .build();
    }
@PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ApiResponse.<String>builder()
                .result("User deleted successfully")
                .build();
    }

    // ===== ROLE MANAGEMENT =====

    @GetMapping("/roles")
   @PreAuthorize("hasRole('admin')")
    public ApiResponse<List<Role>> getAllRoles() {
        return ApiResponse.<List<Role>>builder()
                .result(userService.getAllRoles())
                .build();
    }
}