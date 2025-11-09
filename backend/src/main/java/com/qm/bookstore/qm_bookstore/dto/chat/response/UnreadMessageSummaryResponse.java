package com.qm.bookstore.qm_bookstore.dto.chat.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UnreadMessageSummaryResponse {
    UUID userId;
    String username;
    Long unreadCount;
    String lastMessage;
    String lastMessageTime;
    boolean isFromUser; // true if last message is from user to admin
}