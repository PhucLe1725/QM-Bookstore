package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/chat/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Gửi system alert tới tất cả admin/manager
     */
    @PostMapping("/admin/system-alert")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<String> sendSystemAlert(@RequestBody SystemAlertRequest request) {
        
        notificationService.sendSystemAlert(request.getMessage());
        
        return ApiResponse.<String>builder()
                .result("System alert sent successfully")
                .build();
    }

    /**
     * Gửi typing indicator cho conversation
     */
    @PostMapping("/conversation/{userId}/typing")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<String> sendTypingIndicator(
            @PathVariable UUID userId,
            @RequestBody TypingIndicatorRequest request) {
        
        notificationService.sendTypingIndicator(
                userId, 
                request.getActorId(), 
                request.getActorUsername(), 
                request.getActorType(), 
                request.isTyping()
        );
        
        return ApiResponse.<String>builder()
                .result("Typing indicator sent successfully")
                .build();
    }

    /**
     * Cập nhật trạng thái user
     */
    @PostMapping("/user/{userId}/status")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<String> updateUserStatus(
            @PathVariable UUID userId,
            @RequestBody UserStatusRequest request) {
        
        notificationService.sendUserStatusUpdate(
                userId, 
                request.getStatus(), 
                request.getUsername()
        );
        
        return ApiResponse.<String>builder()
                .result("User status updated successfully")
                .build();
    }

    // Request DTOs
    @lombok.Data
    public static class SystemAlertRequest {
        private String message;
    }

    @lombok.Data
    public static class TypingIndicatorRequest {
        private UUID actorId;
        private String actorUsername;
        private String actorType;
        private boolean typing;
    }

    @lombok.Data
    public static class UserStatusRequest {
        private String status;
        private String username;
    }
}