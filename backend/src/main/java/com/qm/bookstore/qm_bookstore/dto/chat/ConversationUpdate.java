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
public class ConversationUpdate {
    
    private String updateType; // "new_message", "message_read", "typing", "user_online", "user_offline"
    
    private UUID conversationUserId; // ID của user trong conversation
    
    private ChatMessageDto message; // Tin nhắn mới (nếu có)
    
    private UUID actorId; // ID của người thực hiện action
    
    private String actorUsername; // Tên của người thực hiện action
    
    private String actorType; // "user", "admin", "manager"
    
    private LocalDateTime timestamp;
    
    private Object metadata; // Dữ liệu bổ sung (typing indicator, read status, etc.)
    
    // Factory methods
    public static ConversationUpdate newMessage(UUID conversationUserId, ChatMessageDto message) {
        return ConversationUpdate.builder()
                .updateType("new_message")
                .conversationUserId(conversationUserId)
                .message(message)
                .actorId(message.getSenderId())
                .actorUsername(message.getSenderUsername())
                .actorType(message.getSenderType())
                .timestamp(message.getCreatedAt())
                .build();
    }
    
    public static ConversationUpdate typing(UUID conversationUserId, UUID actorId, 
                                          String actorUsername, String actorType, boolean isTyping) {
        return ConversationUpdate.builder()
                .updateType("typing")
                .conversationUserId(conversationUserId)
                .actorId(actorId)
                .actorUsername(actorUsername)
                .actorType(actorType)
                .timestamp(LocalDateTime.now())
                .metadata(isTyping)
                .build();
    }
    
    public static ConversationUpdate userStatus(UUID conversationUserId, String status, 
                                               String username) {
        return ConversationUpdate.builder()
                .updateType("user_" + status) // "user_online" or "user_offline"
                .conversationUserId(conversationUserId)
                .actorId(conversationUserId)
                .actorUsername(username)
                .actorType("user")
                .timestamp(LocalDateTime.now())
                .build();
    }
}