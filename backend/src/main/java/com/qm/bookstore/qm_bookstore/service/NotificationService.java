package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.base.response.BaseGetAllResponse;
import com.qm.bookstore.qm_bookstore.dto.notification.request.NotificationCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.notification.request.NotificationGetAllRequest;
import com.qm.bookstore.qm_bookstore.dto.notification.request.NotificationUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.notification.response.NotificationResponse;
import com.qm.bookstore.qm_bookstore.entity.Notification;
import com.qm.bookstore.qm_bookstore.entity.User;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.mapper.NotificationMapper;
import com.qm.bookstore.qm_bookstore.repository.NotificationRepository;
import com.qm.bookstore.qm_bookstore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
@Slf4j
public class NotificationService {

    NotificationRepository notificationRepository;
    UserRepository userRepository;
    NotificationMapper notificationMapper;

    public NotificationResponse getNotificationById(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));
        return notificationMapper.toNotificationResponse(notification);
    }

    public BaseGetAllResponse<NotificationResponse> getAllNotifications(NotificationGetAllRequest request) {
        // Create pageable
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        if (request.getSortBy() != null && !request.getSortBy().isEmpty()) {
            Sort.Direction direction = "desc".equalsIgnoreCase(request.getSortDirection()) 
                ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, request.getSortBy());
        }
        
        Pageable pageable = PageRequest.of(
            request.getSkipCount() / request.getMaxResultCount(),
            request.getMaxResultCount(),
            sort
        );

        // Get notifications with filters
        Page<Notification> notificationPage = notificationRepository.findNotificationsWithFilters(
            request.getUserId(),
            request.getType(),
            request.getStatus(),
            request.getFromDate(),
            request.getToDate(),
            pageable
        );

        List<NotificationResponse> notificationResponses = notificationMapper.toNotificationResponseList(notificationPage.getContent());

        return BaseGetAllResponse.<NotificationResponse>builder()
                .data(notificationResponses)
                .totalRecords(notificationPage.getTotalElements())
                .build();
    }

    @Transactional
    public NotificationResponse createNotification(NotificationCreateRequest request) {
        // Verify user exists only if userId is not null (for non-global notifications)
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        }
        
        Notification notification = notificationMapper.toNotification(request);
        notification.setStatus(Notification.NotificationStatus.UNREAD);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());
        
        notification = notificationRepository.save(notification);
        
        // Return response (WebSocket handled by ChatNotificationService)
        NotificationResponse response = notificationMapper.toNotificationResponse(notification);
        return response;
    }

    @Transactional
    public NotificationResponse updateNotificationStatus(NotificationUpdateRequest request) {
        Notification notification = notificationRepository.findById(request.getId())
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));
        
        notification.setStatus(request.getStatus());
        notification.setUpdatedAt(LocalDateTime.now());
        notification = notificationRepository.save(notification);
        
        return notificationMapper.toNotificationResponse(notification);
    }

    @Transactional
    public void deleteNotification(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));
        notificationRepository.delete(notification);
    }

    public List<NotificationResponse> getNotificationsByUserId(UUID userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return notificationMapper.toNotificationResponseList(notifications);
    }

    public List<NotificationResponse> getUnreadNotificationsByUserId(UUID userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
            userId, Notification.NotificationStatus.UNREAD);
        return notificationMapper.toNotificationResponseList(notifications);
    }

    public Long getUnreadNotificationCount(UUID userId) {
        // Sử dụng query mới để đếm cả personal và global notifications
        return notificationRepository.countUnreadNotificationsForAdmin(userId);
    }

    @Transactional
    public void markNotificationAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));
                
        // Nếu là global notification (user_id IS NULL và type NEW_MESSAGE)
        if (notification.getUserId() == null && notification.getType() == Notification.NotificationType.NEW_MESSAGE) {
            // Đánh dấu tất cả global NEW_MESSAGE notifications là đã đọc
            notificationRepository.markGlobalNewMessageAsRead(LocalDateTime.now());
            log.info("Marked all global NEW_MESSAGE notifications as read");
        } else {
            // Đánh dấu notification cá nhân là đã đọc
            int updated = notificationRepository.updateStatusById(
                notificationId, 
                Notification.NotificationStatus.READ, 
                LocalDateTime.now()
            );
            if (updated == 0) {
                throw new AppException(ErrorCode.NOTIFICATION_NOT_FOUND);
            }
        }
    }

    @Transactional
    public void markAllNotificationsAsRead(UUID userId) {
        notificationRepository.markAllAsReadByUserId(
            userId, 
            Notification.NotificationStatus.READ,
            Notification.NotificationStatus.UNREAD,
            LocalDateTime.now()
        );
    }

    // Convenience methods for specific notification types
    
    @Transactional
    public NotificationResponse createNewMessageNotification(UUID userId, String senderName, String messagePreview) {
        NotificationCreateRequest request = new NotificationCreateRequest();
        request.setUserId(userId);
        request.setType(Notification.NotificationType.NEW_MESSAGE);
        
        // Cải thiện format message với username rõ ràng
        String formattedMessage = String.format("New message from %s: %s", 
            senderName != null ? senderName : "Unknown User", 
            messagePreview != null ? messagePreview : "");
        request.setMessage(formattedMessage);
        request.setAnchor("/chat/" + userId);
        
        return createNotification(request);
    }

    @Transactional
    public NotificationResponse createGlobalNewMessageNotification(UUID senderUserId, String senderName, String messagePreview) {
        NotificationCreateRequest request = new NotificationCreateRequest();
        request.setUserId(null); // NULL user_id for global notification
        request.setType(Notification.NotificationType.NEW_MESSAGE);
        
        // Cải thiện format message với username rõ ràng cho global notification
        String formattedMessage = String.format("New message from %s: %s", 
            senderName != null ? senderName : "Customer", 
            messagePreview != null ? messagePreview : "");
        request.setMessage(formattedMessage);
        request.setAnchor("/admin/message");
        
        return createNotification(request);
    }

    @Transactional
    public NotificationResponse createOrderUpdateNotification(UUID userId, String orderNumber, String status) {
        NotificationCreateRequest request = new NotificationCreateRequest();
        request.setUserId(userId);
        request.setType(Notification.NotificationType.ORDER_UPDATE);
        request.setMessage(String.format("Order %s has been %s", orderNumber, status));
        request.setAnchor("/orders/" + orderNumber);
        
        return createNotification(request);
    }

    @Transactional
    public NotificationResponse createPaymentUpdateNotification(UUID userId, String paymentId, String status) {
        NotificationCreateRequest request = new NotificationCreateRequest();
        request.setUserId(userId);
        request.setType(Notification.NotificationType.PAYMENT_UPDATE);
        request.setMessage(String.format("Payment %s: %s", paymentId, status));
        request.setAnchor("/payments/" + paymentId);
        
        return createNotification(request);
    }

    @Transactional
    public NotificationResponse createSystemNotification(UUID userId, String message) {
        NotificationCreateRequest request = new NotificationCreateRequest();
        request.setUserId(userId);
        request.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        request.setMessage(message);
        
        return createNotification(request);
    }

    @Transactional
    public NotificationResponse createPromotionNotification(UUID userId, String promotionTitle, String promotionLink) {
        NotificationCreateRequest request = new NotificationCreateRequest();
        request.setUserId(userId);
        request.setType(Notification.NotificationType.PROMOTION);
        request.setMessage(String.format("New promotion: %s", promotionTitle));
        request.setAnchor(promotionLink);
        
        return createNotification(request);
    }

    // Cleanup old notifications (can be scheduled)
    @Transactional
    public int cleanupOldNotifications(int daysOld) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        int deleted = notificationRepository.deleteByCreatedAtBefore(cutoffDate);
        log.info("Cleaned up {} old notifications older than {} days", deleted, daysOld);
        return deleted;
    }

    /**
     * Lấy tất cả global notifications (userId = null và type = NEW_MESSAGE)
     * Dành cho admin/manager để xem thông báo tin nhắn toàn cục
     */
    public List<NotificationResponse> getGlobalNotifications() {
        List<Notification> notifications = notificationRepository.findGlobalNotifications();
        return notificationMapper.toNotificationResponseList(notifications);
    }

    /**
     * Lấy tất cả notifications bao gồm cả personal và global cho admin/manager
     * @param adminUserId ID của admin/manager
     * @return List các notification (personal + global)
     */
    public List<NotificationResponse> getAllNotificationsForAdmin(UUID adminUserId) {
        // Lấy personal notifications của admin/manager
        List<Notification> personalNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(adminUserId);
        
        // Lấy global notifications
        List<Notification> globalNotifications = notificationRepository.findGlobalNotifications();
        
        // Gộp 2 lists và sắp xếp theo thời gian tạo (mới nhất trước)
        List<Notification> allNotifications = new java.util.ArrayList<>();
        allNotifications.addAll(personalNotifications);
        allNotifications.addAll(globalNotifications);
        
        // Sắp xếp theo createdAt DESC
        allNotifications.sort((n1, n2) -> n2.getCreatedAt().compareTo(n1.getCreatedAt()));
        
        return notificationMapper.toNotificationResponseList(allNotifications);
    }
}