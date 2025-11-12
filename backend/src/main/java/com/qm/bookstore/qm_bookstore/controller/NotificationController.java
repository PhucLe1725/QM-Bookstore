package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.base.response.BaseGetAllResponse;
import com.qm.bookstore.qm_bookstore.dto.notification.request.NotificationCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.notification.request.NotificationGetAllRequest;
import com.qm.bookstore.qm_bookstore.dto.notification.request.NotificationUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.notification.response.NotificationResponse;
import com.qm.bookstore.qm_bookstore.service.NotificationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class NotificationController {

    NotificationService notificationService;

    /**
     * Lấy tất cả thông báo với phân trang và filter
     */
    @GetMapping
    public ApiResponse<BaseGetAllResponse<NotificationResponse>> getAllNotifications(
            @RequestParam(required = false) UUID userId,
            @RequestParam(defaultValue = "0") Integer skipCount,
            @RequestParam(defaultValue = "10") Integer maxResultCount,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        
        NotificationGetAllRequest request = new NotificationGetAllRequest();
        request.setUserId(userId);
        request.setSkipCount(skipCount);
        request.setMaxResultCount(maxResultCount);
        request.setSortBy(sortBy);
        request.setSortDirection(sortDirection);
        
        // Parse enum values
        if (type != null) {
            try {
                request.setType(com.qm.bookstore.qm_bookstore.entity.Notification.NotificationType.valueOf(type.toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid notification type: {}", type);
            }
        }
        if (status != null) {
            try {
                request.setStatus(com.qm.bookstore.qm_bookstore.entity.Notification.NotificationStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid notification status: {}", status);
            }
        }
        
        // Parse date filters
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        if (fromDate != null) {
            try {
                request.setFromDate(LocalDateTime.parse(fromDate, formatter));
            } catch (Exception e) {
                log.warn("Invalid fromDate format: {}", fromDate);
            }
        }
        if (toDate != null) {
            try {
                request.setToDate(LocalDateTime.parse(toDate, formatter));
            } catch (Exception e) {
                log.warn("Invalid toDate format: {}", toDate);
            }
        }
        
        log.info("Getting all notifications with filters - userId: {}, type: {}, status: {}", userId, type, status);
        
        BaseGetAllResponse<NotificationResponse> notifications = notificationService.getAllNotifications(request);
        
        return ApiResponse.<BaseGetAllResponse<NotificationResponse>>builder()
                .result(notifications)
                .build();
    }

    /**
     * Lấy thông báo theo ID
     */
    @GetMapping("/{id}")
    public ApiResponse<NotificationResponse> getNotificationById(@PathVariable UUID id) {
        log.info("Getting notification by id: {}", id);
        
        NotificationResponse notification = notificationService.getNotificationById(id);
        
        return ApiResponse.<NotificationResponse>builder()
                .result(notification)
                .build();
    }

    /**
     * Tạo thông báo mới
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ApiResponse<NotificationResponse> createNotification(@RequestBody NotificationCreateRequest request) {
        log.info("Creating new notification for user: {}", request.getUserId());
        
        NotificationResponse notification = notificationService.createNotification(request);
        
        return ApiResponse.<NotificationResponse>builder()
                .result(notification)
                .build();
    }

    /**
     * Cập nhật trạng thái thông báo
     */
    @PutMapping("/{id}")
    public ApiResponse<NotificationResponse> updateNotificationStatus(
            @PathVariable UUID id, 
            @RequestBody NotificationUpdateRequest request) {
        log.info("Updating notification id: {} with status: {}", id, request.getStatus());
        
        request.setId(id);
        NotificationResponse notification = notificationService.updateNotificationStatus(request);
        
        return ApiResponse.<NotificationResponse>builder()
                .result(notification)
                .build();
    }

    /**
     * Xóa thông báo
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ApiResponse<Void> deleteNotification(@PathVariable UUID id) {
        log.info("Deleting notification id: {}", id);
        
        notificationService.deleteNotification(id);
        
        return ApiResponse.<Void>builder()
                .build();
    }

    /**
     * Lấy tất cả thông báo của một user cụ thể
     */
    @GetMapping("/user/{userId}")
    public ApiResponse<List<NotificationResponse>> getNotificationsByUserId(@PathVariable UUID userId) {
        log.info("Getting notifications for user: {}", userId);
        
        List<NotificationResponse> notifications = notificationService.getNotificationsByUserId(userId);
        
        return ApiResponse.<List<NotificationResponse>>builder()
                .result(notifications)
                .build();
    }

    /**
     * Lấy tất cả thông báo chưa đọc của một user
     */
    @GetMapping("/user/{userId}/unread")
    public ApiResponse<List<NotificationResponse>> getUnreadNotificationsByUserId(@PathVariable UUID userId) {
        log.info("Getting unread notifications for user: {}", userId);
        
        List<NotificationResponse> notifications = notificationService.getUnreadNotificationsByUserId(userId);
        
        return ApiResponse.<List<NotificationResponse>>builder()
                .result(notifications)
                .build();
    }

    /**
     * Đếm số thông báo chưa đọc của user
     */
    @GetMapping("/user/{userId}/unread/count")
    public ApiResponse<Long> getUnreadNotificationCount(@PathVariable UUID userId) {
        log.info("Getting unread notification count for user: {}", userId);
        
        Long count = notificationService.getUnreadNotificationCount(userId);
        
        return ApiResponse.<Long>builder()
                .result(count)
                .build();
    }

    /**
     * Đánh dấu một thông báo là đã đọc
     */
    @PutMapping("/{id}/mark-read")
    public ApiResponse<Void> markNotificationAsRead(@PathVariable UUID id) {
        log.info("Marking notification as read: {}", id);
        
        notificationService.markNotificationAsRead(id);
        
        return ApiResponse.<Void>builder()
                .build();
    }

    /**
     * Đánh dấu tất cả thông báo của user là đã đọc
     */
    @PutMapping("/user/{userId}/mark-all-read")
    public ApiResponse<Void> markAllNotificationsAsRead(@PathVariable UUID userId) {
        log.info("Marking all notifications as read for user: {}", userId);
        
        notificationService.markAllNotificationsAsRead(userId);
        
        return ApiResponse.<Void>builder()
                .build();
    }

    // Convenience endpoints for specific notification types

    /**
     * Tạo thông báo tin nhắn mới
     */
    @PostMapping("/new-message")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('USER')")
    public ApiResponse<NotificationResponse> createNewMessageNotification(
            @RequestParam UUID userId,
            @RequestParam String senderName,
            @RequestParam String messagePreview) {
        log.info("Creating new message notification for user: {} from sender: {}", userId, senderName);
        
        NotificationResponse notification = notificationService.createNewMessageNotification(userId, senderName, messagePreview);
        
        return ApiResponse.<NotificationResponse>builder()
                .result(notification)
                .build();
    }

    /**
     * Tạo thông báo cập nhật đơn hàng
     */
    @PostMapping("/order-update")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ApiResponse<NotificationResponse> createOrderUpdateNotification(
            @RequestParam UUID userId,
            @RequestParam String orderNumber,
            @RequestParam String status) {
        log.info("Creating order update notification for user: {}, order: {}, status: {}", userId, orderNumber, status);
        
        NotificationResponse notification = notificationService.createOrderUpdateNotification(userId, orderNumber, status);
        
        return ApiResponse.<NotificationResponse>builder()
                .result(notification)
                .build();
    }

    /**
     * Tạo thông báo cập nhật thanh toán
     */
    @PostMapping("/payment-update")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ApiResponse<NotificationResponse> createPaymentUpdateNotification(
            @RequestParam UUID userId,
            @RequestParam String paymentId,
            @RequestParam String status) {
        log.info("Creating payment update notification for user: {}, payment: {}, status: {}", userId, paymentId, status);
        
        NotificationResponse notification = notificationService.createPaymentUpdateNotification(userId, paymentId, status);
        
        return ApiResponse.<NotificationResponse>builder()
                .result(notification)
                .build();
    }

    /**
     * Tạo thông báo hệ thống
     */
    @PostMapping("/system")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<NotificationResponse> createSystemNotification(
            @RequestParam UUID userId,
            @RequestParam String message) {
        log.info("Creating system notification for user: {}", userId);
        
        NotificationResponse notification = notificationService.createSystemNotification(userId, message);
        
        return ApiResponse.<NotificationResponse>builder()
                .result(notification)
                .build();
    }

    /**
     * Tạo thông báo khuyến mãi
     */
    @PostMapping("/promotion")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ApiResponse<NotificationResponse> createPromotionNotification(
            @RequestParam UUID userId,
            @RequestParam String promotionTitle,
            @RequestParam(required = false) String promotionLink) {
        log.info("Creating promotion notification for user: {}, promotion: {}", userId, promotionTitle);
        
        NotificationResponse notification = notificationService.createPromotionNotification(userId, promotionTitle, promotionLink);
        
        return ApiResponse.<NotificationResponse>builder()
                .result(notification)
                .build();
    }

    /**
     * Lấy tất cả thông báo toàn cục (global notifications) - chỉ dành cho admin/manager
     * Những notification này có userId = null và type = NEW_MESSAGE
     */
    @GetMapping("/global")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ApiResponse<List<NotificationResponse>> getGlobalNotifications() {
        log.info("Getting global notifications for admin/manager");
        
        List<NotificationResponse> notifications = notificationService.getGlobalNotifications();
        
        return ApiResponse.<List<NotificationResponse>>builder()
                .result(notifications)
                .build();
    }

    /**
     * Lấy tất cả thông báo bao gồm cả personal và global cho admin/manager
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ApiResponse<List<NotificationResponse>> getAllNotificationsForAdmin(
            @RequestParam UUID adminUserId) {
        log.info("Getting all notifications (personal + global) for admin/manager: {}", adminUserId);
        
        List<NotificationResponse> notifications = notificationService.getAllNotificationsForAdmin(adminUserId);
        
        return ApiResponse.<List<NotificationResponse>>builder()
                .result(notifications)
                .build();
    }
}
