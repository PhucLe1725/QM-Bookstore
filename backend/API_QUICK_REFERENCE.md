# 🚀 QM Bookstore - API Quick Reference

> **🚨 LATEST UPDATES (Oct 14, 2025):**
> - Manager role now has same chat permissions as Admin
> - User messages no longer need receiverId (auto-set to null)
> - New endpoints: `/chat/admin/user-messages` & `/chat/admin/messages-from-user/{userId}`
> - Enhanced role-based access control

## 🔗 Base URLs
- **REST API:** `http://localhost:8080/api`
- **WebSocket:** `ws://localhost:8080/ws`

## 🔐 Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | User login |
| `POST` | `/auth/refresh-token` | Refresh access token |
| `POST` | `/auth/logout` | User logout |

## 👥 User Management Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/users/getAll` | Get all users | ✅ |
| `GET` | `/users/getAllPaginated` | Get users with pagination & sort | ✅ |
| `GET` | `/users/getById/{id}` | Get user by ID | ✅ |
| `GET` | `/users/getByUsername/{username}` | Get user by username | ✅ |
| `POST` | `/users/create` | Create new user | ✅ |
| `PUT` | `/users/update/{id}` | Update user | ✅ |
| `DELETE` | `/users/delete/{id}` | Delete user | ✅ |

## 💬 Chat REST Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/chat/history/{userId}` | Get user chat history | ✅ |
| `GET` | `/chat/recent-messages` | Get recent public messages | ❌ |
| `GET` | `/chat/conversation/{user1Id}/{user2Id}` | Get conversation between users | ✅ |
| `GET` | `/chat/unread-count/{userId}` | Get unread message count | ✅ |
| `POST` | `/chat/message` | Save message manually | ✅ |

## 👑 Admin & Manager Chat Endpoints (Updated)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/chat/admin/messages` | Get all messages | ✅ Admin/Manager |
| `GET` | `/chat/admin/user-messages` | **NEW:** Get all user messages (receiverId=null) | ✅ Admin/Manager |
| `GET` | `/chat/admin/messages-from-user/{userId}` | **NEW:** Get messages from specific user | ✅ Admin/Manager |
| `GET` | `/chat/admin/conversation-with-user/{userId}` | **🆕 NEW:** Get full conversation with user (chronological order) | ✅ Admin/Manager |
| `GET` | `/chat/admin/latest-conversations/{adminId}` | Get latest conversations | ✅ Admin/Manager |
| `POST` | `/chat/admin/broadcast` | Broadcast message | ✅ Admin/Manager |
| `GET` | `/chat/conversations` | Get active conversations | ✅ Admin/Manager |

## 🔌 WebSocket Channels (Updated)

### 📥 Subscribe (Receive Messages)
| Channel | Description | Who Can Subscribe |
|---------|-------------|-------------------|
| `/topic/messages` | Admin broadcast messages | All users |
| `/topic/admin-messages` | **Updated:** User messages to system | Admin & Manager |
| **🆕 `/topic/admin-notifications`** | **Real-time admin notifications** | **Admin & Manager** |
| **🆕 `/topic/conversation/{userId}`** | **Specific conversation updates** | **Admin & Manager** |
| `/user/queue/private-messages` | Private 1-1 messages | Message recipient |
| `/user/queue/chat-history` | Chat history on connect | User who requested |

### 📤 Send (Send Messages)
| Channel | Description | Message Type |
|---------|-------------|--------------|
| `/app/admin-chat` | Admin broadcast | Public message |
| `/app/user-message` | User to admin | Public to admin |
| `/app/private-message` | Private message | 1-1 message |
| `/app/load-history` | Request chat history | History request |
| **🆕 `/app/chat.typing`** | **Typing indicators** | **TypingIndicator** |
| **🆕 `/app/chat.status`** | **User status updates** | **UserStatusUpdate** |

### 🆕 New Real-time Features

#### Admin Notification Payload
```json
{
  "type": "conversation_update",
  "conversationUserId": "user-uuid",
  "messageId": 123,
  "senderId": "user-uuid", 
  "senderUsername": "john_doe",
  "messagePreview": "Hello, I need help with...",
  "timestamp": "2025-10-14T10:30:00Z"
}
```

#### Conversation Update Payload
```json
{
  "action": "new_message",
  "userId": "user-uuid",
  "message": { /* ChatMessage object */ },
  "actorId": "admin-uuid",
  "actorUsername": "admin_user",
  "timestamp": "2025-10-14T10:30:00Z"
}
```

#### Typing Indicator Payload
```json
{
  "userId": "sender-uuid",
  "username": "john_doe",
  "conversationUserId": "target-user-uuid",
  "isTyping": true
}
```

## 📋 Message Format Examples

### Login Request
```json
{
  "username": "admin",
  "password": "password123"
}
```

### Chat Message (WebSocket)
```json
{
  "senderId": "user-uuid",
  "receiverId": "admin-uuid",
  "message": "Hello!",
  "senderType": "user"
}
```

### Create User Request
```json
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "roleId": 2
}
```

### Pagination Parameters
```
?skipCount=0&maxResultCount=10&sortBy=username&sortDirection=asc
```

## 🔑 Authentication Headers
```
Authorization: Bearer {accessToken}
```

## 📱 Frontend Integration Steps

1. **Login** → Get access token
2. **Store token** → localStorage/sessionStorage  
3. **Connect WebSocket** → Include token in headers
4. **Subscribe channels** → Based on user role
5. **Load history** → Send to `/app/load-history`
6. **Send messages** → Use appropriate channel
7. **Handle errors** → Token expiration, connection issues

## 🎯 Quick Start JavaScript

```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'password' })
});

// WebSocket Connect
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);
stompClient.connect({ 'Authorization': `Bearer ${token}` }, (frame) => {
  // Subscribe to channels
  stompClient.subscribe('/topic/messages', handleMessage);
  // Load history
  stompClient.send('/app/load-history', {}, '{}');
});

// Send message
stompClient.send('/app/user-message', {}, JSON.stringify({
  senderId: 'user-id',
  message: 'Hello admin!',
  senderType: 'user'
  // receiverId: NOT NEEDED - auto-set to null
}));
```

## 🌟 Key Features Implemented

✅ **JWT Authentication** with refresh tokens  
✅ **User CRUD** with pagination & sorting  
✅ **Real-time chat** via WebSocket  
✅ **Message persistence** in database  
✅ **Private & public** messaging  
✅ **Chat history** loading  
✅ **Admin broadcast** capabilities  
✅ **Role-based access** control (Admin & Manager)  
✅ **User-to-system** messaging (no receiverId needed)  
✅ **Enhanced chat management** for Admin/Manager  
✅ **CORS support** for development

## 🛡️ Security Features

✅ **Bearer token** authentication  
✅ **Role-based** endpoint protection  
✅ **Password hashing** with BCrypt  
✅ **JWT token** expiration  
✅ **Refresh token** rotation  
✅ **SQL injection** protection (JPA)  
✅ **CORS** configuration

---
📚 **Full Documentation:** See `FRONTEND_API_GUIDE.md` for detailed examples and implementation guides.