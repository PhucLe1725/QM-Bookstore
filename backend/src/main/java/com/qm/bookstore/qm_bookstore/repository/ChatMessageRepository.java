package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.senderId = :userId OR cm.receiverId = :userId ORDER BY cm.createdAt ASC")
    Page<ChatMessage> findChatHistoryByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT cm FROM ChatMessage cm WHERE " +
           "(cm.senderId = :user1Id AND cm.receiverId = :user2Id) OR " +
           "(cm.senderId = :user2Id AND cm.receiverId = :user1Id) " +
           "ORDER BY cm.createdAt ASC")
    Page<ChatMessage> findConversationBetweenUsers(
            @Param("user1Id") UUID user1Id, 
            @Param("user2Id") UUID user2Id, 
            Pageable pageable);

    @Query("SELECT DISTINCT cm.senderId FROM ChatMessage cm WHERE cm.receiverId IS NULL AND cm.senderType = 'user'")
    List<UUID> findActiveConversations();

    @Query("SELECT cm FROM ChatMessage cm WHERE cm.senderType = 'admin' ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findAdminMessages(Pageable pageable);

    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.receiverId = :userId AND cm.senderType = 'admin'")
    Long countUnreadAdminMessages(@Param("userId") UUID userId);

    // Lấy tin nhắn mới nhất của mỗi cuộc hội thoại
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.id IN (" +
           "SELECT MAX(cm2.id) FROM ChatMessage cm2 " +
           "WHERE (cm2.senderId = :adminId OR cm2.receiverId = :adminId) " +
           "AND cm2.senderType != 'admin' " +
           "GROUP BY CASE WHEN cm2.senderId = :adminId THEN cm2.receiverId ELSE cm2.senderId END" +
           ") ORDER BY cm.createdAt DESC")
    List<ChatMessage> findLatestConversationsForAdmin(@Param("adminId") UUID adminId);

    // Tìm tất cả tin nhắn trong khoảng thời gian
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.createdAt BETWEEN :startDate AND :endDate ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findMessagesByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    // Đếm số tin nhắn chưa đọc giữa 2 users
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.senderId = :senderId AND cm.receiverId = :receiverId")
    Long countUnreadMessagesBetweenUsers(@Param("senderId") UUID senderId, @Param("receiverId") UUID receiverId);

    // Lấy tất cả tin nhắn của user gửi vào hệ thống (không có receiver_id cụ thể)
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.senderType = 'user' AND cm.receiverId IS NULL ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findByMessageTypeUser(Pageable pageable);

    // Lấy tất cả tin nhắn từ một user cụ thể
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.senderId = :userId AND cm.senderType = :senderType ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findMessagesByUserIdAndSenderType(
            @Param("userId") UUID userId, 
            @Param("senderType") ChatMessage.SenderType senderType, 
            Pageable pageable);

    // Lấy toàn bộ cuộc trò chuyện với một user (bao gồm tin nhắn của user và tất cả admin/manager)
    @Query("SELECT cm FROM ChatMessage cm WHERE " +
           "(cm.senderId = :userId AND cm.senderType = 'user' AND cm.receiverId IS NULL) OR " +
           "(cm.receiverId = :userId AND cm.senderType IN ('admin', 'manager')) OR " +
           "(cm.senderId = :userId AND cm.receiverId IS NOT NULL) " +
           "ORDER BY cm.createdAt ASC")
    Page<ChatMessage> findFullConversationWithUser(@Param("userId") UUID userId, Pageable pageable);
}