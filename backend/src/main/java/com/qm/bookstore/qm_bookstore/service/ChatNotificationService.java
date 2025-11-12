package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.chat.AdminNotification;
import com.qm.bookstore.qm_bookstore.dto.chat.ChatMessageDto;
import com.qm.bookstore.qm_bookstore.dto.chat.ConversationUpdate;
import com.qm.bookstore.qm_bookstore.dto.notification.response.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    
    /**
     * Broadcast global notification qua WebSocket (notification đã được tạo trong database)
     */
    public void broadcastGlobalNotification(NotificationResponse notification) {
        try {
            // Gửi notification real-time tới tất cả admin/manager qua WebSocket
            messagingTemplate.convertAndSend("/topic/notifications", notification);
            log.info("Broadcasted global notification with ID {} to all admins", notification.getId());
        } catch (Exception e) {
            log.error("Failed to broadcast global notification: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Broadcast personal notification qua WebSocket (notification đã được tạo trong database)
     */
    public void broadcastPersonalNotification(UUID userId, NotificationResponse notification) {
        try {
            // Gửi notification real-time tới customer qua WebSocket
            messagingTemplate.convertAndSend("/topic/notifications/" + userId, notification);
            log.info("Broadcasted personal notification with ID {} to user {}", notification.getId(), userId);
        } catch (Exception e) {
            log.error("Failed to broadcast personal notification to user {}: {}", userId, e.getMessage(), e);
        }
    }
    
    /**
     * Gửi notification tới tất cả admin/manager
     */
    public void sendAdminNotification(AdminNotification notification) {
        try {
            messagingTemplate.convertAndSend("/topic/admin-notifications", notification);
            log.info("Sent admin notification: {} for user: {}", 
                    notification.getType(), notification.getUserId());
        } catch (Exception e) {
            log.error("Failed to send admin notification", e);
        }
    }
    
    /**
     * Gửi update tới conversation cụ thể
     */
    public void sendConversationUpdate(UUID userId, ConversationUpdate update) {
        try {
            messagingTemplate.convertAndSend("/topic/conversation/" + userId, update);
            log.info("Sent conversation update: {} for user: {}", 
                    update.getUpdateType(), userId);
        } catch (Exception e) {
            log.error("Failed to send conversation update for user: {}", userId, e);
        }
    }
    
    /**
     * Xử lý khi có tin nhắn mới từ user
     * DEPRECATED: Sử dụng ChatService.createNotificationsForMessage() thay thế
     */
    @Deprecated
    public void handleNewUserMessage(ChatMessageDto message) {
        // Method này đã được thay thế bởi ChatService.createNotificationsForMessage()
        // Để tránh duplicate notifications, không sử dụng method này nữa
        log.warn("handleNewUserMessage is deprecated. Use ChatService.createNotificationsForMessage() instead");
    }
    
    /**
     * Xử lý khi admin/manager gửi tin nhắn
     * DEPRECATED: Sử dụng ChatService.createNotificationsForMessage() thay thế
     */
    @Deprecated
    public void handleAdminMessage(ChatMessageDto message, UUID receiverId) {
        // Method này đã được thay thế bởi ChatService.createNotificationsForMessage()
        // Để tránh duplicate notifications, không sử dụng method này nữa
        log.warn("handleAdminMessage is deprecated. Use ChatService.createNotificationsForMessage() instead");
    }
    
    /**
     * Gửi typing indicator
     */
    public void sendTypingIndicator(UUID conversationUserId, UUID actorId, 
                                   String actorUsername, String actorType, boolean isTyping) {
        ConversationUpdate update = ConversationUpdate.typing(
                conversationUserId, actorId, actorUsername, actorType, isTyping
        );
        sendConversationUpdate(conversationUserId, update);
    }
    
    /**
     * Gửi thông báo trạng thái user (online/offline)
     */
    public void sendUserStatusUpdate(UUID userId, String status, String username) {
        ConversationUpdate update = ConversationUpdate.userStatus(userId, status, username);
        sendConversationUpdate(userId, update);
        
        // Cũng thông báo tới admin
        AdminNotification notification = AdminNotification.systemAlert(
                "User " + username + " is now " + status
        );
        sendAdminNotification(notification);
    }
    
    /**
     * Gửi system alert tới tất cả admin
     */
    public void sendSystemAlert(String message) {
        AdminNotification notification = AdminNotification.systemAlert(message);
        sendAdminNotification(notification);
    }
}