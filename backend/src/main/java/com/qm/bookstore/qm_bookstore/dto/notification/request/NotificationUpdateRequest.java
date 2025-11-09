package com.qm.bookstore.qm_bookstore.dto.notification.request;

import com.qm.bookstore.qm_bookstore.entity.Notification;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationUpdateRequest {
    UUID id;
    Notification.NotificationStatus status;
}