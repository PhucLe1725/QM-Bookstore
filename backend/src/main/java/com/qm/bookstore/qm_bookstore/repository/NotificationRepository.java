package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    
    // Find notifications by user ID
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
    
    // Find notifications by user ID with pagination
    Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    
    // Find unread notifications by user ID
    List<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, Notification.NotificationStatus status);
    
    // Find unread notifications by user ID with pagination
    Page<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, Notification.NotificationStatus status, Pageable pageable);
    
    // Find notifications by user ID and type
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(UUID userId, Notification.NotificationType type);
    
    // Count unread notifications by user ID
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.status = :status")
    Long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") Notification.NotificationStatus status);
    
    // Mark notification as read
    @Modifying
    @Query("UPDATE Notification n SET n.status = :status, n.updatedAt = :updatedAt WHERE n.id = :id")
    int updateStatusById(@Param("id") UUID id, @Param("status") Notification.NotificationStatus status, @Param("updatedAt") LocalDateTime updatedAt);
    
    // Mark all notifications as read for a user
    @Modifying
    @Query("UPDATE Notification n SET n.status = :status, n.updatedAt = :updatedAt WHERE n.userId = :userId AND n.status = :currentStatus")
    int markAllAsReadByUserId(@Param("userId") UUID userId, @Param("status") Notification.NotificationStatus status, @Param("currentStatus") Notification.NotificationStatus currentStatus, @Param("updatedAt") LocalDateTime updatedAt);
    
    // Delete old notifications (older than specified date)
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    int deleteByCreatedAtBefore(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Find notifications with filters
    @Query("SELECT n FROM Notification n WHERE " +
           "n.userId = :userId AND " +
           "(:type IS NULL OR n.type = :type) AND " +
           "(:status IS NULL OR n.status = :status) AND " +
           "(:fromDate IS NULL OR n.createdAt >= :fromDate) AND " +
           "(:toDate IS NULL OR n.createdAt <= :toDate) " +
           "ORDER BY n.createdAt DESC")
    Page<Notification> findNotificationsWithFilters(
            @Param("userId") UUID userId,
            @Param("type") Notification.NotificationType type,
            @Param("status") Notification.NotificationStatus status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable);
}