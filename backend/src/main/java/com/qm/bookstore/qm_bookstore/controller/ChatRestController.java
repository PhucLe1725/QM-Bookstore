package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.chat.ChatMessageDto;
import com.qm.bookstore.qm_bookstore.dto.chat.BroadcastMessageRequest;
import com.qm.bookstore.qm_bookstore.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatRestController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/history/{userId}")
    public ApiResponse<Page<ChatMessageDto>> getChatHistory(
            @PathVariable UUID userId,
            Pageable pageable) {
        
        Page<ChatMessageDto> history = chatService.getChatHistory(userId, pageable);
        
        return ApiResponse.<Page<ChatMessageDto>>builder()
                .result(history)
                .build();
    }

    @GetMapping("/recent-messages")
    public ApiResponse<List<ChatMessageDto>> getRecentMessages(
            @RequestParam(defaultValue = "50") int limit) {
        
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, limit);
        Page<ChatMessageDto> messages = chatService.getAllMessages(pageable);
        
        return ApiResponse.<List<ChatMessageDto>>builder()
                .result(messages.getContent())
                .build();
    }

    @GetMapping("/admin/messages")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<Page<ChatMessageDto>> getAllMessages(Pageable pageable) {
        
        Page<ChatMessageDto> messages = chatService.getAllMessages(pageable);
        
        return ApiResponse.<Page<ChatMessageDto>>builder()
                .result(messages)
                .build();
    }

    @PostMapping("/admin/broadcast")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<String> broadcastMessage(@RequestBody BroadcastMessageRequest request) {
        
        // Note: You may want to get the actual sender type from JWT token
        ChatMessageDto message = ChatMessageDto.builder()
                .message(request.getMessage())
                .senderType("admin") // Default to admin, you can determine from JWT
                .createdAt(LocalDateTime.now())
                .build();
        
        // Save to database
        chatService.saveMessage(message);
        
        // Broadcast to all users
        messagingTemplate.convertAndSend("/topic/messages", message);
        
        log.info("Admin broadcast message sent: {}", request.getMessage());
        
        return ApiResponse.<String>builder()
                .result("Message broadcasted successfully")
                .build();
    }

    @GetMapping("/conversations")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<List<UUID>> getActiveConversations() {
        
        List<UUID> activeUsers = chatService.getActiveConversations();
        
        return ApiResponse.<List<UUID>>builder()
                .result(activeUsers)
                .build();
    }

    @GetMapping("/admin/latest-conversations/{adminId}")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<List<ChatMessageDto>> getLatestConversationsForAdmin(@PathVariable UUID adminId) {
        
        List<ChatMessageDto> conversations = chatService.getLatestConversationsForAdmin(adminId);
        
        return ApiResponse.<List<ChatMessageDto>>builder()
                .result(conversations)
                .build();
    }

    @GetMapping("/conversation/{user1Id}/{user2Id}")
    public ApiResponse<Page<ChatMessageDto>> getConversationBetweenUsers(
            @PathVariable UUID user1Id,
            @PathVariable UUID user2Id,
            Pageable pageable) {
        
        Page<ChatMessageDto> conversation = chatService.getConversationBetweenUsers(user1Id, user2Id, pageable);
        
        return ApiResponse.<Page<ChatMessageDto>>builder()
                .result(conversation)
                .build();
    }

    @GetMapping("/unread-count/{userId}")
    public ApiResponse<Long> getUnreadAdminMessagesCount(@PathVariable UUID userId) {
        
        Long unreadCount = chatService.countUnreadAdminMessages(userId);
        
        return ApiResponse.<Long>builder()
                .result(unreadCount)
                .build();
    }

    @PostMapping("/message")
    public ApiResponse<ChatMessageDto> saveMessage(@RequestBody ChatMessageDto messageDto) {
        
        ChatMessageDto savedMessage = chatService.saveMessage(messageDto);
        
        return ApiResponse.<ChatMessageDto>builder()
                .result(savedMessage)
                .build();
    }

    @GetMapping("/admin/user-messages")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<Page<ChatMessageDto>> getAllUserMessages(Pageable pageable) {
        
        Page<ChatMessageDto> userMessages = chatService.getAllUserMessages(pageable);
        
        return ApiResponse.<Page<ChatMessageDto>>builder()
                .result(userMessages)
                .build();
    }

    @GetMapping("/admin/messages-from-user/{userId}")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<Page<ChatMessageDto>> getMessagesFromSpecificUser(
            @PathVariable UUID userId,
            Pageable pageable) {
        
        Page<ChatMessageDto> messages = chatService.getMessagesFromUser(userId, pageable);
        
        return ApiResponse.<Page<ChatMessageDto>>builder()
                .result(messages)
                .build();
    }

    @GetMapping("/admin/conversation-with-user/{userId}")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<Page<ChatMessageDto>> getFullConversationWithUser(
            @PathVariable UUID userId,
            Pageable pageable) {
        
        Page<ChatMessageDto> conversation = chatService.getFullConversationWithUser(userId, pageable);
        
        return ApiResponse.<Page<ChatMessageDto>>builder()
                .result(conversation)
                .build();
    }
}