# Comment Notification System - Hệ thống thông báo bình luận

## Tổng quan

Document này mô tả chi tiết hệ thống thông báo cho bình luận sản phẩm, bao gồm cả WebSocket real-time và lưu trữ notification vào database để user có thể xem lại lịch sử thông báo.

**Ngày cập nhật:** 17/11/2025  
**Version:** 2.0 (Đã tích hợp Database Notification)

---

## 🎯 Tính năng

### 1. Thông báo khi comment được reply
- ✅ Gửi WebSocket real-time đến chủ comment
- ✅ Lưu notification vào database
- ✅ User có thể xem lại lịch sử notification

### 2. Thông báo cho admin/manager về comment từ customer
- ✅ Gửi WebSocket real-time đến tất cả admin/manager
- ✅ Lưu notification vào database cho từng admin/manager
- ✅ Admin có thể xem lại tất cả comment từ customer

---

## 📊 Database Schema

### Notification Types Mới

Đã thêm 2 notification types mới vào `NotificationType` enum:

```java
public enum NotificationType {
    NEW_MESSAGE("NEW_MESSAGE"),
    ORDER_UPDATE("ORDER_UPDATE"),
    PAYMENT_UPDATE("PAYMENT_UPDATE"),
    SYSTEM_NOTIFICATION("SYSTEM_NOTIFICATION"),
    PROMOTION("PROMOTION"),
    COMMENT_REPLY("COMMENT_REPLY"),              // ← MỚI: Khi comment được reply
    NEW_CUSTOMER_COMMENT("NEW_CUSTOMER_COMMENT");  // ← MỚI: Comment từ customer (cho admin)
}
```

### Notification Table Structure

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,  -- NULL cho global notifications
    type VARCHAR(50) NOT NULL,  -- Bao gồm COMMENT_REPLY và NEW_CUSTOMER_COMMENT
    message TEXT NOT NULL,
    anchor TEXT,  -- Link đến comment (e.g., "/products/10#comment-5")
    status SMALLINT DEFAULT 1,  -- 1=UNREAD, 2=READ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

## 💻 Implementation Details

### 1. Entity Changes

**File:** `Notification.java`

```java
public enum NotificationType {
    NEW_MESSAGE("NEW_MESSAGE"),
    ORDER_UPDATE("ORDER_UPDATE"),
    PAYMENT_UPDATE("PAYMENT_UPDATE"),
    SYSTEM_NOTIFICATION("SYSTEM_NOTIFICATION"),
    PROMOTION("PROMOTION"),
    COMMENT_REPLY("COMMENT_REPLY"),           // Khi comment được reply
    NEW_CUSTOMER_COMMENT("NEW_CUSTOMER_COMMENT");  // Khi có comment từ customer
}
```

### 2. Service Integration

**File:** `ProductCommentService.java`

#### Đã thêm dependency:
```java
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
@Slf4j
public class ProductCommentService {
    // ... existing dependencies
    NotificationService notificationService;  // ← THÊM MỚI
}
```

#### Method: sendReplyNotificationToCommentOwner()

```java
private void sendReplyNotificationToCommentOwner(ProductComment parentComment, ProductComment reply, Product product) {
    try {
        User replyUser = userRepository.findById(reply.getUserId()).orElse(null);
        String replyUserName = replyUser != null ? replyUser.getUsername() : "Someone";

        String message = String.format("%s đã phản hồi bình luận của bạn về sản phẩm '%s'", 
                replyUserName, product.getName());
        
        String anchor = String.format("/products/%d#comment-%d", product.getId(), reply.getId());

        // 1. Save notification to database ← MỚI
        NotificationCreateRequest notificationRequest = new NotificationCreateRequest();
        notificationRequest.setUserId(parentComment.getUserId());
        notificationRequest.setType(Notification.NotificationType.COMMENT_REPLY);
        notificationRequest.setMessage(message);
        notificationRequest.setAnchor(anchor);
        notificationService.createNotification(notificationRequest);

        // 2. Send WebSocket notification (existing)
        messagingTemplate.convertAndSendToUser(
                parentComment.getUserId().toString(),
                "/queue/comment-reply",
                new CommentNotificationMessage(...)
        );
        
        log.info("Sent reply notification to user {} for comment {}", 
                parentComment.getUserId(), parentComment.getId());
    } catch (Exception e) {
        log.error("Failed to send reply notification to comment owner", e);
    }
}
```

#### Method: sendCommentNotificationToAdminAndManager()

```java
private void sendCommentNotificationToAdminAndManager(ProductComment comment, User commentUser, Product product) {
    try {
        String message = String.format("Khách hàng '%s' đã bình luận về sản phẩm '%s'", 
                commentUser.getUsername(), product.getName());
        
        String anchor = String.format("/admin/comments?productId=%d&commentId=%d", 
                product.getId(), comment.getId());

        // Find all admin and manager users
        List<User> adminAndManagers = userRepository.findAll().stream()
                .filter(user -> user.getRole() != null && 
                        (user.getRole().getName().equalsIgnoreCase("admin") || 
                         user.getRole().getName().equalsIgnoreCase("manager")))
                .toList();

        // Send notification to each admin and manager
        for (User adminOrManager : adminAndManagers) {
            // 1. Save notification to database ← MỚI
            NotificationCreateRequest notificationRequest = new NotificationCreateRequest();
            notificationRequest.setUserId(adminOrManager.getId());
            notificationRequest.setType(Notification.NotificationType.NEW_CUSTOMER_COMMENT);
            notificationRequest.setMessage(message);
            notificationRequest.setAnchor(anchor);
            notificationService.createNotification(notificationRequest);
            
            // 2. Send WebSocket notification (existing)
            messagingTemplate.convertAndSendToUser(
                    adminOrManager.getId().toString(),
                    "/queue/customer-comment",
                    wsNotification
            );
        }

        log.info("Sent customer comment notification to {} admin/manager users", 
                adminAndManagers.size());
    } catch (Exception e) {
        log.error("Failed to send comment notification to admin and manager", e);
    }
}
```

---

## 🔄 Notification Flow

### Flow 1: Comment Reply Notification

```
User A tạo comment #1
    ↓
User B reply vào comment #1
    ↓
ProductCommentService.createComment()
    ↓
Check: User B ≠ User A?
    ↓ YES
sendReplyNotificationToCommentOwner()
    ↓
┌─────────────────────────────────────┐
│ 1. Lưu vào Database                 │
│    - Type: COMMENT_REPLY             │
│    - UserId: User A                  │
│    - Message: "X replied to your comment" │
│    - Anchor: "/products/10#comment-5"│
│    - Status: UNREAD                  │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. Gửi WebSocket Real-time         │
│    - Topic: /user/{userA}/queue/comment-reply │
│    - Payload: CommentNotificationMessage │
└─────────────────────────────────────┘
    ↓
User A nhận notification:
- Real-time toast (nếu online)
- Có thể xem lại trong notification list
```

### Flow 2: Customer Comment Notification (Admin/Manager)

```
Customer tạo comment
    ↓
ProductCommentService.createComment()
    ↓
Check: User role = customer?
    ↓ YES
sendCommentNotificationToAdminAndManager()
    ↓
Query: Tìm tất cả admin/manager users
    ↓
FOR EACH admin/manager:
    ┌─────────────────────────────────────┐
    │ 1. Lưu vào Database                 │
    │    - Type: NEW_CUSTOMER_COMMENT      │
    │    - UserId: Admin ID                │
    │    - Message: "Customer X commented"│
    │    - Anchor: "/admin/comments?..."  │
    │    - Status: UNREAD                  │
    └─────────────────────────────────────┘
        ↓
    ┌─────────────────────────────────────┐
    │ 2. Gửi WebSocket Real-time         │
    │    - Topic: /user/{adminId}/queue/customer-comment │
    │    - Payload: CommentNotificationMessage │
    └─────────────────────────────────────┘
    ↓
Tất cả admin/manager nhận notification:
- Real-time alert (nếu online)
- Lưu trong database để xem lại sau
```

---

## 📡 API Endpoints

### 1. Get User Notifications

**GET** `/api/notifications/user/{userId}`

Lấy tất cả notifications của một user, bao gồm cả comment notifications.

**Query Parameters:**
- `skipCount` (int, default: 0)
- `maxResultCount` (int, default: 10)
- `type` (string, optional): Filter by type (e.g., "COMMENT_REPLY")
- `status` (int, optional): 1=UNREAD, 2=READ
- `sortBy` (string, default: "createdAt")
- `sortDirection` (string, default: "desc")

**Response:**
```json
{
  "success": true,
  "code": 1000,
  "message": "Success",
  "result": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "123e4567-e89b-12d3-a456-426614174000",
        "type": "COMMENT_REPLY",
        "message": "john_doe đã phản hồi bình luận của bạn về sản phẩm 'Spring Boot Guide'",
        "anchor": "/products/10#comment-5",
        "status": 1,
        "createdAt": "2024-11-17T10:30:00",
        "updatedAt": "2024-11-17T10:30:00"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "userId": "123e4567-e89b-12d3-a456-426614174000",
        "type": "NEW_CUSTOMER_COMMENT",
        "message": "Khách hàng 'customer123' đã bình luận về sản phẩm 'Java Programming'",
        "anchor": "/admin/comments?productId=15&commentId=20",
        "status": 1,
        "createdAt": "2024-11-17T09:15:00",
        "updatedAt": "2024-11-17T09:15:00"
      }
    ],
    "totalRecords": 25
  }
}
```

### 2. Get Unread Notification Count

**GET** `/api/notifications/unread-count`

Đếm số notification chưa đọc của user hiện tại.

**Response:**
```json
{
  "success": true,
  "code": 1000,
  "message": "Success",
  "result": 5
}
```

### 3. Mark Notification as Read

**PUT** `/api/notifications/{id}/mark-read`

Đánh dấu notification đã đọc.

**Response:**
```json
{
  "success": true,
  "code": 1000,
  "message": "Notification marked as read",
  "result": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": 2,
    "updatedAt": "2024-11-17T11:00:00"
  }
}
```

### 4. Mark All Notifications as Read

**PUT** `/api/notifications/mark-all-read`

Đánh dấu tất cả notifications của user đã đọc.

**Response:**
```json
{
  "success": true,
  "code": 1000,
  "message": "All notifications marked as read",
  "result": 5
}
```

### 5. Delete Notification

**DELETE** `/api/notifications/{id}`

Xóa một notification.

---

## 🎨 Frontend Integration

### 1. Notification List Component (React)

```jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

function NotificationList({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await axios.get(
        `http://localhost:8080/api/notifications/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            skipCount: 0,
            maxResultCount: 20,
            sortBy: 'createdAt',
            sortDirection: 'desc'
          }
        }
      );

      if (response.data.success) {
        setNotifications(response.data.result.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await axios.get(
        'http://localhost:8080/api/notifications/unread-count',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setUnreadCount(response.data.result);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('jwt_token');
      await axios.put(
        `http://localhost:8080/api/notifications/${notificationId}/mark-read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, status: 2 } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read first
    if (notification.status === 1) {
      await markAsRead(notification.id);
    }

    // Navigate to the comment
    if (notification.anchor) {
      window.location.href = notification.anchor;
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className="notification-list">
      <div className="notification-header">
        <h3>Thông báo</h3>
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <div className="notification-items">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${notification.status === 1 ? 'unread' : 'read'}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                {notification.type === 'COMMENT_REPLY' && '💬'}
                {notification.type === 'NEW_CUSTOMER_COMMENT' && '📝'}
                {notification.type === 'ORDER_UPDATE' && '📦'}
                {notification.type === 'NEW_MESSAGE' && '✉️'}
              </div>

              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: vi
                  })}
                </span>
              </div>

              {notification.status === 1 && (
                <div className="unread-indicator" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationList;
```

### 2. Notification Bell Icon with Badge

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await axios.get(
        'http://localhost:8080/api/notifications/unread-count',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setUnreadCount(response.data.result);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="notification-bell">
      <button
        className="bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <NotificationList />
        </div>
      )}
    </div>
  );
}
```

### 3. Combined WebSocket + Database Notifications

```jsx
import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { toast } from 'react-toastify';

function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Setup WebSocket for real-time notifications
  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);

    client.connect(
      { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` },
      () => {
        // Subscribe to comment reply notifications
        client.subscribe(`/user/${userId}/queue/comment-reply`, (message) => {
          const notification = JSON.parse(message.body);
          
          // Show real-time toast
          toast.info(notification.message, {
            onClick: () => {
              window.location.href = `/products/${notification.productId}#comment-${notification.replyCommentId}`;
            }
          });

          // Increment unread count
          setUnreadCount(prev => prev + 1);
          
          // Optionally refresh notification list
          fetchNotifications();
        });

        // Subscribe to customer comment notifications (admin only)
        client.subscribe(`/user/${userId}/queue/customer-comment`, (message) => {
          const notification = JSON.parse(message.body);
          
          toast.warning(`🛎️ ${notification.message}`, {
            onClick: () => {
              window.location.href = `/admin/comments?productId=${notification.productId}`;
            }
          });

          setUnreadCount(prev => prev + 1);
          fetchNotifications();
        });
      }
    );

    return () => {
      if (client && client.connected) {
        client.disconnect();
      }
    };
  }, [userId]);

  // Fetch notifications from database
  const fetchNotifications = async () => {
    // ... API call to get notifications
  };

  return { notifications, unreadCount, fetchNotifications };
}
```

---

## 🎭 CSS Styling

```css
.notification-list {
  width: 400px;
  max-height: 600px;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.notification-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.notification-header .badge {
  background: #ef4444;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item.unread {
  background: #eff6ff;
}

.notification-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-message {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #111827;
  line-height: 1.5;
}

.notification-time {
  font-size: 12px;
  color: #6b7280;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 50%;
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.notification-bell {
  position: relative;
}

.bell-button {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  font-size: 24px;
}

.bell-button .badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ef4444;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}
```

---

## 🔒 Security Considerations

### 1. Authorization Check

Đảm bảo user chỉ có thể:
- Xem notifications của chính họ
- Không thể xem notifications của người khác

```java
// In NotificationService
public NotificationResponse getNotificationById(UUID notificationId) {
    Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));
    
    // Check authorization
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String currentUsername = auth.getName();
    User currentUser = userRepository.findByUsername(currentUsername)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    
    if (!notification.getUserId().equals(currentUser.getId()) && !isAdmin(currentUser)) {
        throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    
    return notificationMapper.toNotificationResponse(notification);
}
```

### 2. Rate Limiting

Để tránh spam notifications:

```java
// Cache để track số lượng notifications trong khoảng thời gian
private final Map<String, AtomicInteger> notificationCounts = new ConcurrentHashMap<>();

private boolean canSendNotification(UUID userId, String type) {
    String key = userId + ":" + type;
    AtomicInteger count = notificationCounts.computeIfAbsent(key, k -> new AtomicInteger(0));
    
    // Max 10 notifications per type per minute
    if (count.get() >= 10) {
        return false;
    }
    
    count.incrementAndGet();
    
    // Reset after 1 minute
    CompletableFuture.delayedExecutor(1, TimeUnit.MINUTES)
        .execute(() -> notificationCounts.remove(key));
    
    return true;
}
```

---

## 📊 Performance Optimization

### 1. Database Indexes

```sql
CREATE INDEX idx_notifications_user_type_status 
ON notifications(user_id, type, status);

CREATE INDEX idx_notifications_created_at_desc 
ON notifications(created_at DESC);
```

### 2. Pagination

Luôn sử dụng pagination khi fetch notifications:

```javascript
const fetchNotifications = async (page = 0, size = 20) => {
  const response = await axios.get(`/api/notifications/user/${userId}`, {
    params: {
      skipCount: page * size,
      maxResultCount: size
    }
  });
  return response.data;
};
```

### 3. Caching Admin List

```java
@Cacheable("adminManagerUsers")
public List<User> getAdminAndManagerUsers() {
    return userRepository.findAll().stream()
        .filter(user -> user.getRole() != null && 
                (user.getRole().getName().equalsIgnoreCase("admin") || 
                 user.getRole().getName().equalsIgnoreCase("manager")))
        .toList();
}
```

---

## 🧪 Testing

### Test Notification Creation

```bash
# 1. Create a comment (should trigger notification)
curl -X POST http://localhost:8080/api/product-comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_B_TOKEN" \
  -d '{
    "productId": 10,
    "userId": "user-b-id",
    "content": "This is a reply!",
    "parentId": 1
  }'

# 2. Check if notification was created
curl -X GET http://localhost:8080/api/notifications/user/user-a-id \
  -H "Authorization: Bearer USER_A_TOKEN"

# 3. Check unread count
curl -X GET http://localhost:8080/api/notifications/unread-count \
  -H "Authorization: Bearer USER_A_TOKEN"
```

---

## 📈 Monitoring

### Metrics to Track

1. **Notification Delivery Rate**
   - Số notifications được tạo vs số được gửi thành công

2. **WebSocket Connection Status**
   - Số user đang online và connected

3. **Notification Read Rate**
   - % notifications được đọc trong 24h

4. **Database Growth**
   - Số lượng notifications trong DB
   - Cần cleanup notifications cũ (> 30 days)

### Cleanup Old Notifications

```java
@Scheduled(cron = "0 0 2 * * ?") // Run at 2 AM daily
public void cleanupOldNotifications() {
    LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
    int deleted = notificationRepository.deleteOldReadNotifications(thirtyDaysAgo);
    log.info("Cleaned up {} old notifications", deleted);
}
```

```java
// In NotificationRepository
@Modifying
@Query("DELETE FROM Notification n WHERE n.status = 2 AND n.createdAt < :date")
int deleteOldReadNotifications(@Param("date") LocalDateTime date);
```

---

## 🚀 Deployment Checklist

- [x] Thêm COMMENT_REPLY và NEW_CUSTOMER_COMMENT vào NotificationType enum
- [x] Tích hợp NotificationService vào ProductCommentService
- [x] Lưu notification vào database khi có comment reply
- [x] Lưu notification vào database cho admin/manager khi có customer comment
- [x] WebSocket real-time notifications
- [x] Notification API endpoints
- [ ] Frontend notification list component
- [ ] Frontend notification bell with badge
- [ ] Notification cleanup job
- [ ] Performance monitoring
- [ ] Load testing với nhiều notifications

---

## 📚 Related Documentation

- `PRODUCT_COMMENT_API_DOCUMENTATION.md` - Comment API documentation
- `COMMENT_NOTIFICATION_FEATURE.md` - WebSocket notifications (v1.0)
- `GLOBAL_NOTIFICATION_SYSTEM.md` - General notification system

---

## 👥 Version History

### Version 2.0 (Current - 17/11/2025)
- ✅ Added database persistence for comment notifications
- ✅ Added COMMENT_REPLY and NEW_CUSTOMER_COMMENT types
- ✅ Integrated NotificationService with ProductCommentService
- ✅ Notifications now saved to DB + sent via WebSocket
- ✅ Users can view notification history
- ✅ Added anchor links to navigate to comments

### Version 1.0 (16/11/2025)
- ✅ WebSocket-only notifications
- ✅ Real-time comment reply alerts
- ✅ Admin/manager customer comment alerts

---

## 📄 License

Internal Documentation - QM Bookstore Project
