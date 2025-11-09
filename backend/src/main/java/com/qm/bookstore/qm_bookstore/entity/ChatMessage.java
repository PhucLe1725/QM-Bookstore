package com.qm.bookstore.qm_bookstore.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    
    @Column(name = "sender_id")
    UUID senderId;
    
    @Column(name = "receiver_id")
    UUID receiverId;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    String message;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 20)
    SenderType senderType;
    
    @CreationTimestamp
    @Column(name = "created_at")
    LocalDateTime createdAt;
    
    @Column(name = "is_read_by_admin", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    Boolean isReadByAdmin = false;
    
    @Column(name = "is_read_by_user", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    Boolean isReadByUser = false;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", insertable = false, updatable = false)
    User sender;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", insertable = false, updatable = false)
    User receiver;
    
    public enum SenderType {
        admin, user, manager, chatbot
    }
}