package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.chat.AdminNotification;
import com.qm.bookstore.qm_bookstore.dto.chat.ChatMessageDto;
import com.qm.bookstore.qm_bookstore.dto.chat.ConversationUpdate;
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
     */
    public void handleNewUserMessage(ChatMessageDto message) {
        UUID userId = message.getSenderId();
        
        // 1. Gửi notification tới tất cả admin
        AdminNotification notification = AdminNotification.newUserMessage(
                userId, 
                UUID.randomUUID(), // Tạm thời dùng random UUID, có thể convert từ Long sau
                message.getSenderUsername(), 
                message.getMessage()
        );
        sendAdminNotification(notification);
        
        // 2. Gửi update tới conversation cụ thể
        ConversationUpdate update = ConversationUpdate.newMessage(userId, message);
        sendConversationUpdate(userId, update);
    }
    
    /**
     * Xử lý khi admin/manager gửi tin nhắn
     */
    public void handleAdminMessage(ChatMessageDto message, UUID receiverId) {
        // 1. Gửi notification tới tất cả admin khác
        AdminNotification notification = AdminNotification.conversationUpdate(
                receiverId,
                UUID.randomUUID(), // Tạm thời dùng random UUID, có thể convert từ Long sau
                message.getSenderId(),
                message.getSenderUsername(),
                message.getSenderType(),
                message.getMessage()
        );
        sendAdminNotification(notification);
        
        // 2. Gửi update tới conversation cụ thể
        ConversationUpdate update = ConversationUpdate.newMessage(receiverId, message);
        sendConversationUpdate(receiverId, update);
        
        // 3. Gửi tin nhắn trực tiếp tới user (nếu user đang online)
        try {
            messagingTemplate.convertAndSendToUser(
                    receiverId.toString(), 
                    "/queue/messages", 
                    message
            );
            log.info("Sent direct message to user: {}", receiverId);
        } catch (Exception e) {
            log.error("Failed to send direct message to user: {}", receiverId, e);
        }
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