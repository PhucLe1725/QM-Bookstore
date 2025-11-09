# Chat Message Read Status API Guide

Hướng dẫn tích hợp API cho việc quản lý trạng thái đọc tin nhắn trong hệ thống chat của QM Bookstore.

## Tổng quan

Hệ thống đã được cập nhật để theo dõi trạng thái đọc tin nhắn riêng biệt cho:
- **Admin/Manager**: Có thể xem tin nhắn nào từ user đã được đọc
- **User**: Có thể xem tin nhắn nào từ admin đã được đọc

## Database Schema Changes

```sql
ALTER TABLE public.chat_messages
DROP COLUMN IF EXISTS is_read,
ADD COLUMN is_read_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN is_read_by_user  BOOLEAN NOT NULL DEFAULT FALSE;
```

## Base URL
```
http://localhost:8080/api/chat
```

## Authentication
```
Authorization: Bearer <your-jwt-token>
```

## Data Models

### ChatMessageDto (Updated)
```typescript
interface ChatMessageDto {
  id: number;
  senderId: string;               // UUID
  receiverId?: string;            // UUID, optional
  message: string;
  senderType: string;             // "admin", "user", "manager", "chatbot"
  createdAt: string;              // ISO datetime
  isReadByAdmin: boolean;         // NEW: Đã đọc bởi admin
  isReadByUser: boolean;          // NEW: Đã đọc bởi user
  senderUsername?: string;
  receiverUsername?: string;
}
```

### ReadStatusResponse
```typescript
interface ReadStatusResponse {
  success: boolean;
  markedCount: number;
  message: string;
}
```

### MarkMessagesReadRequest
```typescript
interface MarkMessagesReadRequest {
  userId?: string;                // UUID
  messageIds?: number[];          // Array of message IDs
  markAllFromUser?: boolean;      // Mark all messages from this user
}
```

## API Endpoints

### 1. Admin đánh dấu tin nhắn từ user đã đọc

**PUT** `/api/chat/admin/mark-read/user/{userId}`

**Permissions:** ADMIN, MANAGER

**Path Parameters:**
- `userId` (UUID) - ID của user có tin nhắn cần đánh dấu

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "result": {
    "success": true,
    "markedCount": 5,
    "message": "Đã đánh dấu 5 tin nhắn là đã đọc"
  }
}
```

**Example:**
```javascript
await fetch('/api/chat/admin/mark-read/user/123e4567-e89b-12d3-a456-426614174000', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### 2. User đánh dấu tin nhắn từ admin đã đọc

**PUT** `/api/chat/user/{userId}/mark-read-from-admin`

**Path Parameters:**
- `userId` (UUID) - ID của user

**Response:**
```json
{
  "code": 200,
  "message": "Success", 
  "result": {
    "success": true,
    "markedCount": 3,
    "message": "Đã đánh dấu 3 tin nhắn là đã đọc"
  }
}
```

### 3. Đánh dấu tin nhắn cụ thể đã đọc bởi admin

**PUT** `/api/chat/admin/mark-read/message/{messageId}`

**Permissions:** ADMIN, MANAGER

**Path Parameters:**
- `messageId` (Long) - ID của tin nhắn

### 4. Đánh dấu tin nhắn cụ thể đã đọc bởi user

**PUT** `/api/chat/user/mark-read/message/{messageId}`

**Path Parameters:**
- `messageId` (Long) - ID của tin nhắn

### 5. Lấy số tin nhắn chưa đọc bởi admin từ user

**GET** `/api/chat/admin/unread-count/user/{userId}`

**Permissions:** ADMIN, MANAGER

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "result": 8
}
```

### 6. Lấy số tin nhắn chưa đọc bởi user từ admin

**GET** `/api/chat/user/{userId}/unread-count-from-admin`

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "result": 2
}
```

### 7. Lấy tổng số tin nhắn chưa đọc bởi admin

**GET** `/api/chat/admin/total-unread-count`

**Permissions:** ADMIN, MANAGER

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "result": 25
}
```

### 8. Lấy danh sách users có tin nhắn chưa đọc

**GET** `/api/chat/admin/users-with-unread`

**Permissions:** ADMIN, MANAGER

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "result": [
    "123e4567-e89b-12d3-a456-426614174000",
    "456e7890-e89b-12d3-a456-426614174001"
  ]
}
```

### 9. Lấy tin nhắn chưa đọc bởi admin (có phân trang)

**GET** `/api/chat/admin/unread-messages`

**Permissions:** ADMIN, MANAGER

**Query Parameters:**
- `page` (number, default: 0) - Số trang
- `size` (number, default: 20) - Kích thước trang
- `sort` (string, optional) - Trường sắp xếp

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "result": {
    "content": [
      {
        "id": 123,
        "senderId": "123e4567-e89b-12d3-a456-426614174000",
        "message": "Tôi cần hỗ trợ về đơn hàng",
        "senderType": "user",
        "createdAt": "2025-11-10T10:30:00Z",
        "isReadByAdmin": false,
        "isReadByUser": true,
        "senderUsername": "john_doe"
      }
    ],
    "totalElements": 25,
    "totalPages": 2,
    "size": 20,
    "number": 0
  }
}
```

### 10. Lấy tin nhắn chưa đọc bởi user

**GET** `/api/chat/user/{userId}/unread-messages`

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "result": [
    {
      "id": 124,
      "senderId": "admin-uuid",
      "receiverId": "123e4567-e89b-12d3-a456-426614174000",
      "message": "Chào bạn! Chúng tôi đã xử lý đơn hàng của bạn",
      "senderType": "admin",
      "createdAt": "2025-11-10T11:00:00Z",
      "isReadByAdmin": true,
      "isReadByUser": false,
      "senderUsername": "admin_support"
    }
  ]
}
```

### 11. Endpoint tổng hợp để đánh dấu multiple messages

**PUT** `/api/chat/mark-read`

**Request Body:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "markAllFromUser": true
}
```

hoặc

```json
{
  "messageIds": [123, 124, 125]
}
```

## Frontend Integration Examples

### React Hook cho Read Status

```javascript
import { useState, useCallback } from 'react';

const useChatReadStatus = () => {
  const [unreadCounts, setUnreadCounts] = useState({
    totalAdminUnread: 0,
    userUnreadFromAdmin: {},  // { userId: count }
    adminUnreadFromUser: {}   // { userId: count }
  });

  const getAuthHeaders = () => ({
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  });

  // Lấy tổng số tin nhắn chưa đọc bởi admin
  const fetchTotalAdminUnread = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/admin/total-unread-count', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setUnreadCounts(prev => ({
        ...prev,
        totalAdminUnread: data.result || 0
      }));
    } catch (error) {
      console.error('Error fetching total admin unread:', error);
    }
  }, []);

  // Lấy số tin nhắn chưa đọc từ admin cho user
  const fetchUserUnreadFromAdmin = useCallback(async (userId) => {
    try {
      const response = await fetch(`/api/chat/user/${userId}/unread-count-from-admin`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setUnreadCounts(prev => ({
        ...prev,
        userUnreadFromAdmin: {
          ...prev.userUnreadFromAdmin,
          [userId]: data.result || 0
        }
      }));
    } catch (error) {
      console.error('Error fetching user unread from admin:', error);
    }
  }, []);

  // Đánh dấu tin nhắn đã đọc bởi admin cho user
  const markAsReadByAdminForUser = useCallback(async (userId) => {
    try {
      const response = await fetch(`/api/chat/admin/mark-read/user/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        // Cập nhật local state
        setUnreadCounts(prev => ({
          ...prev,
          adminUnreadFromUser: {
            ...prev.adminUnreadFromUser,
            [userId]: 0
          }
        }));
        
        // Refresh total count
        fetchTotalAdminUnread();
      }
    } catch (error) {
      console.error('Error marking as read by admin:', error);
    }
  }, [fetchTotalAdminUnread]);

  // Đánh dấu tin nhắn đã đọc bởi user từ admin
  const markAsReadByUserFromAdmin = useCallback(async (userId) => {
    try {
      const response = await fetch(`/api/chat/user/${userId}/mark-read-from-admin`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        setUnreadCounts(prev => ({
          ...prev,
          userUnreadFromAdmin: {
            ...prev.userUnreadFromAdmin,
            [userId]: 0
          }
        }));
      }
    } catch (error) {
      console.error('Error marking as read by user:', error);
    }
  }, []);

  return {
    unreadCounts,
    fetchTotalAdminUnread,
    fetchUserUnreadFromAdmin,
    markAsReadByAdminForUser,
    markAsReadByUserFromAdmin
  };
};

export default useChatReadStatus;
```

### Component hiển thị unread counter

```javascript
import React, { useEffect } from 'react';
import useChatReadStatus from './useChatReadStatus';

const ChatUnreadCounter = ({ userId, isAdmin = false }) => {
  const {
    unreadCounts,
    fetchTotalAdminUnread,
    fetchUserUnreadFromAdmin,
    markAsReadByAdminForUser,
    markAsReadByUserFromAdmin
  } = useChatReadStatus();

  useEffect(() => {
    if (isAdmin) {
      fetchTotalAdminUnread();
    } else if (userId) {
      fetchUserUnreadFromAdmin(userId);
    }
  }, [isAdmin, userId, fetchTotalAdminUnread, fetchUserUnreadFromAdmin]);

  const handleMarkAllRead = () => {
    if (isAdmin) {
      // Admin có thể chọn user cụ thể để mark read
      // Ở đây cần UI để chọn user
    } else if (userId) {
      markAsReadByUserFromAdmin(userId);
    }
  };

  const getUnreadCount = () => {
    if (isAdmin) {
      return unreadCounts.totalAdminUnread;
    }
    return unreadCounts.userUnreadFromAdmin[userId] || 0;
  };

  const unreadCount = getUnreadCount();

  if (unreadCount === 0) return null;

  return (
    <div className="chat-unread-counter">
      <span className="unread-badge">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
      
      <button 
        className="mark-read-btn"
        onClick={handleMarkAllRead}
        title="Đánh dấu tất cả đã đọc"
      >
        ✓
      </button>
    </div>
  );
};

export default ChatUnreadCounter;
```

### Real-time Updates với WebSocket

```javascript
// Trong chat component
useEffect(() => {
  const stompClient = // ... WebSocket connection
  
  // Listen for new messages
  stompClient.subscribe('/topic/chat/messages', (message) => {
    const messageData = JSON.parse(message.body);
    
    // Tự động cập nhật unread count khi có tin nhắn mới
    if (messageData.senderType === 'user' && isAdmin) {
      fetchTotalAdminUnread();
    } else if (messageData.senderType === 'admin' && !isAdmin) {
      fetchUserUnreadFromAdmin(currentUserId);
    }
  });
  
  // Listen for read status changes
  stompClient.subscribe('/topic/chat/read-status', (update) => {
    const statusData = JSON.parse(update.body);
    // Update UI based on read status changes
    handleReadStatusUpdate(statusData);
  });
}, []);
```

## Best Practices

1. **Real-time Updates**: Kết hợp WebSocket để cập nhật read status real-time
2. **Batch Operations**: Sử dụng endpoint `/mark-read` để đánh dấu nhiều tin nhắn cùng lúc
3. **Caching**: Cache unread counts ở client để giảm API calls
4. **Performance**: Sử dụng phân trang cho danh sách tin nhắn chưa đọc
5. **UX**: Hiển thị visual indicators rõ ràng cho tin nhắn đã/chưa đọc

## Testing với cURL

```bash
# Lấy số tin nhắn chưa đọc tổng cộng (admin)
curl -X GET "http://localhost:8080/api/chat/admin/total-unread-count" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Đánh dấu tin nhắn từ user đã đọc (admin)
curl -X PUT "http://localhost:8080/api/chat/admin/mark-read/user/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Lấy tin nhắn chưa đọc từ admin (user)
curl -X GET "http://localhost:8080/api/chat/user/123e4567-e89b-12d3-a456-426614174000/unread-count-from-admin" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Đánh dấu multiple messages đã đọc
curl -X PUT "http://localhost:8080/api/chat/mark-read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "markAllFromUser": true
  }'
```

## Error Handling

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Message or user not found |
| 500 | Internal Server Error | Server error |