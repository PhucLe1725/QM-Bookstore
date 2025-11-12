package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.chat.ChatMessageDto;
import com.qm.bookstore.qm_bookstore.dto.notification.response.NotificationResponse;
import com.qm.bookstore.qm_bookstore.entity.ChatMessage;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.mapper.ChatMapper;
import com.qm.bookstore.qm_bookstore.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatMapper chatMapper;
    private final NotificationService notificationService;
    private final ChatNotificationService chatNotificationService;

    @Transactional
    public ChatMessageDto saveMessage(ChatMessageDto messageDto) {
        try {
            ChatMessage message = chatMapper.toEntity(messageDto);
            
            // Set timestamp if not provided
            if (message.getCreatedAt() == null) {
                message.setCreatedAt(LocalDateTime.now());
            }
            
            // Business logic: User messages don't need receiver_id (broadcast to all admins/managers)
            if ("user".equals(messageDto.getSenderType())) {
                message.setReceiverId(null); // User messages go to system, no specific receiver
                log.info("User message from {} will be visible to all admin/manager", message.getSenderId());
            }
            // Admin/Manager messages must have receiver_id for traceability
            else if (("admin".equals(messageDto.getSenderType()) || "manager".equals(messageDto.getSenderType())) 
                     && message.getReceiverId() == null) {
                log.warn("Admin/Manager message should have receiver_id for traceability");
            }
            
            ChatMessage savedMessage = chatMessageRepository.save(message);
            
            log.info("Saved chat message with ID: {} from sender: {} type: {} to receiver: {}", 
                    savedMessage.getId(), savedMessage.getSenderId(), savedMessage.getSenderType(), savedMessage.getReceiverId());
            
            // Create notifications based on message type and broadcast via WebSocket
            createNotificationsForMessage(savedMessage, messageDto);
            
            return chatMapper.toDto(savedMessage);
        } catch (Exception e) {
            log.error("Error saving chat message: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.CHAT_SAVE_FAILED);
        }
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageDto> getChatHistory(UUID userId, Pageable pageable) {
        Page<ChatMessage> messages = chatMessageRepository.findChatHistoryByUserId(userId, pageable);
        return messages.map(chatMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageDto> getAllMessages(Pageable pageable) {
        Page<ChatMessage> messages = chatMessageRepository.findAllByOrderByCreatedAtDesc(pageable);
        return messages.map(chatMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<UUID> getActiveConversations() {
        return chatMessageRepository.findActiveConversations();
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageDto> getConversationBetweenUsers(UUID user1Id, UUID user2Id, Pageable pageable) {
        Page<ChatMessage> messages = chatMessageRepository.findConversationBetweenUsers(user1Id, user2Id, pageable);
        return messages.map(chatMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getLatestConversationsForAdmin(UUID adminId) {
        List<ChatMessage> messages = chatMessageRepository.findLatestConversationsForAdmin(adminId);
        return messages.stream()
                .map(chatMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageDto> getMessagesByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        Page<ChatMessage> messages = chatMessageRepository.findMessagesByDateRange(startDate, endDate, pageable);
        return messages.map(chatMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Long countUnreadMessagesBetweenUsers(UUID senderId, UUID receiverId) {
        return chatMessageRepository.countUnreadMessagesBetweenUsers(senderId, receiverId);
    }

    @Transactional(readOnly = true)
    public Long countUnreadAdminMessages(UUID userId) {
        return chatMessageRepository.countUnreadAdminMessages(userId);
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageDto> getAllUserMessages(Pageable pageable) {
        Page<ChatMessage> userMessages = chatMessageRepository.findByMessageTypeUser(pageable);
        return userMessages.map(chatMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageDto> getMessagesFromUser(UUID userId, Pageable pageable) {
        Page<ChatMessage> messages = chatMessageRepository.findMessagesByUserIdAndSenderType(userId, ChatMessage.SenderType.user, pageable);
        return messages.map(chatMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageDto> getFullConversationWithUser(UUID userId, Pageable pageable) {
        Page<ChatMessage> conversation = chatMessageRepository.findFullConversationWithUser(userId, pageable);
        return conversation.map(chatMapper::toDto);
    }

    // ===== READ STATUS METHODS =====

    /**
     * Đánh dấu tin nhắn đã đọc bởi admin cho user cụ thể
     */
    @Transactional
    public int markAsReadByAdminForUser(UUID userId) {
        log.info("Marking messages as read by admin for user: {}", userId);
        return chatMessageRepository.markAsReadByAdminForUser(userId);
    }

    /**
     * Đánh dấu tin nhắn đã đọc bởi user từ admin
     */
    @Transactional
    public int markAsReadByUserFromAdmin(UUID userId) {
        log.info("Marking messages as read by user: {}", userId);
        return chatMessageRepository.markAsReadByUserFromAdmin(userId);
    }

    /**
     * Đánh dấu một tin nhắn cụ thể đã đọc bởi admin
     */
    @Transactional
    public int markMessageAsReadByAdmin(Long messageId) {
        log.info("Marking message {} as read by admin", messageId);
        return chatMessageRepository.markMessageAsReadByAdmin(messageId);
    }

    /**
     * Đánh dấu một tin nhắn cụ thể đã đọc bởi user
     */
    @Transactional
    public int markMessageAsReadByUser(Long messageId) {
        log.info("Marking message {} as read by user", messageId);
        return chatMessageRepository.markMessageAsReadByUser(messageId);
    }

    /**
     * Lấy số tin nhắn chưa đọc bởi admin từ user cụ thể
     */
    @Transactional(readOnly = true)
    public Long getUnreadCountByAdminFromUser(UUID userId) {
        return chatMessageRepository.countUnreadByAdminFromUser(userId);
    }

    /**
     * Lấy số tin nhắn chưa đọc bởi user từ admin
     */
    @Transactional(readOnly = true)
    public Long getUnreadCountByUserFromAdmin(UUID userId) {
        return chatMessageRepository.countUnreadByUserFromAdmin(userId);
    }

    /**
     * Lấy tổng số tin nhắn chưa đọc bởi admin
     */
    @Transactional(readOnly = true)
    public Long getTotalUnreadByAdmin() {
        return chatMessageRepository.countTotalUnreadByAdmin();
    }

    /**
     * Lấy danh sách users có tin nhắn chưa đọc
     */
    @Transactional(readOnly = true)
    public List<UUID> getUsersWithUnreadMessages() {
        return chatMessageRepository.findUsersWithUnreadMessages();
    }

    /**
     * Lấy tất cả tin nhắn chưa đọc bởi admin
     */
    @Transactional(readOnly = true)
    public Page<ChatMessageDto> getUnreadMessagesByAdmin(Pageable pageable) {
        Page<ChatMessage> unreadMessages = chatMessageRepository.findUnreadByAdmin(pageable);
        return unreadMessages.map(chatMapper::toDto);
    }

    /**
     * Lấy tin nhắn chưa đọc bởi user cụ thể
     */
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getUnreadMessagesByUser(UUID userId) {
        List<ChatMessage> unreadMessages = chatMessageRepository.findUnreadByUser(userId);
        return unreadMessages.stream()
                .map(chatMapper::toDto)
                .toList();
    }

    /**
     * Create notifications based on chat message type and participants
     */
    private void createNotificationsForMessage(ChatMessage savedMessage, ChatMessageDto messageDto) {
        try {
            String senderType = savedMessage.getSenderType().name();
            UUID senderId = savedMessage.getSenderId();
            UUID receiverId = savedMessage.getReceiverId();
            String messagePreview = truncateMessage(savedMessage.getMessage());
            
            log.info("Creating notifications for message from {} (type: {}) to {}", 
                    senderId, senderType, receiverId);

            if ("user".equals(senderType)) {
                // Customer gửi message → Tạo global notification cho admin/manager
                log.info("Customer message detected - creating global notification for admin/manager");
                
                // Get sender username for notification message
                String senderName = messageDto.getSenderUsername() != null ? 
                    messageDto.getSenderUsername() : "Customer";
                
                // Tạo notification trong database
                NotificationResponse globalNotification = notificationService.createGlobalNewMessageNotification(
                    senderId, 
                    senderName, 
                    messagePreview
                );
                
                log.info("Created global notification in database with ID: {}", globalNotification.getId());
                
                // Broadcast notification real-time qua WebSocket
                chatNotificationService.broadcastGlobalNotification(globalNotification);
                
            } else if (("admin".equals(senderType) || "manager".equals(senderType)) && receiverId != null) {
                // Admin/Manager gửi message cho customer → Tạo personal notification cho customer
                log.info("Admin/Manager message detected - creating personal notification for customer {}", receiverId);
                
                String senderName = messageDto.getSenderUsername() != null ? 
                    messageDto.getSenderUsername() : "Admin";
                
                // Tạo notification trong database
                NotificationResponse personalNotification = notificationService.createNewMessageNotification(
                    receiverId, // Customer ID
                    senderName, 
                    messagePreview
                );
                
                log.info("Created personal notification for customer {} with ID: {}", receiverId, personalNotification.getId());
                
                // Broadcast notification real-time qua WebSocket
                chatNotificationService.broadcastPersonalNotification(receiverId, personalNotification);
            }
            
            log.info("Notifications created and broadcasted successfully for message {}", savedMessage.getId());
            
        } catch (Exception e) {
            log.error("Error creating notifications for message {}: {}", savedMessage.getId(), e.getMessage(), e);
            // Don't throw exception - notification failure shouldn't break chat functionality
        }
    }

    /**
     * Truncate message for notification preview
     */
    private String truncateMessage(String message) {
        if (message == null) return "";
        return message.length() > 50 ? message.substring(0, 47) + "..." : message;
    }
}