package com.qm.bookstore.qm_bookstore.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(name = "user_id")
    UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    NotificationType type;

    @Column(nullable = false, columnDefinition = "TEXT")
    String message;

    @Column(columnDefinition = "TEXT")
    String anchor;

    @Convert(converter = NotificationStatusConverter.class)
    @Builder.Default
    @Column(nullable = false, columnDefinition = "SMALLINT DEFAULT 1")
    NotificationStatus status = NotificationStatus.UNREAD;

    @Builder.Default
    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    LocalDateTime updatedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    User user;

    public enum NotificationType {
        NEW_MESSAGE("NEW_MESSAGE"),
        ORDER_UPDATE("ORDER_UPDATE"),
        PAYMENT_UPDATE("PAYMENT_UPDATE"),
        SYSTEM_NOTIFICATION("SYSTEM_NOTIFICATION"),
        PROMOTION("PROMOTION");

        private final String value;

        NotificationType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }

    public enum NotificationStatus {
        UNREAD(1),
        READ(2);

        private final int value;

        NotificationStatus(int value) {
            this.value = value;
        }

        public int getValue() {
            return value;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Converter
    public static class NotificationStatusConverter implements AttributeConverter<NotificationStatus, Integer> {
        @Override
        public Integer convertToDatabaseColumn(NotificationStatus status) {
            return status != null ? status.getValue() : null;
        }

        @Override
        public NotificationStatus convertToEntityAttribute(Integer value) {
            if (value == null) return null;
            for (NotificationStatus status : NotificationStatus.values()) {
                if (status.getValue() == value) {
                    return status;
                }
            }
            throw new IllegalArgumentException("Unknown value: " + value);
        }
    }
}