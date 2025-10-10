package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.auth.request.LoginRequest;
import com.qm.bookstore.qm_bookstore.dto.auth.request.LogoutRequest;
import com.qm.bookstore.qm_bookstore.dto.auth.request.RefreshTokenRequest;
import com.qm.bookstore.qm_bookstore.dto.auth.response.AuthResponse;
import com.qm.bookstore.qm_bookstore.dto.auth.response.LoginResponse;
import com.qm.bookstore.qm_bookstore.dto.auth.response.UserResponse;
import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.entity.User;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.mapper.UserMapper;
import com.qm.bookstore.qm_bookstore.repository.UserRepository;
import com.qm.bookstore.qm_bookstore.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

    @Autowired
    private AuthService authService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserMapper userMapper;

    @GetMapping("/test")
    public ApiResponse<String> testApi() {
        log.info("Calling test api");
        return ApiResponse.<String>builder()
                .result("API is working!")
                .build();
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
        String accessToken = authService.authenticate(request.getUsername(), request.getPassword());

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String refreshToken = authService.createRefreshToken(user.getId());
        UserResponse userResponse = userMapper.toAuthUserResponse(user);

        LoginResponse loginResponse = new LoginResponse(accessToken, refreshToken, userResponse);

        return ApiResponse.<LoginResponse>builder()
                .result(loginResponse)
                .build();
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
        String accessToken = authService.refreshAccessToken(request.getRefreshToken());
        AuthResponse authResponse = new AuthResponse(accessToken, request.getRefreshToken());

        return ApiResponse.<AuthResponse>builder()
                .result(authResponse)
                .build();
    }

    @PostMapping("/logout")
    public ApiResponse<String> logout(@RequestBody LogoutRequest request) {
        authService.logout(request.getRefreshToken());

        return ApiResponse.<String>builder()
                .result("Logged out successfully")
                .build();
    }
}
