# Comment Notification Feature - Tính năng thông báo bình luận

## Tổng quan

Document này mô tả các tính năng mới được thêm vào hệ thống comment của sản phẩm, bao gồm API đếm số phản hồi và hệ thống thông báo WebSocket real-time.

**Ngày tạo:** 16/11/2025

---

## 🎯 Các tính năng mới

### 1. API đếm số lượng replies của comment
### 2. Thông báo WebSocket khi comment được reply
### 3. Thông báo WebSocket cho admin/manager về comment từ customer

---

## 📋 Chi tiết triển khai

### 1. API đếm số lượng replies

#### Endpoint mới
```
GET /api/product-comments/{commentId}/replies/count
```

#### Mục đích
- Đếm số lượng replies của một comment cụ thể
- Giúp hiển thị UI kiểu "View 15 replies" mà không cần load toàn bộ data
- Tối ưu performance khi có nhiều replies

#### Request
```http
GET /api/product-comments/5/replies/count
```

#### Response
```json
{
  "success": true,
  "code": 200,
  "message": "Reply count retrieved successfully",
  "result": 15
}
```

#### Code thêm vào

**ProductCommentController.java:**
```java
/**
 * Đếm số lượng replies của một comment
 */
@GetMapping("/{commentId}/replies/count")
public ApiResponse<Long> getReplyCountByCommentId(@PathVariable Long commentId) {
    log.info("Getting reply count for comment: {}", commentId);
    Long count = commentService.getReplyCountByCommentId(commentId);
    return ApiResponse.<Long>builder()
            .success(true)
            .code(HttpStatus.OK.value())
            .message("Reply count retrieved successfully")
            .result(count)
            .build();
}
```

**ProductCommentService.java:**
```java
public Long getReplyCountByCommentId(Long commentId) {
    return commentRepository.countByParentCommentId(commentId);
}
```

**ProductCommentRepository.java** (đã có sẵn):
```java
Long countByParentCommentId(Long parentId);
```

---

### 2. Thông báo WebSocket khi comment được reply

#### WebSocket Topic
```
/user/{userId}/queue/comment-reply
```

#### Khi nào thông báo được gửi?
- Khi có user reply vào comment của user khác
- **KHÔNG** gửi nếu user tự reply vào comment của chính mình
- Chỉ gửi cho chủ của comment gốc (parent comment owner)

#### Message Format
```json
{
  "parentCommentId": 1,
  "replyCommentId": 5,
  "productId": 10,
  "productName": "Spring Boot Guide",
  "message": "john_doe đã phản hồi bình luận của bạn về sản phẩm 'Spring Boot Guide'",
  "commentContent": "Thank you for your feedback!",
  "username": "john_doe",
  "timestamp": "2024-01-01T15:00:00"
}
```

#### Code triển khai

**ProductCommentService.java - Thêm dependencies:**
```java
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
@Slf4j
public class ProductCommentService {

    ProductCommentRepository commentRepository;
    ProductRepository productRepository;
    UserRepository userRepository;              // ← THÊM MỚI
    ProductCommentMapper commentMapper;
    SimpMessagingTemplate messagingTemplate;    // ← THÊM MỚI
```

**ProductCommentService.java - Update createComment() method:**
```java
@Transactional
public ProductCommentResponse createComment(ProductCommentCreateRequest request) {
    // Verify product exists
    Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

    ProductComment comment = commentMapper.toProductComment(request);
    comment.setProduct(product);
    comment.setCreatedAt(LocalDateTime.now());

    // If this is a reply, verify parent comment exists
    if (request.getParentId() != null) {
        ProductComment parentComment = commentRepository.findById(request.getParentId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        comment.setParentComment(parentComment);

        // Save comment first
        comment = commentRepository.save(comment);

        // ← THÊM MỚI: Send notification to parent comment owner
        if (!parentComment.getUserId().equals(request.getUserId())) {
            sendReplyNotificationToCommentOwner(parentComment, comment, product);
        }
    } else {
        // Save comment first
        comment = commentRepository.save(comment);
    }

    // ← THÊM MỚI: Get user who created the comment
    User commentUser = userRepository.findById(request.getUserId())
            .orElse(null);

    // ← THÊM MỚI: If comment is from customer, notify admin and manager
    if (commentUser != null && isCustomer(commentUser)) {
        sendCommentNotificationToAdminAndManager(comment, commentUser, product);
    }

    return commentMapper.toProductCommentResponse(comment);
}
```

**ProductCommentService.java - Method gửi thông báo reply:**
```java
private void sendReplyNotificationToCommentOwner(ProductComment parentComment, ProductComment reply, Product product) {
    try {
        User replyUser = userRepository.findById(reply.getUserId()).orElse(null);
        String replyUserName = replyUser != null ? replyUser.getUsername() : "Someone";

        String message = String.format("%s đã phản hồi bình luận của bạn về sản phẩm '%s'", 
                replyUserName, product.getName());

        // Send WebSocket notification to comment owner
        messagingTemplate.convertAndSendToUser(
                parentComment.getUserId().toString(),
                "/queue/comment-reply",
                new CommentNotificationMessage(
                        parentComment.getId(),
                        reply.getId(),
                        product.getId(),
                        product.getName(),
                        message,
                        reply.getContent(),
                        replyUserName,
                        LocalDateTime.now()
                )
        );
        
        log.info("Sent reply notification to user {} for comment {}", parentComment.getUserId(), parentComment.getId());
    } catch (Exception e) {
        log.error("Failed to send reply notification to comment owner", e);
    }
}
```

#### Frontend Integration - JavaScript

```javascript
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

// Setup WebSocket connection
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);
const userId = localStorage.getItem('user_id');
const token = localStorage.getItem('jwt_token');

stompClient.connect(
  { Authorization: `Bearer ${token}` },
  () => {
    // Subscribe to comment reply notifications
    stompClient.subscribe(`/user/${userId}/queue/comment-reply`, (message) => {
      const notification = JSON.parse(message.body);
      
      // Show toast notification
      showToast({
        type: 'info',
        title: 'Có người đã phản hồi bình luận của bạn',
        message: notification.message,
        action: {
          text: 'Xem',
          onClick: () => {
            window.location.href = `/products/${notification.productId}#comment-${notification.replyCommentId}`;
          }
        }
      });
      
      // Update notification badge
      updateNotificationCount();
    });
  }
);
```

#### Frontend Integration - React Hook

```jsx
import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { toast } from 'react-toastify';

function useCommentReplyNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);

    client.connect(
      { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` },
      () => {
        client.subscribe(`/user/${userId}/queue/comment-reply`, (message) => {
          const notification = JSON.parse(message.body);
          
          // Add to notifications list
          setNotifications(prev => [...prev, notification]);
          
          // Show toast
          toast.info(notification.message, {
            onClick: () => {
              window.location.href = `/products/${notification.productId}`;
            }
          });
        });

        setStompClient(client);
      }
    );

    return () => {
      if (client && client.connected) {
        client.disconnect();
      }
    };
  }, [userId]);

  return { notifications, stompClient };
}

export default useCommentReplyNotifications;
```

---

### 3. Thông báo WebSocket cho admin/manager về comment từ customer

#### WebSocket Topic
```
/user/{userId}/queue/customer-comment
```

#### Khi nào thông báo được gửi?
- Khi customer (user có role KHÔNG phải admin hoặc manager) tạo comment mới
- Khi customer reply vào bất kỳ comment nào
- Gửi đến **TẤT CẢ** user có role `admin` hoặc `manager`

#### Mục đích
- Giúp admin/manager theo dõi feedback từ khách hàng real-time
- Phát hiện và xử lý nhanh các comment cần hỗ trợ
- Quản lý chất lượng dịch vụ khách hàng

#### Message Format
```json
{
  "parentCommentId": null,
  "replyCommentId": 3,
  "productId": 10,
  "productName": "Spring Boot Guide",
  "message": "Khách hàng 'customer123' đã bình luận về sản phẩm 'Spring Boot Guide'",
  "commentContent": "Great product! Highly recommended.",
  "username": "customer123",
  "timestamp": "2024-01-01T15:00:00"
}
```

#### Code triển khai

**ProductCommentService.java - Method gửi thông báo đến admin/manager:**
```java
private void sendCommentNotificationToAdminAndManager(ProductComment comment, User commentUser, Product product) {
    try {
        String message = String.format("Khách hàng '%s' đã bình luận về sản phẩm '%s'", 
                commentUser.getUsername(), product.getName());

        CommentNotificationMessage notification = new CommentNotificationMessage(
                comment.getParentComment() != null ? comment.getParentComment().getId() : null,
                comment.getId(),
                product.getId(),
                product.getName(),
                message,
                comment.getContent(),
                commentUser.getUsername(),
                LocalDateTime.now()
        );

        // Find all admin and manager users
        List<User> adminAndManagers = userRepository.findAll().stream()
                .filter(user -> user.getRole() != null && 
                        (user.getRole().getName().equalsIgnoreCase("admin") || 
                         user.getRole().getName().equalsIgnoreCase("manager")))
                .toList();

        // Send notification to each admin and manager
        for (User adminOrManager : adminAndManagers) {
            messagingTemplate.convertAndSendToUser(
                    adminOrManager.getId().toString(),
                    "/queue/customer-comment",
                    notification
            );
        }

        log.info("Sent customer comment notification to {} admin/manager users", adminAndManagers.size());
    } catch (Exception e) {
        log.error("Failed to send comment notification to admin and manager", e);
    }
}
```

**ProductCommentService.java - Helper method kiểm tra role:**
```java
private boolean isCustomer(User user) {
    if (user.getRole() == null) {
        return true; // Default to customer if no role
    }
    String roleName = user.getRole().getName().toLowerCase();
    return !roleName.equals("admin") && !roleName.equals("manager");
}
```

**ProductCommentService.java - Inner class cho notification message:**
```java
// Inner class for WebSocket notification message
@lombok.Data
@lombok.AllArgsConstructor
@lombok.NoArgsConstructor
public static class CommentNotificationMessage {
    private Long parentCommentId;
    private Long replyCommentId;
    private Long productId;
    private String productName;
    private String message;
    private String commentContent;
    private String username;
    private LocalDateTime timestamp;
}
```

#### Frontend Integration - Admin Dashboard

```javascript
// Admin notification handler
const setupAdminNotifications = (adminUserId) => {
  const socket = new SockJS('http://localhost:8080/ws');
  const stompClient = Stomp.over(socket);

  stompClient.connect(
    { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` },
    () => {
      // Subscribe to customer comment notifications
      stompClient.subscribe(`/user/${adminUserId}/queue/customer-comment`, (message) => {
        const notification = JSON.parse(message.body);
        
        // Show admin notification
        showAdminNotification({
          type: 'warning',
          title: '🛎️ Bình luận mới từ khách hàng',
          message: notification.message,
          details: {
            customer: notification.username,
            product: notification.productName,
            comment: notification.commentContent
          },
          actions: [
            {
              text: 'Xem chi tiết',
              onClick: () => {
                window.location.href = `/admin/comments?productId=${notification.productId}&commentId=${notification.replyCommentId}`;
              }
            },
            {
              text: 'Phản hồi ngay',
              onClick: () => {
                openQuickReplyModal(notification);
              }
            }
          ]
        });
        
        // Update admin notification panel
        addToAdminNotificationList(notification);
        
        // Play notification sound
        playNotificationSound();
      });
    }
  );
};
```

#### Frontend Integration - React Admin Component

```jsx
import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { Badge, Notification } from 'antd';

function AdminCommentNotifications({ adminUserId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);

    client.connect(
      { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` },
      () => {
        client.subscribe(`/user/${adminUserId}/queue/customer-comment`, (message) => {
          const notification = JSON.parse(message.body);
          
          // Add to notifications list
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show Ant Design notification
          Notification.warning({
            message: 'Bình luận mới từ khách hàng',
            description: notification.message,
            duration: 5,
            onClick: () => {
              window.location.href = `/admin/products/${notification.productId}/comments`;
            }
          });
        });
      }
    );

    return () => {
      if (client && client.connected) {
        client.disconnect();
      }
    };
  }, [adminUserId]);

  return (
    <div className="admin-notifications">
      <Badge count={unreadCount}>
        <BellIcon />
      </Badge>
      
      <NotificationList notifications={notifications} />
    </div>
  );
}

export default AdminCommentNotifications;
```

---

## 🔧 Cấu hình WebSocket

### WebSocketConfig.java (đã có sẵn)

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:5173", "http://localhost:3000")
                .withSockJS();
    }
}
```

### Dependencies cần thiết (pom.xml)

```xml
<!-- WebSocket -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>

<!-- SockJS và STOMP (frontend) -->
<!-- npm install sockjs-client @stomp/stompjs -->
```

---

## 📊 Luồng hoạt động (Flow Diagram)

### Flow 1: Reply Notification

```
User A tạo comment #1 (parent)
    ↓
User B reply vào comment #1 (tạo comment #2)
    ↓
Backend: ProductCommentService.createComment()
    ↓
Check: User B ≠ User A? → YES
    ↓
sendReplyNotificationToCommentOwner()
    ↓
messagingTemplate.convertAndSendToUser(User A, "/queue/comment-reply", notification)
    ↓
User A nhận thông báo real-time qua WebSocket
    ↓
Frontend hiển thị toast notification cho User A
```

### Flow 2: Customer Comment Notification to Admin

```
Customer tạo comment về sản phẩm
    ↓
Backend: ProductCommentService.createComment()
    ↓
Check: User có role = "customer"? → YES
    ↓
sendCommentNotificationToAdminAndManager()
    ↓
Query: Tìm tất cả users có role = "admin" hoặc "manager"
    ↓
Loop: Gửi notification đến từng admin/manager
    ↓
messagingTemplate.convertAndSendToUser(Admin, "/queue/customer-comment", notification)
    ↓
Tất cả admin/manager nhận thông báo real-time
    ↓
Admin dashboard hiển thị alert mới
```

---

## 🧪 Testing

### Test API đếm replies

```bash
# Get reply count for comment ID 5
curl -X GET http://localhost:8080/api/product-comments/5/replies/count \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response:
# {"success":true,"code":200,"message":"Reply count retrieved successfully","result":15}
```

### Test WebSocket Notification

#### Test Tool: Postman hoặc WebSocket Client

1. **Connect to WebSocket:**
   - URL: `ws://localhost:8080/ws`
   - Protocol: SockJS

2. **Subscribe to topics:**
   ```javascript
   // For comment reply notification
   SUBSCRIBE
   destination:/user/{userId}/queue/comment-reply
   
   // For admin customer comment notification
   SUBSCRIBE
   destination:/user/{adminUserId}/queue/customer-comment
   ```

3. **Trigger notification:**
   - Create a reply comment via API
   - Check if notification is received

#### Manual Testing Steps

**Test Reply Notification:**
1. User A tạo comment gốc (lưu lại commentId)
2. User B connect WebSocket và subscribe `/user/{userAId}/queue/comment-reply`
3. User C reply vào comment của User A
4. Verify: User A nhận được notification
5. Verify: Notification message đúng format

**Test Customer Comment Notification:**
1. Admin connect WebSocket và subscribe `/user/{adminId}/queue/customer-comment`
2. Customer tạo comment mới về sản phẩm
3. Verify: Admin nhận được notification
4. Verify: Message chứa đầy đủ thông tin (username, product, content)

---

## 📝 Database Schema (không thay đổi)

```sql
-- ProductComment table (đã có sẵn)
CREATE TABLE product_comments (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id BIGINT REFERENCES product_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for better performance
CREATE INDEX idx_product_comments_parent_id ON product_comments(parent_id);
CREATE INDEX idx_product_comments_user_id ON product_comments(user_id);
CREATE INDEX idx_product_comments_product_id ON product_comments(product_id);
```

---

## 🚀 Deployment Checklist

- [x] Thêm API endpoint đếm replies
- [x] Thêm WebSocket notification logic
- [x] Update ProductCommentService với notification methods
- [x] Test API endpoint mới
- [x] Test WebSocket connectivity
- [x] Test notification delivery
- [x] Update API documentation
- [x] Frontend integration examples
- [ ] Load testing với nhiều concurrent users
- [ ] Monitor WebSocket connection pool
- [ ] Setup notification logging/monitoring

---

## 🎓 Best Practices

### 1. Performance Optimization

```java
// Cache admin/manager list để tránh query database mỗi lần
@Cacheable("adminManagerUsers")
public List<User> getAdminAndManagerUsers() {
    return userRepository.findAll().stream()
        .filter(user -> user.getRole() != null && 
                (user.getRole().getName().equalsIgnoreCase("admin") || 
                 user.getRole().getName().equalsIgnoreCase("manager")))
        .toList();
}
```

### 2. Error Handling

```java
// Always wrap WebSocket sending in try-catch
try {
    messagingTemplate.convertAndSendToUser(...);
} catch (Exception e) {
    // Log error but don't throw - notification failure shouldn't break comment creation
    log.error("Failed to send notification", e);
}
```

### 3. Frontend Reconnection

```javascript
// Auto-reconnect on disconnect
const connectWithRetry = () => {
  let reconnectDelay = 1000;
  
  const connect = () => {
    stompClient.connect(headers, onSuccess, (error) => {
      console.error('Connection failed, retrying...', error);
      setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
        connect();
      }, reconnectDelay);
    });
  };
  
  connect();
};
```

### 4. Notification Deduplication

```javascript
// Prevent duplicate notifications
const seenNotifications = new Set();

const handleNotification = (notification) => {
  const notificationId = `${notification.replyCommentId}-${notification.timestamp}`;
  
  if (seenNotifications.has(notificationId)) {
    return; // Skip duplicate
  }
  
  seenNotifications.add(notificationId);
  showToast(notification);
};
```

---

## 📚 Tài liệu tham khảo

1. **Spring WebSocket Documentation:** https://docs.spring.io/spring-framework/reference/web/websocket.html
2. **SockJS Client:** https://github.com/sockjs/sockjs-client
3. **STOMP.js:** https://stomp-js.github.io/stomp-websocket/codo/extra/docs-src/Usage.md.html
4. **API Documentation:** `PRODUCT_COMMENT_API_DOCUMENTATION.md`

---

## 👥 Contact

- **Developer:** GitHub Copilot
- **Date:** 16/11/2025
- **Project:** QM Bookstore Backend
- **Version:** 1.0.0

---

## 📄 License

Internal project documentation - QM Bookstore Team
