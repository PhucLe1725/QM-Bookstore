package com.qm.bookstore.qm_bookstore.dto.notification.response;

import com.qm.bookstore.qm_bookstore.entity.Notification;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationResponse {
    UUID id;
    UUID userId;
    String username;
    Notification.NotificationType type;
    String message;
    String anchor;
    Notification.NotificationStatus status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}