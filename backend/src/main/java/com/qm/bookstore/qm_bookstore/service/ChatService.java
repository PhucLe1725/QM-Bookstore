package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.chat.ChatMessageDto;
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
        Page<ChatMessage> messages = chatMessageRepository.findAll(pageable);
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
}