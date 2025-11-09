# Notification API Guide

Hướng dẫn tích hợp API thông báo cho frontend của QM Bookstore.

## Base URL
```
http://localhost:8080/api/notifications
```

## Authentication
Các API yêu cầu JWT token trong header:
```
Authorization: Bearer <your-jwt-token>
```

## Common Response Format
Tất cả API đều trả về response theo format:
```json
{
  "code": 200,
  "message": "Success",
  "result": {
    // Data object hoặc array
  },
  "timestamp": "2025-11-09T10:30:00Z"
}
```

## Notification Types
```typescript
enum NotificationType {
  NEW_MESSAGE = "NEW_MESSAGE",
  ORDER_UPDATE = "ORDER_UPDATE", 
  PAYMENT_UPDATE = "PAYMENT_UPDATE",
  SYSTEM_NOTIFICATION = "SYSTEM_NOTIFICATION",
  PROMOTION = "PROMOTION"
}

enum NotificationStatus {
  UNREAD = "UNREAD",
  READ = "READ"
}
```

## Data Models

### NotificationResponse
```typescript
interface NotificationResponse {
  id: string;                    // UUID
  userId: string;               // UUID
  username: string;             // Tên user
  type: NotificationType;       // Loại thông báo
  message: string;              // Nội dung thông báo
  anchor?: string;              // Link đích (optional)
  status: NotificationStatus;   // Trạng thái đọc/chưa đọc
  createdAt: string;           // ISO datetime
  updatedAt: string;           // ISO datetime
}
```

### BaseGetAllResponse
```typescript
interface BaseGetAllResponse<T> {
  data: T[];                   // Mảng dữ liệu
  totalRecords: number;        // Tổng số bản ghi
}
```

## API Endpoints

### 1. Lấy danh sách thông báo (có phân trang và filter)

**GET** `/api/notifications`

**Query Parameters:**
- `userId` (UUID, optional) - ID của user
- `skipCount` (number, default: 0) - Số bản ghi bỏ qua
- `maxResultCount` (number, default: 10) - Số bản ghi tối đa
- `sortBy` (string, optional) - Trường để sắp xếp
- `sortDirection` (string, default: "desc") - Hướng sắp xếp (asc/desc)
- `type` (string, optional) - Loại thông báo (NEW_MESSAGE, ORDER_UPDATE, ...)
- `status` (string, optional) - Trạng thái (UNREAD, READ)
- `fromDate` (string, optional) - Ngày bắt đầu (yyyy-MM-dd HH:mm:ss)
- `toDate` (string, optional) - Ngày kết thúc (yyyy-MM-dd HH:mm:ss)

**Example Request:**
```javascript
fetch('/api/notifications?userId=123e4567-e89b-12d3-a456-426614174000&maxResultCount=20&type=NEW_MESSAGE&status=UNREAD', {
  headers: {
    'Authorization': 'Bearer ' + token
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
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "123e4567-e89b-12d3-a456-426614174000",
        "username": "john_doe",
        "type": "NEW_MESSAGE",
        "message": "New message from Alice: Hello there!",
        "anchor": "/chat/456",
        "status": "UNREAD",
        "createdAt": "2025-11-09T10:30:00Z",
        "updatedAt": "2025-11-09T10:30:00Z"
      }
    ],
    "totalRecords": 1
  }
}
```

### 2. Lấy thông báo theo ID

**GET** `/api/notifications/{id}`

**Path Parameters:**
- `id` (UUID) - ID của thông báo

**Example:**
```javascript
fetch('/api/notifications/550e8400-e29b-41d4-a716-446655440000', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
})
```

### 3. Tạo thông báo mới

**POST** `/api/notifications`

**Permissions:** ADMIN, MANAGER

**Request Body:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "type": "SYSTEM_NOTIFICATION",
  "message": "Maintenance will start at 2 AM",
  "anchor": "/maintenance"
}
```

### 4. Cập nhật trạng thái thông báo

**PUT** `/api/notifications/{id}`

**Request Body:**
```json
{
  "status": "READ"
}
```

### 5. Xóa thông báo

**DELETE** `/api/notifications/{id}`

**Permissions:** ADMIN, MANAGER

### 6. Lấy thông báo của user cụ thể

**GET** `/api/notifications/user/{userId}`

**Response:** Array of NotificationResponse

### 7. Lấy thông báo chưa đọc của user

**GET** `/api/notifications/user/{userId}/unread`

**Response:** Array of NotificationResponse

### 8. Đếm số thông báo chưa đọc

**GET** `/api/notifications/user/{userId}/unread/count`

**Response:**
```json
{
  "code": 200,
  "message": "Success", 
  "result": 5
}
```

### 9. Đánh dấu thông báo đã đọc

**PUT** `/api/notifications/{id}/mark-read`

### 10. Đánh dấu tất cả thông báo đã đọc

**PUT** `/api/notifications/user/{userId}/mark-all-read`

## Helper Endpoints (Tạo thông báo nhanh)

### 11. Tạo thông báo tin nhắn mới

**POST** `/api/notifications/new-message`

**Permissions:** ADMIN, MANAGER, USER

**Parameters:**
- `userId` (UUID) - ID người nhận
- `senderName` (string) - Tên người gửi
- `messagePreview` (string) - Preview tin nhắn

### 12. Tạo thông báo cập nhật đơn hàng

**POST** `/api/notifications/order-update`

**Permissions:** ADMIN, MANAGER

**Parameters:**
- `userId` (UUID) - ID khách hàng
- `orderNumber` (string) - Mã đơn hàng
- `status` (string) - Trạng thái mới

### 13. Tạo thông báo cập nhật thanh toán

**POST** `/api/notifications/payment-update`

**Permissions:** ADMIN, MANAGER

**Parameters:**
- `userId` (UUID) - ID khách hàng
- `paymentId` (string) - ID thanh toán
- `status` (string) - Trạng thái thanh toán

### 14. Tạo thông báo hệ thống

**POST** `/api/notifications/system`

**Permissions:** ADMIN

**Parameters:**
- `userId` (UUID) - ID người nhận
- `message` (string) - Nội dung thông báo

### 15. Tạo thông báo khuyến mãi

**POST** `/api/notifications/promotion`

**Permissions:** ADMIN, MANAGER

**Parameters:**
- `userId` (UUID) - ID khách hàng
- `promotionTitle` (string) - Tiêu đề khuyến mãi
- `promotionLink` (string, optional) - Link chi tiết

## WebSocket Real-time Notifications

### Kết nối WebSocket
```javascript
const socket = new SockJS('/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({}, function(frame) {
    console.log('Connected: ' + frame);
    
    // Subscribe để nhận thông báo real-time cho user cụ thể
    stompClient.subscribe('/topic/notifications/' + userId, function(notification) {
        const notificationData = JSON.parse(notification.body);
        // Xử lý thông báo mới
        handleNewNotification(notificationData);
    });
});
```

### Xử lý thông báo real-time
```javascript
function handleNewNotification(notification) {
    // Hiển thị popup/toast
    showNotificationToast(notification.message);
    
    // Cập nhật counter thông báo chưa đọc
    updateUnreadCount();
    
    // Thêm vào danh sách thông báo
    addToNotificationList(notification);
}
```

## Frontend Integration Examples

### React Hook để quản lý thông báo
```javascript
import { useState, useEffect } from 'react';

const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Lấy danh sách thông báo
  const fetchNotifications = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        userId,
        skipCount: 0,
        maxResultCount: 20,
        ...params
      });
      
      const response = await fetch(`/api/notifications?${queryParams}`, {
        headers: {
          'Authorization': 'Bearer ' + getToken()
        }
      });
      
      const data = await response.json();
      setNotifications(data.result.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
    setLoading(false);
  };

  // Lấy số thông báo chưa đọc
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`/api/notifications/user/${userId}/unread/count`, {
        headers: {
          'Authorization': 'Bearer ' + getToken()
        }
      });
      const data = await response.json();
      setUnreadCount(data.result);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Đánh dấu đã đọc
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + getToken()
        }
      });
      
      // Cập nhật local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, status: 'READ' } : n
        )
      );
      
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Đánh dấu tất cả đã đọc
  const markAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/user/${userId}/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + getToken()
        }
      });
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refetch: () => {
      fetchNotifications();
      fetchUnreadCount();
    }
  };
};

export default useNotifications;
```

### Component hiển thị thông báo
```javascript
import React from 'react';
import useNotifications from './useNotifications';

const NotificationPanel = ({ userId, isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  } = useNotifications(userId);

  const handleNotificationClick = (notification) => {
    if (notification.status === 'UNREAD') {
      markAsRead(notification.id);
    }
    
    // Navigate to anchor if exists
    if (notification.anchor) {
      window.location.href = notification.anchor;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Thông báo ({unreadCount})</h3>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead}>
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>
      
      <div className="notification-list">
        {loading ? (
          <div>Loading...</div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${notification.status === 'UNREAD' ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-type">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <p>{notification.message}</p>
                <span className="notification-time">
                  {formatTime(notification.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Notification not found |
| 500 | Internal Server Error | Server error |

## Best Practices

1. **Caching**: Cache danh sách thông báo ở client để giảm API calls
2. **Real-time**: Sử dụng WebSocket để nhận thông báo real-time
3. **Pagination**: Sử dụng phân trang cho danh sách thông báo dài
4. **Error Handling**: Xử lý lỗi network và hiển thị thông báo phù hợp
5. **Performance**: Debounce các action như mark as read
6. **UX**: Hiển thị loading states và empty states phù hợp

## Testing

### Test với curl
```bash
# Lấy danh sách thông báo
curl -X GET "http://localhost:8080/api/notifications?userId=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Đánh dấu đã đọc
curl -X PUT "http://localhost:8080/api/notifications/550e8400-e29b-41d4-a716-446655440000/mark-read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Tạo thông báo mới
curl -X POST "http://localhost:8080/api/notifications/new-message" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "userId=123e4567-e89b-12d3-a456-426614174000&senderName=Alice&messagePreview=Hello!"
```