# Admin to Customer Chat & Notification Flow

## 📋 Tóm tắt API cho Admin nhắn tin Customer

### 1. REST API (Mới thêm)
```http
POST /api/chat/admin/send-private-message/{customerId}
Headers: Authorization: Bearer {jwt_token}
Body: {
  "message": "Xin chào, chúng tôi có thể giúp gì cho bạn?"
}
```

### 2. WebSocket API (Real-time)
```javascript
// Kết nối WebSocket
const socket = new SockJS('/ws');
const stompClient = Stomp.over(socket);

// Gửi tin nhắn riêng tư
stompClient.send("/app/private-message", {}, JSON.stringify({
    message: "Hello customer!",
    receiverId: "customer-uuid-here",
    senderType: "admin"
}));
```

## 🔄 Expected Complete Flow

### When Admin sends message to Customer:

1. **Admin Frontend** → Gửi message qua WebSocket/REST API
2. **Backend** → Xử lý message và tạo:
   - Chat message record
   - **🔔 Personal notification for Customer** (userId = customerId, type = NEW_MESSAGE)
   - **🔔 Global notification for Admin/Manager** (userId = null, type = NEW_MESSAGE) 
3. **WebSocket Broadcast**:
   - Message → `/topic/messages` (for chat)
   - Customer notification → `/topic/notifications/{customerId}` 
   - Global notification → `/topic/notifications` (for admin/manager)
4. **Customer Frontend** → Nhận notification qua WebSocket
5. **UI Updates** → Notification count + list update

## 🧪 Current Frontend Implementation Status

### ✅ Customer WebSocket Subscriptions (READY)
```javascript
// Customer sẽ subscribe to:
stompClient.subscribe(`/topic/notifications/${customerId}`, function (message) {
  // Handle personal notification
})
```

### ✅ Admin WebSocket Subscriptions (READY)
```javascript
// Admin sẽ subscribe to:
stompClient.subscribe('/topic/notifications', function (message) {
  // Handle global notification
})
```

### ✅ Notification Context & Hooks (READY)
- `useNotifications()` hook with enhanced logging
- `NotificationContext` with real-time handler
- Automatic unread count refresh
- Username enrichment for notifications

## 🔍 Troubleshooting Checklist

### 1. Backend Verification Needed:
- [ ] Khi admin gửi message, có tạo notification record cho customer không?
- [ ] Notification có được broadcast qua WebSocket không?
- [ ] API endpoint `/api/notifications/user/{customerId}` có trả về notifications không?

### 2. Frontend Debug Steps:

#### Customer Browser Console:
```
🔗 Setting up WebSocket subscriptions for user: {userId: "customer-id", isAdmin: false}
📡 Subscribing to private notifications for user: customer-id role: customer
👤 User role check: {userId: "customer-id", isAdmin: false} ← Should be false
```

#### When Admin sends message to Customer:
```
🔔 User-specific notification received via /topic: {...}
📞 Calling notification handler for user-specific notification
🔔 New real-time notification received in NotificationContext: {...}
🔔 addNotification called with: {...}
📊 Incrementing unread count locally...
```

### 3. API Testing:
```bash
# Test customer notifications API
GET http://localhost:8080/api/notifications/user/{customerId}/unread/count
# Should return count > 0 after admin sends message

GET http://localhost:8080/api/notifications/user/{customerId}
# Should return notification with type NEW_MESSAGE
```

## 🐛 Possible Issues & Solutions

### Issue 1: Customer không nhận được notification
**Possible Causes:**
- Backend không tạo notification record cho customer
- WebSocket broadcast channel sai
- Customer WebSocket subscription chưa đúng

**Solution:**
- Verify backend tạo notification với `userId = customerId`
- Check WebSocket broadcast đến `/topic/notifications/{customerId}`

### Issue 2: Customer fetch global notifications
**Status:** ✅ FIXED
- Role check đã được cập nhật để chỉ admin/manager mới fetch global
- Customer chỉ fetch personal notifications

### Issue 3: Unread count không update real-time
**Status:** ✅ ENHANCED  
- Added immediate local increment
- Server sync after 100ms
- Force re-render trigger
- Periodic refresh every 30 seconds

## 🎯 Next Steps

1. **Test với 2 browser windows:**
   - Window 1: Login as Customer
   - Window 2: Login as Admin
   - Admin gửi message cho Customer
   - Check console logs in Customer window

2. **If Customer vẫn không nhận notification:**
   - Verify backend API `/api/notifications/user/{customerId}`
   - Check database có notification records cho customer không
   - Verify WebSocket broadcast channels

3. **Backend notification creation should be:**
```java
// When admin sends message to customer
public void createNewMessageNotificationForCustomer(UUID customerId, String adminName, String messagePreview) {
    NotificationCreateRequest request = new NotificationCreateRequest();
    request.setUserId(customerId); // Important: Customer's UUID
    request.setType(Notification.NotificationType.NEW_MESSAGE);
    request.setMessage(String.format("New message from %s: %s", adminName, messagePreview));
    request.setAnchor("/chat/" + customerId);
    
    return createNotification(request);
}
```

## 📱 Test Scenarios

### Scenario 1: Admin → Customer
1. Admin login và gửi message cho customer
2. Customer browser should show:
   - Notification count increased
   - New notification in dropdown
   - Toast notification (if permission granted)

### Scenario 2: Customer → Admin  
1. Customer gửi message
2. Admin browser should show:
   - Global notification received
   - Notification count increased

Both scenarios should work with current frontend implementation.