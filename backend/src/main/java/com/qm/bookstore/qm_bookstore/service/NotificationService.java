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
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    SimpMessagingTemplate messagingTemplate;

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
        // Verify user exists
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        Notification notification = notificationMapper.toNotification(request);
        notification.setStatus(Notification.NotificationStatus.UNREAD);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());
        
        notification = notificationRepository.save(notification);
        
        // Send real-time notification via WebSocket
        NotificationResponse response = notificationMapper.toNotificationResponse(notification);
        sendRealTimeNotification(request.getUserId(), response);
        
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
        return notificationRepository.countByUserIdAndStatus(userId, Notification.NotificationStatus.UNREAD);
    }

    @Transactional
    public void markNotificationAsRead(UUID notificationId) {
        int updated = notificationRepository.updateStatusById(
            notificationId, 
            Notification.NotificationStatus.READ, 
            LocalDateTime.now()
        );
        if (updated == 0) {
            throw new AppException(ErrorCode.NOTIFICATION_NOT_FOUND);
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
        request.setMessage(String.format("New message from %s: %s", senderName, messagePreview));
        request.setAnchor("/chat/" + userId);
        
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

    // Send real-time notification via WebSocket
    private void sendRealTimeNotification(UUID userId, NotificationResponse notification) {
        try {
            messagingTemplate.convertAndSend("/topic/notifications/" + userId, notification);
            log.info("Sent real-time notification to user: {}, type: {}", userId, notification.getType());
        } catch (Exception e) {
            log.error("Failed to send real-time notification to user: {}", userId, e);
        }
    }

    // Cleanup old notifications (can be scheduled)
    @Transactional
    public int cleanupOldNotifications(int daysOld) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        int deleted = notificationRepository.deleteByCreatedAtBefore(cutoffDate);
        log.info("Cleaned up {} old notifications older than {} days", deleted, daysOld);
        return deleted;
    }
}