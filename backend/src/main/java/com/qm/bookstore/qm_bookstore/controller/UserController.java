package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.base.response.BaseGetAllResponse;
import com.qm.bookstore.qm_bookstore.dto.user.request.UserCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.user.request.UserGetAllRequest;
import com.qm.bookstore.qm_bookstore.dto.user.request.UserProfileUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.user.request.UserUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.user.response.UserResponse;
import com.qm.bookstore.qm_bookstore.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

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

    // ===== ADMIN ONLY ENDPOINTS =====

    @GetMapping("getAll")
    public ApiResponse<BaseGetAllResponse<UserResponse>> getAllUsers() {
        return ApiResponse.<BaseGetAllResponse<UserResponse>>builder()
                .result(userService.getAllUsers())
                .build();
    }

    @GetMapping("getAllPaginated")
    public ApiResponse<BaseGetAllResponse<UserResponse>> getAllUsersWithSort(
            @RequestParam(defaultValue = "0") Integer skipCount,
            @RequestParam(defaultValue = "10") Integer maxResultCount,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {
        return ApiResponse.<BaseGetAllResponse<UserResponse>>builder()
                .result(userService.getAllUsersWithSortAndPaging(skipCount, maxResultCount, sortBy, sortDirection))
                .build();
    }

    @GetMapping("getByUsername/{username}")
    public ApiResponse<UserResponse> getUserByUsername(@PathVariable String username) {
        UserResponse userResponse = userService.getUserByUsername(username);
        return ApiResponse.<UserResponse>builder()
                .result(userResponse)
                .build();
    }

    @GetMapping("getById/{id}")
    public ApiResponse<UserResponse> getUserById(@PathVariable UUID id) {
        UserResponse userResponse = userService.getUserById(id);
        return ApiResponse.<UserResponse>builder()
                .result(userResponse)
                .build();
    }

    @PostMapping("create")
    public ApiResponse<UserResponse> createUser(@RequestBody UserCreateRequest request) {
        UserResponse userResponse = userService.createUser(request);
        return ApiResponse.<UserResponse>builder()
                .result(userResponse)
                .build();
    }

    @PutMapping("update/{id}")
    public ApiResponse<UserResponse> updateUser(@PathVariable UUID id ,@RequestBody UserUpdateRequest request) {
        request.setId(id);
        UserResponse userResponse = userService.updateUser(request);
        return ApiResponse.<UserResponse>builder()
                .result(userResponse)
                .build();
    }

    @DeleteMapping("delete/{id}")
    public ApiResponse<String> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ApiResponse.<String>builder()
                .result("User deleted successfully")
                .build();
    }
}