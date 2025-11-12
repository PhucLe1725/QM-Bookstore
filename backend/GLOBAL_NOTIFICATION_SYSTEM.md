# Global Notification System - API Guide

Hệ thống thông báo toàn cục cho QM Bookstore với user_id nullable để xử lý thông báo cho admin/manager.

## Concept Overview

### Global Notification Logic
- **user_id IS NULL + type = NEW_MESSAGE**: Thông báo toàn cục cho tất cả admin/manager
- **user_id NOT NULL**: Thông báo cá nhân cho user cụ thể
- **Khi admin đọc**: Nếu là global notification → đánh dấu tất cả global NEW_MESSAGE là đã đọc

## Base URL
```
http://localhost:8080/api/notifications
```

## Database Schema Changes

### Notifications Table Update
```sql
-- Update user_id to be nullable
ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;

-- Global notification example:
-- user_id = NULL, type = 'NEW_MESSAGE' → notification cho tất cả admin/manager
-- user_id = 'uuid', type = 'NEW_MESSAGE' → notification cá nhân
```

## API Endpoints

### 1. Lấy notifications cho admin/manager (bao gồm global)

**GET** `/api/notifications`

**Query Parameters:**
- `userId` (UUID, required for admin) - ID của admin/manager
- `skipCount` (number, default: 0) 
- `maxResultCount` (number, default: 10)
- `type` (string, optional) - NEW_MESSAGE, ORDER_UPDATE, etc.
- `status` (string, optional) - UNREAD, read

**Behavior:**
- Trả về notifications có `user_id = userId` (cá nhân)
- **PLUS** notifications có `user_id IS NULL AND type = NEW_MESSAGE` (toàn cục)

**Example Request:**
```javascript
fetch('/api/notifications?userId=admin-uuid&maxResultCount=20', {
  headers: {
    'Authorization': 'Bearer ' + adminToken
  }
})
```

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "result": {
    "data": [
      {
        "id": "global-notification-uuid",
        "userId": null,
        "username": null,
        "type": "NEW_MESSAGE", 
        "message": "New message from john_doe: Hello, I need help!",
        "anchor": "/chat/customer-uuid",
        "status": "UNREAD",
        "createdAt": "2025-11-10T14:30:00Z",
        "updatedAt": "2025-11-10T14:30:00Z"
      },
      {
        "id": "personal-notification-uuid",
        "userId": "admin-uuid",
        "username": "admin_user",
        "type": "SYSTEM_NOTIFICATION",
        "message": "System maintenance scheduled",
        "anchor": "/maintenance",
        "status": "read",
        "createdAt": "2025-11-10T14:20:00Z",
        "updatedAt": "2025-11-10T14:25:00Z"
      }
    ],
    "totalRecords": 2
  }
}
```

### 2. Đánh dấu notification đã đọc (Smart Logic)

**PUT** `/api/notifications/{id}/mark-read`

**Behavior:**
- Nếu notification có `user_id IS NULL AND type = NEW_MESSAGE`:
  - **Đánh dấu TẤT CẢ global NEW_MESSAGE notifications là đã đọc**
- Nếu notification có `user_id NOT NULL`:
  - Chỉ đánh dấu notification đó là đã đọc

**Example:**
```javascript
// Admin click vào global notification
fetch('/api/notifications/global-uuid/mark-read', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + adminToken
  }
})
// → Tất cả global NEW_MESSAGE notifications → status = "read"
```

### 3. Đếm unread notifications cho admin

**GET** `/api/notifications/user/{adminId}/unread/count`

**Behavior:**
- Đếm notifications có `user_id = adminId AND status = UNREAD` (cá nhân)
- **PLUS** notifications có `user_id IS NULL AND type = NEW_MESSAGE AND status = UNREAD` (toàn cục)

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "result": 5
}
```

### 4. Tạo global notification (Internal Use)

**POST** `/api/notifications/global-new-message`

**Permissions:** SYSTEM (used by ChatNotificationService)

**Parameters:**
- `senderUserId` (UUID) - ID của customer gửi tin nhắn
- `senderName` (string) - Tên customer
- `messagePreview` (string) - Nội dung tin nhắn

**Creates:**
```json
{
  "userId": null,
  "type": "NEW_MESSAGE",
  "message": "New message from {senderName}: {messagePreview}",
  "anchor": "/chat/{senderUserId}",
  "status": "UNREAD"
}
```

## Chat to Notification Flow

### Luồng thực thi khi customer gửi tin nhắn

#### 1. Customer gửi tin nhắn qua WebSocket
```javascript
// Frontend customer
const message = {
    senderId: "customer-uuid",
    senderUsername: "john_doe", 
    senderType: "user",
    message: "Hello, I need help with my order #12345",
    createdAt: "2025-11-10T14:30:00"
};

stompClient.send("/app/user-message", {}, JSON.stringify(message));
```

#### 2. Backend xử lý (ChatController)
```java
@MessageMapping("/user-message")
public ChatMessageDto handleUserMessage(ChatMessageDto message, Principal principal) {
    // Save message to chat_messages table
    ChatMessageDto savedMessage = chatService.saveMessage(message);
    
    // Trigger global notification
    notificationService.handleNewUserMessage(savedMessage);
    
    return savedMessage;
}
```

#### 3. Tạo global notification (ChatNotificationService)
```java
public void handleNewUserMessage(ChatMessageDto message) {
    // Create global notification for all admins/managers
    NotificationResponse globalNotification = notificationService.createGlobalNewMessageNotification(
        message.getSenderId(), 
        message.getSenderUsername(), 
        message.getMessage()
    );
    
    // Send real-time notification
    messagingTemplate.convertAndSend("/topic/notifications", globalNotification);
}
```

#### 4. Database operations
```sql
-- 1. Insert chat message
INSERT INTO chat_messages (id, sender_id, sender_username, message, ...)
VALUES ('msg-uuid', 'customer-uuid', 'john_doe', 'Hello, I need help...', ...);

-- 2. Insert global notification
INSERT INTO notifications (id, user_id, type, message, anchor, status, ...)
VALUES ('notif-uuid', NULL, 'NEW_MESSAGE', 'New message from john_doe: Hello...', '/chat/customer-uuid', 1, ...);
```

#### 5. Real-time WebSocket broadcast
```javascript
// All admin clients receive via /topic/notifications
{
  "id": "notif-uuid",
  "userId": null,
  "type": "NEW_MESSAGE",
  "message": "New message from john_doe: Hello, I need help with my order #12345",
  "anchor": "/chat/customer-uuid",
  "status": "UNREAD",
  "createdAt": "2025-11-10T14:30:00Z"
}
```

### Admin response workflow

#### 1. Admin clicks vào notification
```javascript
// Admin frontend
function handleNotificationClick(notification) {
    if (notification.status === 'UNREAD') {
        markAsRead(notification.id);
    }
    
    // Navigate to chat
    if (notification.anchor) {
        window.location.href = notification.anchor; // "/chat/customer-uuid"
    }
}

function markAsRead(notificationId) {
    fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + adminToken }
    });
}
```

#### 2. Backend đánh dấu đã đọc (Smart Logic)
```java
public void markNotificationAsRead(UUID notificationId) {
    Notification notification = notificationRepository.findById(notificationId);
    
    if (notification.getUserId() == null && notification.getType() == NEW_MESSAGE) {
        // Mark ALL global NEW_MESSAGE notifications as read
        notificationRepository.markGlobalNewMessageAsRead(LocalDateTime.now());
        log.info("Marked all global NEW_MESSAGE notifications as read");
    } else {
        // Mark individual notification as read
        notification.setStatus(NotificationStatus.read);
        notificationRepository.save(notification);
    }
}
```

#### 3. Database update
```sql
-- Nếu là global notification
UPDATE notifications 
SET status = 2, updated_at = NOW() 
WHERE user_id IS NULL 
AND type = 'NEW_MESSAGE' 
AND status = 1;

-- Nếu là personal notification  
UPDATE notifications 
SET status = 2, updated_at = NOW() 
WHERE id = 'specific-uuid';
```

## Frontend Integration

### React Hook for Admin Notifications
```javascript
const useAdminNotifications = (adminUserId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications (includes global + personal)
  const fetchNotifications = async () => {
    const response = await fetch(`/api/notifications?userId=${adminUserId}&maxResultCount=50`, {
      headers: { 'Authorization': 'Bearer ' + getAdminToken() }
    });
    const data = await response.json();
    setNotifications(data.result.data);
  };

  // Fetch unread count (includes global + personal)
  const fetchUnreadCount = async () => {
    const response = await fetch(`/api/notifications/user/${adminUserId}/unread/count`, {
      headers: { 'Authorization': 'Bearer ' + getAdminToken() }
    });
    const data = await response.json();
    setUnreadCount(data.result);
  };

  // Mark as read (smart logic on backend)
  const markAsRead = async (notificationId) => {
    await fetch(`/api/notifications/${notificationId}/mark-read`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + getAdminToken() }
    });
    
    // Refresh data
    fetchNotifications();
    fetchUnreadCount();
  };

  // WebSocket subscription for real-time notifications
  useEffect(() => {
    const socket = new SockJS('/ws');
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
      // Subscribe for global notifications
      stompClient.subscribe('/topic/notifications', function(message) {
        const notification = JSON.parse(message.body);
        
        // Add to notifications list
        setNotifications(prev => [notification, ...prev]);
        
        // Update unread count
        fetchUnreadCount();
        
        // Show toast
        showNotificationToast(notification.message);
      });
    });

    return () => stompClient.disconnect();
  }, []);

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    refresh: () => {
      fetchNotifications();
      fetchUnreadCount();
    }
  };
};
```

### Admin Notification Component
```javascript
const AdminNotificationPanel = ({ adminUserId }) => {
  const { notifications, unreadCount, markAsRead } = useAdminNotifications(adminUserId);

  const handleNotificationClick = (notification) => {
    if (notification.status === 'UNREAD') {
      markAsRead(notification.id);
    }
    
    // Navigate to chat if it's a message notification
    if (notification.type === 'NEW_MESSAGE' && notification.anchor) {
      window.location.href = notification.anchor;
    }
  };

  const renderNotification = (notification) => {
    const isGlobal = notification.userId === null;
    
    return (
      <div 
        key={notification.id}
        className={`notification-item ${notification.status === 'UNREAD' ? 'unread' : ''} ${isGlobal ? 'global' : ''}`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="notification-icon">
          {isGlobal ? <GlobalIcon /> : <PersonalIcon />}
          {getTypeIcon(notification.type)}
        </div>
        
        <div className="notification-content">
          <p>{notification.message}</p>
          <span className="notification-meta">
            {isGlobal ? 'Global notification' : 'Personal notification'} • 
            {formatTime(notification.createdAt)}
          </span>
        </div>
        
        {notification.status === 'UNREAD' && <div className="unread-dot" />}
      </div>
    );
  };

  return (
    <div className="admin-notification-panel">
      <div className="notification-header">
        <h3>Notifications ({unreadCount})</h3>
      </div>
      
      <div className="notification-list">
        {notifications.map(renderNotification)}
      </div>
    </div>
  );
};
```

## Testing Examples

### Test Global Notification Creation
```bash
# Simulate customer sending message (this should trigger global notification)
curl -X POST "http://localhost:8080/chat/send-message" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -d '{
    "senderId": "customer-uuid",
    "senderUsername": "john_doe",
    "message": "Hello, I need help!"
  }'
```

### Test Admin Fetching Notifications
```bash
# Get notifications for admin (includes global + personal)
curl -X GET "http://localhost:8080/api/notifications?userId=admin-uuid&maxResultCount=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Should return both:
# - Global notifications (userId: null, type: NEW_MESSAGE)  
# - Personal notifications (userId: admin-uuid)
```

### Test Smart Mark as Read
```bash
# Mark global notification as read (marks ALL global NEW_MESSAGE as read)
curl -X PUT "http://localhost:8080/api/notifications/global-notif-uuid/mark-read" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Mark personal notification as read (marks only that one)
curl -X PUT "http://localhost:8080/api/notifications/personal-notif-uuid/mark-read" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Test Unread Count
```bash
# Get unread count for admin (includes global + personal)
curl -X GET "http://localhost:8080/api/notifications/user/admin-uuid/unread/count" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Should return combined count
```

## Advantages of This Approach

### ✅ Pros:
1. **Simple database structure** - No additional tables
2. **Easy to understand** - NULL user_id = global notification  
3. **Efficient queries** - Single query gets both personal and global
4. **Smart read logic** - One admin reads global → all admins see as read
5. **Backward compatible** - Existing personal notifications still work

### ⚠️ Considerations:
1. **Cascade read effect** - One admin reading affects all admins
2. **No individual tracking** - Can't see which specific admin read it
3. **Type coupling** - Global logic tied to NEW_MESSAGE type

## Best Practices

1. **Use for chat notifications only** - Keep global notifications limited to NEW_MESSAGE type
2. **Clear UI indicators** - Show users when notification is global vs personal  
3. **Proper logging** - Log when global notifications are marked as read
4. **Monitor performance** - Watch query performance with large datasets
5. **Consider archiving** - Clean up old global notifications periodically

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Admin marks read on already-read global notification | No-op, returns success |
| Admin marks read on non-existent notification | 404 error |
| Customer creates message while all admins offline | Global notification created, will be visible when admins come online |
| Race condition (multiple admins mark read simultaneously) | Last write wins, no data corruption |

---

This system provides a simple yet effective way to handle global notifications for admin/manager users while maintaining the flexibility for personal notifications.