package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.chat.ChatMessageDto;
import com.qm.bookstore.qm_bookstore.dto.chat.BroadcastMessageRequest;
import com.qm.bookstore.qm_bookstore.dto.chat.request.MarkMessagesReadRequest;
import com.qm.bookstore.qm_bookstore.dto.chat.response.ReadStatusResponse;
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

    // ===== READ STATUS ENDPOINTS =====

    /**
     * Admin đánh dấu tin nhắn từ user cụ thể đã đọc
     */
    @PutMapping("/admin/mark-read/user/{userId}")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<ReadStatusResponse> markAsReadByAdminForUser(@PathVariable UUID userId) {
        log.info("Admin marking messages as read for user: {}", userId);
        
        int markedCount = chatService.markAsReadByAdminForUser(userId);
        
        ReadStatusResponse response = ReadStatusResponse.builder()
                .success(true)
                .markedCount(markedCount)
                .message("Đã đánh dấu " + markedCount + " tin nhắn là đã đọc")
                .build();
        
        return ApiResponse.<ReadStatusResponse>builder()
                .result(response)
                .build();
    }

    /**
     * User đánh dấu tin nhắn từ admin đã đọc
     */
    @PutMapping("/user/{userId}/mark-read-from-admin")
    public ApiResponse<ReadStatusResponse> markAsReadByUserFromAdmin(@PathVariable UUID userId) {
        log.info("User {} marking admin messages as read", userId);
        
        int markedCount = chatService.markAsReadByUserFromAdmin(userId);
        
        ReadStatusResponse response = ReadStatusResponse.builder()
                .success(true)
                .markedCount(markedCount)
                .message("Đã đánh dấu " + markedCount + " tin nhắn là đã đọc")
                .build();
        
        return ApiResponse.<ReadStatusResponse>builder()
                .result(response)
                .build();
    }

    /**
     * Đánh dấu một tin nhắn cụ thể đã đọc bởi admin
     */
    @PutMapping("/admin/mark-read/message/{messageId}")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<ReadStatusResponse> markMessageAsReadByAdmin(@PathVariable Long messageId) {
        log.info("Admin marking message {} as read", messageId);
        
        int markedCount = chatService.markMessageAsReadByAdmin(messageId);
        
        ReadStatusResponse response = ReadStatusResponse.builder()
                .success(markedCount > 0)
                .markedCount(markedCount)
                .message(markedCount > 0 ? "Đã đánh dấu tin nhắn là đã đọc" : "Không tìm thấy tin nhắn")
                .build();
        
        return ApiResponse.<ReadStatusResponse>builder()
                .result(response)
                .build();
    }

    /**
     * Đánh dấu một tin nhắn cụ thể đã đọc bởi user
     */
    @PutMapping("/user/mark-read/message/{messageId}")
    public ApiResponse<ReadStatusResponse> markMessageAsReadByUser(@PathVariable Long messageId) {
        log.info("User marking message {} as read", messageId);
        
        int markedCount = chatService.markMessageAsReadByUser(messageId);
        
        ReadStatusResponse response = ReadStatusResponse.builder()
                .success(markedCount > 0)
                .markedCount(markedCount)
                .message(markedCount > 0 ? "Đã đánh dấu tin nhắn là đã đọc" : "Không tìm thấy tin nhắn")
                .build();
        
        return ApiResponse.<ReadStatusResponse>builder()
                .result(response)
                .build();
    }

    /**
     * Lấy số tin nhắn chưa đọc bởi admin từ user cụ thể
     */
    @GetMapping("/admin/unread-count/user/{userId}")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<Long> getUnreadCountByAdminFromUser(@PathVariable UUID userId) {
        Long count = chatService.getUnreadCountByAdminFromUser(userId);
        
        return ApiResponse.<Long>builder()
                .result(count)
                .build();
    }

    /**
     * Lấy số tin nhắn chưa đọc bởi user từ admin
     */
    @GetMapping("/user/{userId}/unread-count-from-admin")
    public ApiResponse<Long> getUnreadCountByUserFromAdmin(@PathVariable UUID userId) {
        Long count = chatService.getUnreadCountByUserFromAdmin(userId);
        
        return ApiResponse.<Long>builder()
                .result(count)
                .build();
    }

    /**
     * Lấy tổng số tin nhắn chưa đọc bởi admin
     */
    @GetMapping("/admin/total-unread-count")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<Long> getTotalUnreadByAdmin() {
        Long count = chatService.getTotalUnreadByAdmin();
        
        return ApiResponse.<Long>builder()
                .result(count)
                .build();
    }

    /**
     * Lấy danh sách users có tin nhắn chưa đọc
     */
    @GetMapping("/admin/users-with-unread")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<List<UUID>> getUsersWithUnreadMessages() {
        List<UUID> userIds = chatService.getUsersWithUnreadMessages();
        
        return ApiResponse.<List<UUID>>builder()
                .result(userIds)
                .build();
    }

    /**
     * Lấy tất cả tin nhắn chưa đọc bởi admin với phân trang
     */
    @GetMapping("/admin/unread-messages")
    @PreAuthorize("hasRole('admin') or hasRole('manager')")
    public ApiResponse<Page<ChatMessageDto>> getUnreadMessagesByAdmin(Pageable pageable) {
        Page<ChatMessageDto> unreadMessages = chatService.getUnreadMessagesByAdmin(pageable);
        
        return ApiResponse.<Page<ChatMessageDto>>builder()
                .result(unreadMessages)
                .build();
    }

    /**
     * Lấy tin nhắn chưa đọc bởi user cụ thể
     */
    @GetMapping("/user/{userId}/unread-messages")
    public ApiResponse<List<ChatMessageDto>> getUnreadMessagesByUser(@PathVariable UUID userId) {
        List<ChatMessageDto> unreadMessages = chatService.getUnreadMessagesByUser(userId);
        
        return ApiResponse.<List<ChatMessageDto>>builder()
                .result(unreadMessages)
                .build();
    }

    /**
     * Endpoint tổng hợp để đánh dấu multiple messages đã đọc
     */
    @PutMapping("/mark-read")
    public ApiResponse<ReadStatusResponse> markMessagesRead(@RequestBody MarkMessagesReadRequest request) {
        log.info("Processing mark messages read request: {}", request);
        
        int totalMarked = 0;
        
        // Nếu yêu cầu đánh dấu tất cả tin nhắn từ user
        if (Boolean.TRUE.equals(request.getMarkAllFromUser()) && request.getUserId() != null) {
            totalMarked = chatService.markAsReadByAdminForUser(request.getUserId());
        }
        // Nếu có danh sách message IDs cụ thể
        else if (request.getMessageIds() != null && !request.getMessageIds().isEmpty()) {
            for (Long messageId : request.getMessageIds()) {
                totalMarked += chatService.markMessageAsReadByAdmin(messageId);
            }
        }
        
        ReadStatusResponse response = ReadStatusResponse.builder()
                .success(totalMarked > 0)
                .markedCount(totalMarked)
                .message("Đã đánh dấu " + totalMarked + " tin nhắn là đã đọc")
                .build();
        
        return ApiResponse.<ReadStatusResponse>builder()
                .result(response)
                .build();
    }
}