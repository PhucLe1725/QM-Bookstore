package com.qm.bookstore.qm_bookstore.dto.notification.request;

import com.qm.bookstore.qm_bookstore.dto.base.request.BaseGetAllRequest;
import com.qm.bookstore.qm_bookstore.entity.Notification;
import lombok.AccessLevel;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationGetAllRequest extends BaseGetAllRequest {
    UUID userId;
    Notification.NotificationType type;
    Notification.NotificationStatus status;
    LocalDateTime fromDate;
    LocalDateTime toDate;
}