# 🚀 QM Bookstore - Frontend Integration Guide

## 📋 Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [User Management APIs](#user-management-apis)
3. [WebSocket Chat System](#websocket-chat-system)
4. [Chat REST APIs](#chat-rest-apis)
5. [🆕 Real-time Admin Notifications](#real-time-admin-notifications)
6. [🆕 Dynamic Conversation Subscriptions](#dynamic-conversation-subscriptions)
7. [Frontend Implementation Examples](#frontend-implementation-examples)

---

## 🔐 Authentication APIs

### Base URL: `http://localhost:8080/api/auth`

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "code": 1000,
  "message": "Success",
  "result": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "expiresIn": 36000000,
    "user": {
      "id": "uuid-string",
      "username": "user123",
      "email": "user@example.com",
      "roleId": 1,
      "roleName": "admin",
      "createdAt": "2025-10-12T10:30:45.273+07:00",
      "updatedAt": "2025-10-12T10:30:45.273+07:00"
    }
  }
}
```

### 2. Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "string"
}
```

### 3. Logout
```http
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "string"
}
```

---

## 👥 User Management APIs

### Base URL: `http://localhost:8080/api/users`
**Authentication:** Bearer Token required

### 1. Get All Users
```http
GET /api/users/getAll
Authorization: Bearer {accessToken}
```

### 2. Get All Users with Pagination & Sorting
```http
GET /api/users/getAllPaginated?skipCount=0&maxResultCount=10&sortBy=username&sortDirection=asc
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `skipCount`: Page offset (default: 0)
- `maxResultCount`: Page size (default: 10)
- `sortBy`: Field to sort (username, email, createdAt)
- `sortDirection`: Sort direction (asc, desc)

### 3. Get User by ID
```http
GET /api/users/getById/{userId}
Authorization: Bearer {accessToken}
```

### 4. Get User by Username
```http
GET /api/users/getByUsername/{username}
Authorization: Bearer {accessToken}
```

### 5. Create User
```http
POST /api/users/create
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "email": "string",
  "roleId": 1
}
```

### 6. Update User
```http
PUT /api/users/update/{userId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "email": "string",
  "roleId": 2
}
```

### 7. Delete User
```http
DELETE /api/users/delete/{userId}
Authorization: Bearer {accessToken}
```

---

## 💬 WebSocket Chat System

> **🚨 IMPORTANT UPDATES (Oct 14, 2025):**
> - **User messages no longer need `receiverId`** - All admin/manager can see user messages
> - **Manager role now has same chat permissions as Admin**
> - **New API endpoints added for admin/manager to manage user messages**
> - **Enhanced role-based access control for chat system**

### Connection Details
- **WebSocket URL:** `ws://localhost:8080/ws`
- **Protocol:** STOMP over SockJS
- **Allowed Origins:** `http://localhost:5173`, `http://localhost:3000`

### Message Brokers
- **Public topics:** `/topic/*` (broadcast messages)
- **Private queues:** `/queue/*` (1-1 messages)
- **User destinations:** `/user/*` (private user messages)
- **Application prefix:** `/app/*` (client → server)

### ⚡ Chat Message Logic (Updated)

#### **User Messages (No receiver_id needed):**
- User sends message → System sets `receiverId = null`
- All Admin & Manager can view these messages
- Messages are broadcast to `/topic/admin-messages`

#### **Admin/Manager Messages (receiver_id required):**
- Admin/Manager sends message → Must specify `receiverId`
- Messages are traceable to specific users
- Supports both broadcast and private messages

### WebSocket Message Routes

#### 1. Admin Broadcast Message
**Send to:** `/app/admin-chat`
**Receive from:** `/topic/messages`

```javascript
// Send
const message = {
  "senderId": "admin-uuid",
  "message": "Hello everyone!",
  "senderType": "admin"
};
stompClient.send('/app/admin-chat', {}, JSON.stringify(message));

// Subscribe to receive
stompClient.subscribe('/topic/messages', (message) => {
  const chatMessage = JSON.parse(message.body);
  console.log('Admin broadcast:', chatMessage);
});
```

#### 2. User Message to System (Updated)
**Send to:** `/app/user-message`
**Receive from:** `/topic/admin-messages`

```javascript
// Send (NO receiverId needed - system will set to null)
const userMessage = {
  "senderId": "user-uuid",
  "message": "I need help",
  "senderType": "user"
  // receiverId: NOT NEEDED - will be set to null automatically
};
stompClient.send('/app/user-message', {}, JSON.stringify(userMessage));

// Admin/Manager subscribes to receive (both roles can see)
stompClient.subscribe('/topic/admin-messages', (message) => {
  const userMessage = JSON.parse(message.body);
  console.log('User message (visible to all admin/manager):', userMessage);
  // userMessage.receiverId will be null
});
```

#### 3. Private 1-1 Messages
**Send to:** `/app/private-message`
**Receive from:** `/user/queue/private-messages`

```javascript
// Send private message
const privateMessage = {
  "senderId": "sender-uuid",
  "receiverId": "receiver-uuid",
  "message": "Private message content",
  "senderType": "user"
};
stompClient.send('/app/private-message', {}, JSON.stringify(privateMessage));

// Subscribe to receive private messages
stompClient.subscribe('/user/queue/private-messages', (message) => {
  const privateMessage = JSON.parse(message.body);
  console.log('Private message:', privateMessage);
});
```

#### 4. Load Chat History
**Send to:** `/app/load-history`
**Receive from:** `/user/queue/chat-history`

```javascript
// Request chat history
stompClient.send('/app/load-history', {}, JSON.stringify({}));

// Receive history
stompClient.subscribe('/user/queue/chat-history', (message) => {
  const history = JSON.parse(message.body);
  console.log('Chat history:', history);
});
```

---

## 🗂️ Chat REST APIs

### Base URL: `http://localhost:8080/api/chat`

### 1. Get Chat History for User
```http
GET /api/chat/history/{userId}?page=0&size=20&sort=createdAt,desc
Authorization: Bearer {accessToken}
```

### 2. Get Recent Messages (Public)
```http
GET /api/chat/recent-messages?limit=50
```

### 3. Get Conversation Between Two Users
```http
GET /api/chat/conversation/{user1Id}/{user2Id}?page=0&size=20
Authorization: Bearer {accessToken}
```

### 4. Get Unread Message Count
```http
GET /api/chat/unread-count/{userId}
Authorization: Bearer {accessToken}
```

### 5. Save Message Manually
```http
POST /api/chat/message
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "senderId": "uuid",
  "receiverId": "uuid",
  "message": "Message content",
  "senderType": "user"
}
```

### Admin & Manager Endpoints (Updated Access Control)

> **🔑 Permission Update:** Both Admin and Manager roles can access these endpoints

#### 6. Get All Messages
```http
GET /api/chat/admin/messages?page=0&size=20
Authorization: Bearer {accessToken}
# Works for: admin, manager roles
```

#### 7. Get All User Messages (New)
```http
GET /api/chat/admin/user-messages?page=0&size=20
Authorization: Bearer {accessToken}
# Returns: All user messages sent to system (receiverId = null)
# Works for: admin, manager roles
```

#### 8. Get Messages from Specific User (New)
```http
GET /api/chat/admin/messages-from-user/{userId}?page=0&size=20
Authorization: Bearer {accessToken}
# Returns: All messages from a specific user
# Works for: admin, manager roles
```

#### 9. Get Latest Conversations
```http
GET /api/chat/admin/latest-conversations/{adminId}
Authorization: Bearer {accessToken}
# Works for: admin, manager roles
```

#### 10. Get Active Conversations
```http
GET /api/chat/conversations
Authorization: Bearer {accessToken}
# Works for: admin, manager roles
```

#### 11. Broadcast Message
```http
POST /api/chat/admin/broadcast
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "message": "Important announcement!"
}
# Works for: admin, manager roles
```

#### 🆕 12. Get Full Conversation with User
```http
GET /api/chat/admin/conversation-with-user/{userId}?page=0&size=20
Authorization: Bearer {accessToken}
# Returns: Complete conversation including user messages and all admin/manager replies
# Sorted: ASC (oldest first) for reading in chronological order
# Works for: admin, manager roles
```

---

## 🆕 Real-time Admin Notifications

### Overview
New WebSocket channels for instant admin notifications when users send messages or conversation updates occur.

### 1. Admin Notification Channel
**Channel:** `/topic/admin-notifications`  
**Purpose:** Broadcast to ALL admin/manager users when any conversation activity happens  
**Subscription:** Always active for admin/manager users

```typescript
interface AdminNotification {
  type: string;              // "conversation_update", "new_user_message"
  conversationUserId: string; // User ID involved in conversation
  messageId: number;         // ID of the message
  senderId: string;          // Who sent the message
  senderUsername: string;    // Username for display
  messagePreview: string;    // First 50 chars of message
  timestamp: string;         // ISO timestamp
}
```

**Frontend Integration:**
```javascript
// Subscribe to admin notifications (do this once on admin login)
stompClient.subscribe('/topic/admin-notifications', (notification) => {
  const data = JSON.parse(notification.body);
  
  // Show notification badge
  showNotificationBadge(data.conversationUserId);
  
  // Update conversation list
  refreshConversationList();
  
  // Show toast notification
  showToast(`New message from ${data.senderUsername}: ${data.messagePreview}`);
});
```

### 2. Specific Conversation Channel
**Channel:** `/topic/conversation/{userId}`  
**Purpose:** Real-time updates for admins viewing a specific user's conversation  
**Subscription:** Dynamic - subscribe when admin selects user, unsubscribe when switching

```typescript
interface ConversationUpdate {
  action: string;            // "new_message", "typing_start", "typing_stop"
  userId: string;           // User in conversation
  message?: ChatMessage;    // Full message (if action = new_message)
  actorId: string;         // Who performed the action
  actorUsername: string;   // Actor username
  timestamp: string;       // ISO timestamp
}
```

**Frontend Integration:**
```javascript
let currentConversationSubscription = null;

// Subscribe to specific user conversation
function subscribeToUserConversation(userId) {
  // Unsubscribe from previous
  if (currentConversationSubscription) {
    currentConversationSubscription.unsubscribe();
  }
  
  // Subscribe to new user
  currentConversationSubscription = stompClient.subscribe(
    `/topic/conversation/${userId}`, 
    (update) => {
      const data = JSON.parse(update.body);
      
      switch (data.action) {
        case 'new_message':
          // Add message to current conversation view
          addMessageToConversation(data.message);
          break;
        case 'typing_start':
          showTypingIndicator(data.actorUsername);
          break;
        case 'typing_stop':
          hideTypingIndicator(data.actorId);
          break;
      }
    }
  );
}

// Clean unsubscribe when switching users
function switchToUser(newUserId) {
  subscribeToUserConversation(newUserId);
  loadConversationHistory(newUserId);
}
```

---

## 🆕 Dynamic Conversation Subscriptions

### Subscription Management Pattern

```typescript
class AdminChatManager {
  private stompClient: any;
  private currentUserId: string | null = null;
  private conversationSubscription: any = null;
  private adminNotificationSubscription: any = null;

  // Initialize admin chat (call once on login)
  async initializeAdminChat(token: string) {
    // Connect to WebSocket
    this.stompClient = await this.connectWebSocket(token);
    
    // Always subscribe to admin notifications
    this.subscribeToAdminNotifications();
  }

  // Subscribe to admin notifications (persistent)
  private subscribeToAdminNotifications() {
    this.adminNotificationSubscription = this.stompClient.subscribe(
      '/topic/admin-notifications',
      (notification) => {
        const data: AdminNotification = JSON.parse(notification.body);
        this.handleAdminNotification(data);
      }
    );
  }

  // Dynamic conversation subscription
  subscribeToConversation(userId: string) {
    // Clean previous subscription
    this.unsubscribeFromConversation();
    
    this.currentUserId = userId;
    this.conversationSubscription = this.stompClient.subscribe(
      `/topic/conversation/${userId}`,
      (update) => {
        const data: ConversationUpdate = JSON.parse(update.body);
        this.handleConversationUpdate(data);
      }
    );
    
    console.log(`✅ Subscribed to conversation: ${userId}`);
  }

  // Clean unsubscribe
  unsubscribeFromConversation() {
    if (this.conversationSubscription) {
      this.conversationSubscription.unsubscribe();
      this.conversationSubscription = null;
      console.log(`❌ Unsubscribed from conversation: ${this.currentUserId}`);
    }
    this.currentUserId = null;
  }

  // Handle admin notifications
  private handleAdminNotification(notification: AdminNotification) {
    switch (notification.type) {
      case 'conversation_update':
        // Update conversation list badge
        this.updateConversationBadge(notification.conversationUserId);
        break;
      case 'new_user_message':
        // Show system notification
        this.showSystemNotification(notification);
        break;
    }
  }

  // Handle conversation updates
  private handleConversationUpdate(update: ConversationUpdate) {
    switch (update.action) {
      case 'new_message':
        // Only update if we're viewing this conversation
        if (this.currentUserId === update.userId) {
          this.addMessageToCurrentView(update.message);
        }
        break;
      case 'typing_start':
        this.showTypingIndicator(update.actorUsername);
        break;
      case 'typing_stop':
        this.hideTypingIndicator(update.actorId);
        break;
    }
  }

  // Cleanup on logout
  disconnect() {
    this.unsubscribeFromConversation();
    if (this.adminNotificationSubscription) {
      this.adminNotificationSubscription.unsubscribe();
    }
    if (this.stompClient) {
      this.stompClient.disconnect();
    }
  }
}
```

### React Hook Implementation

```typescript
export function useAdminChat() {
  const [chatManager] = useState(() => new AdminChatManager());
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      chatManager.initializeAdminChat(token);
    }

    return () => {
      chatManager.disconnect();
    };
  }, []);

  // Subscribe to user conversation
  const selectUser = useCallback((userId: string) => {
    chatManager.subscribeToConversation(userId);
    setCurrentConversation(userId);
  }, [chatManager]);

  // Unsubscribe when leaving
  const deselectUser = useCallback(() => {
    chatManager.unsubscribeFromConversation();
    setCurrentConversation(null);
  }, [chatManager]);

  return {
    selectUser,
    deselectUser,
    currentConversation,
    notifications
  };
}
```

---

## 📊 Data Types & Response Format

### ChatMessage Object (Updated)
```typescript
interface ChatMessage {
  id?: number;
  senderId: string;           // UUID of sender
  receiverId?: string | null; // UUID of receiver OR null for user messages
  message: string;
  senderType: 'admin' | 'user' | 'manager' | 'chatbot';
  senderUsername?: string;
  receiverUsername?: string;
  createdAt: string;          // ISO timestamp
}
```

### Key Changes in Message Behavior:
- **User Messages:** `receiverId` will always be `null` (visible to all admin/manager)
- **Admin/Manager Messages:** `receiverId` should be specified for user targeting
- **Manager Role:** Has same permissions as Admin for chat operations

### Role-Based Access Summary:
```
User:        Can send messages to system, view own conversation history
Admin:       Full access to all chat APIs and management functions  
Manager:     Same as Admin - full access to all chat APIs
```

---

## 💻 Frontend Implementation Examples

### React/Vue WebSocket Setup

```javascript
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class ChatService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
  }

  // Connect to WebSocket
  connect(token) {
    const socket = new SockJS('http://localhost:8080/ws');
    this.stompClient = Stomp.over(socket);
    
    // Add authorization header
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    this.stompClient.connect(headers, (frame) => {
      console.log('Connected: ' + frame);
      this.connected = true;
      
      // Subscribe to channels
      this.subscribeToChannels();
      
      // Load chat history
      this.loadChatHistory();
    }, (error) => {
      console.error('Connection error:', error);
      this.connected = false;
    });
  }

  // Subscribe to all relevant channels
  subscribeToChannels() {
    // Public messages from admin
    this.stompClient.subscribe('/topic/messages', (message) => {
      const chatMessage = JSON.parse(message.body);
      this.handleIncomingMessage(chatMessage);
    });

    // Private messages
    this.stompClient.subscribe('/user/queue/private-messages', (message) => {
      const privateMessage = JSON.parse(message.body);
      this.handlePrivateMessage(privateMessage);
    });

    // Chat history
    this.stompClient.subscribe('/user/queue/chat-history', (message) => {
      const history = JSON.parse(message.body);
      this.handleChatHistory(history);
    });

    // Admin messages (for admin and manager users - Updated)
    if (this.isAdminOrManager()) {
      this.stompClient.subscribe('/topic/admin-messages', (message) => {
        const userMessage = JSON.parse(message.body);
        // User messages will have receiverId = null
        this.handleUserMessage(userMessage);
      });
    }
  }

  // Load chat history on connect
  loadChatHistory() {
    if (this.connected) {
      this.stompClient.send('/app/load-history', {}, JSON.stringify({}));
    }
  }

  // Send public message (admin/manager - Updated)
  sendAdminBroadcast(message) {
    if (this.connected && this.isAdminOrManager()) {
      const payload = {
        senderId: this.getCurrentUserId(),
        message: message,
        senderType: this.getCurrentUserRole() // 'admin' or 'manager'
      };
      this.stompClient.send('/app/admin-chat', {}, JSON.stringify(payload));
    }
  }

  // Send user message to system (Updated - no receiverId needed)
  sendUserMessage(message) {
    if (this.connected) {
      const payload = {
        senderId: this.getCurrentUserId(),
        message: message,
        senderType: 'user'
        // receiverId: NOT NEEDED - will be set to null by server
      };
      this.stompClient.send('/app/user-message', {}, JSON.stringify(payload));
    }
  }

  // Send private message
  sendPrivateMessage(receiverId, message) {
    if (this.connected) {
      const payload = {
        senderId: this.getCurrentUserId(),
        receiverId: receiverId,
        message: message,
        senderType: 'user'
      };
      this.stompClient.send('/app/private-message', {}, JSON.stringify(payload));
    }
  }

  // Disconnect
  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.disconnect();
      this.connected = false;
    }
  }

  // Event handlers
  handleIncomingMessage(message) {
    // Update UI with new message
    console.log('New message:', message);
  }

  handlePrivateMessage(message) {
    // Handle private message
    console.log('Private message:', message);
  }

  handleChatHistory(history) {
    // Load historical messages
    console.log('Chat history:', history);
  }

  handleUserMessage(message) {
    // Admin receives user message
    console.log('User message:', message);
  }

  // Helper methods (Updated)
  getCurrentUserId() {
    // Get current user ID from auth state
    return localStorage.getItem('userId');
  }

  getCurrentUserRole() {
    // Get current user role
    return localStorage.getItem('role'); // 'admin', 'manager', 'user'
  }

  isAdmin() {
    return localStorage.getItem('role') === 'admin';
  }

  isManager() {
    return localStorage.getItem('role') === 'manager';
  }

  isAdminOrManager() {
    const role = localStorage.getItem('role');
    return role === 'admin' || role === 'manager';
  }
}
```

### HTTP API Service

```javascript
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:8080/api';
    this.token = localStorage.getItem('accessToken');
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  // Auth headers
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // Authentication
  async login(username, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  }

  // User management
  async getAllUsers() {
    const response = await fetch(`${this.baseURL}/users/getAll`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  async getUsersPaginated(skip = 0, take = 10, sortBy = 'username', sortDir = 'asc') {
    const url = `${this.baseURL}/users/getAllPaginated?skipCount=${skip}&maxResultCount=${take}&sortBy=${sortBy}&sortDirection=${sortDir}`;
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  async createUser(userData) {
    const response = await fetch(`${this.baseURL}/users/create`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData)
    });
    return response.json();
  }

  // Chat APIs
  async getChatHistory(userId, page = 0, size = 20) {
    const url = `${this.baseURL}/chat/history/${userId}?page=${page}&size=${size}&sort=createdAt,desc`;
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  async getRecentMessages(limit = 50) {
    const response = await fetch(`${this.baseURL}/chat/recent-messages?limit=${limit}`);
    return response.json();
  }

  async adminBroadcast(message) {
    const response = await fetch(`${this.baseURL}/chat/admin/broadcast`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ message })
    });
    return response.json();
  }

  // New Admin/Manager Chat APIs
  async getAllUserMessages(page = 0, size = 20) {
    const url = `${this.baseURL}/chat/admin/user-messages?page=${page}&size=${size}`;
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  async getMessagesFromUser(userId, page = 0, size = 20) {
    const url = `${this.baseURL}/chat/admin/messages-from-user/${userId}?page=${page}&size=${size}`;
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  async getAllMessages(page = 0, size = 20) {
    const url = `${this.baseURL}/chat/admin/messages?page=${page}&size=${size}`;
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  async getActiveConversations() {
    const response = await fetch(`${this.baseURL}/chat/conversations`, {
      headers: this.getHeaders()
    });
    return response.json();
  }
}
```

---

## 🔧 Frontend Setup Checklist

### 1. Dependencies
```bash
npm install sockjs-client stompjs
# or
yarn add sockjs-client stompjs
```

### 2. Environment Variables
```env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_WS_URL=http://localhost:8080/ws
```

### 3. Authentication Flow
1. Login → Get `accessToken` and `refreshToken`
2. Store tokens in localStorage/sessionStorage
3. Include `Authorization: Bearer {token}` in all API calls
4. Use token in WebSocket connection headers
5. Handle token refresh when expired

### 4. WebSocket Connection Flow
1. Connect after successful login
2. Subscribe to relevant channels based on user role
3. Load chat history on connect
4. Handle reconnection on disconnect
5. Clean up on logout

### 5. Error Handling
- Handle 401 (Unauthorized) → Redirect to login
- Handle WebSocket connection failures
- Handle API errors gracefully

---

## 🆕 Usage Examples for New Features

### Admin/Manager Dashboard - View User Messages
```javascript
// Get all user messages (no specific receiver)
const userMessages = await apiService.getAllUserMessages(0, 20);
console.log('User messages to system:', userMessages.result.content);

// Get messages from specific user
const userId = "user-uuid-here";
const specificUserMessages = await apiService.getMessagesFromUser(userId, 0, 20);
console.log(`Messages from user ${userId}:`, specificUserMessages.result.content);
```

### React Component Example
```jsx
function AdminChatPanel() {
  const [userMessages, setUserMessages] = useState([]);
  const [isAdminOrManager, setIsAdminOrManager] = useState(false);

  useEffect(() => {
    // Check role
    const role = localStorage.getItem('role');
    setIsAdminOrManager(role === 'admin' || role === 'manager');
    
    if (isAdminOrManager) {
      loadUserMessages();
    }
  }, []);

  const loadUserMessages = async () => {
    try {
      const response = await apiService.getAllUserMessages();
      setUserMessages(response.result.content);
    } catch (error) {
      console.error('Error loading user messages:', error);
    }
  };

  return (
    <div>
      {isAdminOrManager ? (
        <div>
          <h3>User Messages to System</h3>
          {userMessages.map(msg => (
            <div key={msg.id} className="message">
              <p><strong>{msg.senderUsername}:</strong> {msg.message}</p>
              <small>{msg.createdAt} • receiverId: {msg.receiverId || 'null (system)'}</small>
            </div>
          ))}
        </div>
      ) : (
        <p>Access denied - Admin/Manager only</p>
      )}
    </div>
  );
}
```

### User Chat Component Example
```jsx
function UserChat() {
  const sendMessage = (message) => {
    // User sends message - no receiverId needed
    chatService.sendUserMessage(message);
  };

  return (
    <div>
      <input 
        type="text" 
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.target.value);
            e.target.value = '';
          }
        }}
        placeholder="Type your message to support..."
      />
    </div>
  );
}
```
- Show appropriate user messages

---

## 📝 Message Format

### ChatMessageDto Structure
```typescript
interface ChatMessageDto {
  id?: number;
  senderId: string;           // UUID
  receiverId?: string;        // UUID (null for public)
  message: string;
  senderType: 'admin' | 'user' | 'chatbot';
  createdAt: string;          // ISO 8601 format
  senderUsername?: string;    // Populated from database
  receiverUsername?: string;  // Populated from database
}
```

### UserResponse Structure
```typescript
interface UserResponse {
  id: string;                 // UUID
  username: string;
  email: string;
  roleId: number;
  roleName: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🛡️ Security Notes

1. **Always include Bearer token** in API requests
2. **Validate user roles** on frontend for UI/UX
3. **Handle token expiration** gracefully
4. **Use HTTPS in production**
5. **Sanitize user input** before sending
6. **Implement rate limiting** on frontend

---

## 🚨 Common Issues & Solutions

### WebSocket Connection Issues
- Ensure CORS is configured correctly
- Check if SockJS fallback is working
- Verify token format in headers

### Authentication Issues
- Check token expiration
- Verify header format: `Bearer {token}`
- Handle refresh token flow

### Message Delivery Issues
- Check subscription patterns
- Verify message format
- Ensure proper channel subscriptions

---

This guide covers all the APIs and WebSocket integration needed for the QM Bookstore frontend. Follow the examples and implement according to your frontend framework (React, Vue, Angular, etc.).

Happy coding! 🎉