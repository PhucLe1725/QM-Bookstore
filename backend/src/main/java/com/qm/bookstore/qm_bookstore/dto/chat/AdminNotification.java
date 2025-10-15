package com.qm.bookstore.qm_bookstore.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotification {
    
    private String type; // "conversation_update", "new_user_message", "system_alert"
    
    private UUID userId; // User liên quan đến notification
    
    private UUID messageId; // ID của tin nhắn gây ra notification
    
    private UUID senderId; // Người gửi tin nhắn
    
    private String senderUsername; // Tên người gửi
    
    private String senderType; // "user", "admin", "manager"
    
    private String message; // Nội dung tin nhắn hoặc mô tả notification
    
    private LocalDateTime timestamp;
    
    private String conversationContext; // Thông tin bổ sung về cuộc trò chuyện
    
    // Factory methods for common notifications
    public static AdminNotification conversationUpdate(UUID userId, UUID messageId, 
                                                      UUID senderId, String senderUsername, 
                                                      String senderType, String message) {
        return AdminNotification.builder()
                .type("conversation_update")
                .userId(userId)
                .messageId(messageId)
                .senderId(senderId)
                .senderUsername(senderUsername)
                .senderType(senderType)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static AdminNotification newUserMessage(UUID userId, UUID messageId, 
                                                  String senderUsername, String message) {
        return AdminNotification.builder()
                .type("new_user_message")
                .userId(userId)
                .messageId(messageId)
                .senderId(userId)
                .senderUsername(senderUsername)
                .senderType("user")
                .message(message)
                .timestamp(LocalDateTime.now())
                .conversationContext("User " + senderUsername + " sent a new message")
                .build();
    }
    
    public static AdminNotification systemAlert(String message) {
        return AdminNotification.builder()
                .type("system_alert")
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
}