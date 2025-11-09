package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.chat.ChatMessageDto;
import com.qm.bookstore.qm_bookstore.dto.chat.TypingIndicatorDto;
import com.qm.bookstore.qm_bookstore.dto.chat.UserStatusDto;
import com.qm.bookstore.qm_bookstore.service.ChatService;
import com.qm.bookstore.qm_bookstore.service.ChatNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatNotificationService notificationService;

    @MessageMapping("/admin-chat")
    @SendTo("/topic/messages")
    public ChatMessageDto handleAdminChat(ChatMessageDto message, SimpMessageHeaderAccessor headerAccessor) {
        log.info("Received admin chat message: {}", message.getMessage());
        
        try {
            // Set timestamp and sender type if not provided
            if (message.getCreatedAt() == null) {
                message.setCreatedAt(LocalDateTime.now());
            }
            if (message.getSenderType() == null) {
                // Check if sender is manager or admin (default to admin for backward compatibility)
                message.setSenderType("admin"); // You may want to determine this from JWT token
            }
            
            // Save to database first
            ChatMessageDto savedMessage = chatService.saveMessage(message);
            log.info("Admin message saved with ID: {}", savedMessage.getId());
            
            // Return saved message for broadcast
            return savedMessage;
        } catch (Exception e) {
            log.error("Error handling admin chat: {}", e.getMessage(), e);
            // Return original message even if save fails to maintain real-time chat
            return message;
        }
    }

    @MessageMapping("/private-message")
    public void handlePrivateMessage(ChatMessageDto message, Principal principal) {
        log.info("Received private message from {}: {}", principal != null ? principal.getName() : "anonymous", message.getMessage());
        
        try {
            // Set timestamp and sender info
            if (message.getCreatedAt() == null) {
                message.setCreatedAt(LocalDateTime.now());
            }
            
            // Save to database first
            ChatMessageDto savedMessage = chatService.saveMessage(message);
            log.info("Private message saved with ID: {}", savedMessage.getId());
            
            // Send notifications through NotificationService
            if (savedMessage.getReceiverId() != null) {
                // This is admin/manager sending to user
                notificationService.handleAdminMessage(savedMessage, savedMessage.getReceiverId());
            }
        } catch (Exception e) {
            log.error("Error handling private message: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/user-message")
    public ChatMessageDto handleUserMessage(ChatMessageDto message, Principal principal) {
        log.info("Received user message: {}", message.getMessage());
        
        try {
            // Set timestamp and sender type
            if (message.getCreatedAt() == null) {
                message.setCreatedAt(LocalDateTime.now());
            }
            if (message.getSenderType() == null) {
                message.setSenderType("user");
            }
            
            // User messages don't need receiver_id - will be handled in service
            if ("user".equals(message.getSenderType())) {
                message.setReceiverId(null);
                log.info("User message will be broadcast to all admins/managers");
            }
            
            // Save to database first
            ChatMessageDto savedMessage = chatService.saveMessage(message);
            log.info("User message saved with ID: {} and will be visible to all admin/manager", savedMessage.getId());
            
            // Send notifications through NotificationService
            notificationService.handleNewUserMessage(savedMessage);
            
            // Return saved message for legacy compatibility
            return savedMessage;
        } catch (Exception e) {
            log.error("Error handling user message: {}", e.getMessage(), e);
            // Return original message even if save fails
            return message;
        }
    }

    @MessageMapping("/load-history")
    public void loadChatHistory(ChatMessageDto request, Principal principal) {
        log.info("Loading chat history for user: {}", principal != null ? principal.getName() : "anonymous");
        
        try {
            // Load recent 50 messages
            PageRequest pageRequest = PageRequest.of(0, 50, Sort.by("createdAt").descending());
            Page<ChatMessageDto> recentMessages = chatService.getAllMessages(pageRequest);
            
            // Send history to specific user
            if (principal != null) {
                messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/chat-history",
                    recentMessages.getContent()
                );
            }
            
            log.info("Sent {} messages to user", recentMessages.getContent().size());
        } catch (Exception e) {
            log.error("Error loading chat history: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/typing-indicator")
    public void handleTypingIndicator(TypingIndicatorDto indicator, Principal principal) {
        log.info("Received typing indicator from {}: {} - {}", 
                principal != null ? principal.getName() : "anonymous", 
                indicator.isTyping() ? "started" : "stopped", 
                indicator.getConversationUserId());
        
        try {
            notificationService.sendTypingIndicator(
                    indicator.getConversationUserId(),
                    indicator.getActorId(),
                    indicator.getActorUsername(),
                    indicator.getActorType(),
                    indicator.isTyping()
            );
        } catch (Exception e) {
            log.error("Error handling typing indicator: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/user-status")
    public void handleUserStatus(UserStatusDto status, Principal principal) {
        log.info("Received user status from {}: {} - {}", 
                principal != null ? principal.getName() : "anonymous", 
                status.getStatus(), 
                status.getUserId());
        
        try {
            notificationService.sendUserStatusUpdate(
                    status.getUserId(),
                    status.getStatus(),
                    status.getUsername()
            );
        } catch (Exception e) {
            log.error("Error handling user status: {}", e.getMessage(), e);
        }
    }
}