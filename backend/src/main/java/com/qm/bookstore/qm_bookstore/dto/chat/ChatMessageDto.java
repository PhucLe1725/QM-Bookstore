package com.qm.bookstore.qm_bookstore.dto.chat;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessageDto {
    
    Long id;
    UUID senderId;
    UUID receiverId;
    String message;
    String senderType; // "ADMIN", "USER", "CHATBOT"
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime createdAt;
    
    // Read status fields
    Boolean isReadByAdmin;
    Boolean isReadByUser;
    
    // Additional fields for display
    String senderUsername;
    String receiverUsername;
}