package com.qm.bookstore.qm_bookstore.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingIndicatorDto {
    
    private UUID conversationUserId; // User ID của cuộc trò chuyện
    
    private UUID actorId; // ID của người đang typing
    
    private String actorUsername; // Tên của người đang typing
    
    private String actorType; // "user", "admin", "manager"
    
    private boolean typing; // true = đang typing, false = dừng typing
}