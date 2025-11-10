package com.qm.bookstore.qm_bookstore.dto.chat.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MarkMessagesReadRequest {
    UUID userId;
    List<Long> messageIds;
    Boolean markAllFromUser = false;
}