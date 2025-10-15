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
public class UserStatusDto {
    
    private UUID userId; // ID của user
    
    private String username; // Tên của user
    
    private String status; // "online", "offline", "away", "busy"
    
    private String lastSeen; // Thời gian online lần cuối (optional)
}