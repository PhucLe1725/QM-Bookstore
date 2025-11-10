# Frontend Chat API Integration Guide

## 📋 Overview
Hướng dẫn tích hợp API Chat cho Frontend với các tính năng:
- Lấy tin nhắn mới nhất (không phân trang cứng)
- WebSocket real-time chat
- Quản lý trạng thái đọc tin nhắn
- Authentication với JWT

## 🔧 Base Configuration

### API Base URL
```javascript
const API_BASE_URL = 'http://localhost:8080/api/chat';
const WS_URL = 'http://localhost:8080/ws';
```

### Headers Template
```javascript
const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});
```

## 📡 Chat API Methods

### 1. Load Recent Messages (Recommended)
```javascript
/**
 * Lấy tin nhắn gần đây - sử dụng cho initial load
 * @param {number} limit - Số lượng tin nhắn (default: 50)
 * @param {number} page - Trang (default: 0) 
 * @param {string} token - JWT token
 */
async function loadRecentMessages(limit = 50, page = 0, token) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/recent-messages?limit=${limit}&page=${page}`,
      {
        method: 'GET',
        headers: getHeaders(token)
      }
    );
    
    const data = await response.json();
    
    if (data.code === 1000) {
      return data.result; // Array<ChatMessageDto>
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error loading recent messages:', error);
    throw error;
  }
}

// Usage
const messages = await loadRecentMessages(100, 0, userToken);
console.log('Recent messages:', messages);
```

### 2. Load All Messages (No Pagination)
```javascript
/**
 * Lấy tất cả tin nhắn không phân trang - cho trường hợp cần load full
 * @param {number} limit - Giới hạn số tin nhắn (default: 100)
 * @param {string} token - JWT token
 */
async function loadAllMessages(limit = 100, token) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/all-messages?limit=${limit}`,
      {
        method: 'GET', 
        headers: getHeaders(token)
      }
    );
    
    const data = await response.json();
    return data.code === 1000 ? data.result : [];
  } catch (error) {
    console.error('Error loading all messages:', error);
    return [];
  }
}
```

### 3. Send Message via REST API
```javascript
/**
 * Gửi tin nhắn qua REST API (fallback khi WebSocket không khả dụng)
 * @param {Object} messageData - Dữ liệu tin nhắn
 * @param {string} token - JWT token
 */
async function sendMessage(messageData, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/message`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({
        senderId: messageData.senderId,
        receiverId: messageData.receiverId, // Optional for user messages
        message: messageData.message,
        senderType: messageData.senderType // "user" | "admin" | "manager"
      })
    });
    
    const data = await response.json();
    
    if (data.code === 1000) {
      return data.result; // Saved ChatMessageDto
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Usage
const sentMessage = await sendMessage({
  senderId: currentUser.id,
  message: "Hello!",
  senderType: "user"
}, userToken);
```

### 4. Admin APIs
```javascript
/**
 * Admin: Lấy tất cả tin nhắn với phân trang
 */
async function getAdminMessages(page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc', token) {
  const response = await fetch(
    `${API_BASE_URL}/admin/messages?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`,
    { headers: getHeaders(token) }
  );
  
  const data = await response.json();
  return data.code === 1000 ? data.result : null; // Page<ChatMessageDto>
}

/**
 * Admin: Đánh dấu tin nhắn đã đọc
 */
async function markAsReadByAdmin(userId, token) {
  const response = await fetch(`${API_BASE_URL}/admin/mark-read/user/${userId}`, {
    method: 'PUT',
    headers: getHeaders(token)
  });
  
  const data = await response.json();
  return data.result; // ReadStatusResponse
}
```

## 🔄 WebSocket Integration

### 1. WebSocket Setup
```javascript
// Using SockJS + STOMP
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class ChatWebSocket {
  constructor(token) {
    this.token = token;
    this.stompClient = null;
    this.connected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const socket = new SockJS(WS_URL);
      this.stompClient = Stomp.over(socket);
      
      // Optional: Add auth headers
      const headers = {
        'Authorization': `Bearer ${this.token}`
      };

      this.stompClient.connect(headers, 
        (frame) => {
          console.log('Connected to WebSocket:', frame);
          this.connected = true;
          this.subscribeToMessages();
          resolve();
        },
        (error) => {
          console.error('WebSocket connection error:', error);
          this.connected = false;
          reject(error);
        }
      );
    });
  }

  subscribeToMessages() {
    // Subscribe to public messages
    this.stompClient.subscribe('/topic/messages', (message) => {
      const chatMessage = JSON.parse(message.body);
      this.onMessageReceived(chatMessage);
    });

    // Subscribe to private chat history
    this.stompClient.subscribe('/user/queue/chat-history', (message) => {
      const history = JSON.parse(message.body);
      this.onHistoryReceived(history);
    });
  }

  sendUserMessage(message, senderId) {
    if (!this.connected) {
      throw new Error('WebSocket not connected');
    }

    this.stompClient.send('/app/user-message', {}, JSON.stringify({
      senderId: senderId,
      message: message,
      senderType: 'user'
    }));
  }

  sendAdminMessage(message, senderId, receiverId = null) {
    if (!this.connected) {
      throw new Error('WebSocket not connected');
    }

    this.stompClient.send('/app/admin-chat', {}, JSON.stringify({
      senderId: senderId,
      receiverId: receiverId,
      message: message,
      senderType: 'admin'
    }));
  }

  sendPrivateMessage(message, senderId, receiverId) {
    if (!this.connected) {
      throw new Error('WebSocket not connected');
    }

    this.stompClient.send('/app/private-message', {}, JSON.stringify({
      senderId: senderId,
      receiverId: receiverId,
      message: message,
      senderType: 'user'
    }));
  }

  loadHistory() {
    if (!this.connected) {
      throw new Error('WebSocket not connected');
    }

    this.stompClient.send('/app/load-history', {}, JSON.stringify({}));
  }

  // Callback methods - override in implementation
  onMessageReceived(message) {
    console.log('New message received:', message);
  }

  onHistoryReceived(history) {
    console.log('Chat history received:', history);
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.disconnect();
      this.connected = false;
    }
  }
}
```

### 2. WebSocket Usage Example
```javascript
// Initialize WebSocket
const chatWS = new ChatWebSocket(userToken);

// Override callbacks
chatWS.onMessageReceived = (message) => {
  // Add message to UI
  addMessageToChat(message);
  
  // Mark as read if needed
  if (message.senderType === 'admin' && currentUser.role === 'user') {
    markAsReadByUser(message.id);
  }
};

chatWS.onHistoryReceived = (history) => {
  // Display chat history
  displayChatHistory(history);
};

// Connect and use
await chatWS.connect();

// Send message
chatWS.sendUserMessage('Hello from WebSocket!', currentUser.id);

// Load history
chatWS.loadHistory();
```

## 🎯 Complete Chat Implementation

### React Hook Example
```javascript
import { useState, useEffect, useCallback } from 'react';

export const useChat = (userToken, userId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatWS, setChatWS] = useState(null);
  const [connected, setConnected] = useState(false);

  // Initialize chat
  useEffect(() => {
    initializeChat();
    return () => {
      if (chatWS) {
        chatWS.disconnect();
      }
    };
  }, [userToken]);

  const initializeChat = async () => {
    setLoading(true);
    
    try {
      // 1. Load recent messages via REST API
      const recentMessages = await loadRecentMessages(100, 0, userToken);
      setMessages(recentMessages);

      // 2. Initialize WebSocket
      const ws = new ChatWebSocket(userToken);
      
      ws.onMessageReceived = (message) => {
        setMessages(prev => [message, ...prev]);
      };

      ws.onHistoryReceived = (history) => {
        setMessages(history);
      };

      await ws.connect();
      setChatWS(ws);
      setConnected(true);

    } catch (error) {
      console.error('Failed to initialize chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = useCallback(async (messageText) => {
    if (!messageText.trim()) return;

    try {
      if (connected && chatWS) {
        // Send via WebSocket (real-time)
        chatWS.sendUserMessage(messageText, userId);
      } else {
        // Fallback to REST API
        const sentMessage = await sendMessage({
          senderId: userId,
          message: messageText,
          senderType: 'user'
        }, userToken);
        
        setMessages(prev => [sentMessage, ...prev]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [connected, chatWS, userId, userToken]);

  const loadMoreMessages = useCallback(async (page) => {
    try {
      const olderMessages = await loadRecentMessages(20, page, userToken);
      setMessages(prev => [...prev, ...olderMessages]);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  }, [userToken]);

  return {
    messages,
    loading,
    connected,
    sendMessage,
    loadMoreMessages,
    refreshMessages: () => loadRecentMessages(100, 0, userToken).then(setMessages)
  };
};
```

### Vue.js Composable Example
```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export function useChat(userToken, userId) {
  const messages = ref([]);
  const loading = ref(false);
  const connected = ref(false);
  let chatWS = null;

  const initializeChat = async () => {
    loading.value = true;
    
    try {
      // Load recent messages
      const recentMessages = await loadRecentMessages(100, 0, userToken.value);
      messages.value = recentMessages;

      // Setup WebSocket
      chatWS = new ChatWebSocket(userToken.value);
      
      chatWS.onMessageReceived = (message) => {
        messages.value.unshift(message);
      };

      await chatWS.connect();
      connected.value = true;

    } catch (error) {
      console.error('Chat initialization failed:', error);
    } finally {
      loading.value = false;
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    try {
      if (connected.value && chatWS) {
        chatWS.sendUserMessage(messageText, userId.value);
      } else {
        // REST API fallback
        const sentMessage = await sendMessage({
          senderId: userId.value,
          message: messageText,
          senderType: 'user'
        }, userToken.value);
        
        messages.value.unshift(sentMessage);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  onMounted(() => {
    if (userToken.value) {
      initializeChat();
    }
  });

  onUnmounted(() => {
    if (chatWS) {
      chatWS.disconnect();
    }
  });

  return {
    messages,
    loading,
    connected,
    sendMessage
  };
}
```

## 🚀 Best Practices

### 1. Error Handling
```javascript
const withErrorHandling = async (apiCall, fallback = null) => {
  try {
    return await apiCall();
  } catch (error) {
    console.error('API Error:', error);
    
    // Show user-friendly message
    showNotification('Có lỗi xảy ra khi gửi tin nhắn', 'error');
    
    return fallback;
  }
};
```

### 2. Connection Retry
```javascript
class RobustChatWebSocket extends ChatWebSocket {
  constructor(token, maxRetries = 3) {
    super(token);
    this.maxRetries = maxRetries;
    this.retryCount = 0;
  }

  async connect() {
    try {
      await super.connect();
      this.retryCount = 0;
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying connection... (${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.connect(), 2000 * this.retryCount);
      } else {
        throw error;
      }
    }
  }
}
```

### 3. Message Status Tracking
```javascript
const MessageStatus = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

// Add status to messages for better UX
const sendMessageWithStatus = async (messageText) => {
  const tempMessage = {
    id: Date.now(), // Temporary ID
    message: messageText,
    status: MessageStatus.SENDING,
    senderId: userId,
    senderType: 'user',
    createdAt: new Date().toISOString()
  };

  // Add to UI immediately
  setMessages(prev => [tempMessage, ...prev]);

  try {
    const sentMessage = await sendMessage(messageData, token);
    
    // Update with real message
    setMessages(prev => 
      prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...sentMessage, status: MessageStatus.SENT }
          : msg
      )
    );
  } catch (error) {
    // Mark as failed
    setMessages(prev => 
      prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, status: MessageStatus.FAILED }
          : msg
      )
    );
  }
};
```

## 📝 TypeScript Definitions

```typescript
interface ChatMessageDto {
  id?: number;
  senderId: string;
  receiverId?: string;
  message: string;
  senderType: 'user' | 'admin' | 'manager' | 'chatbot';
  createdAt?: string;
  isReadByAdmin?: boolean;
  isReadByUser?: boolean;
  senderUsername?: string;
  receiverUsername?: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

interface ReadStatusResponse {
  success: boolean;
  markedCount: number;
  message: string;
}

interface ChatPageData {
  content: ChatMessageDto[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}
```

## 🔍 Testing

```javascript
// Test API connectivity
const testChatAPI = async (token) => {
  try {
    console.log('Testing Chat API...');
    
    // Test recent messages
    const messages = await loadRecentMessages(5, 0, token);
    console.log('✓ Recent messages API working:', messages.length);

    // Test send message
    const testMessage = await sendMessage({
      senderId: 'test-user-id',
      message: 'Test message',
      senderType: 'user'
    }, token);
    console.log('✓ Send message API working:', testMessage.id);

    console.log('🎉 All Chat APIs working!');
  } catch (error) {
    console.error('❌ Chat API test failed:', error);
  }
};
```

---

## 📞 Support

Nếu gặp vấn đề khi tích hợp, kiểm tra:
1. **JWT Token** có hợp lệ và chưa expire
2. **CORS settings** cho phép domain frontend
3. **WebSocket connection** có thể bị block bởi firewall
4. **API Response format** theo đúng structure
5. **Network connectivity** tới backend server

**API Endpoints Summary:**
- `GET /api/chat/recent-messages` - Tin nhắn gần đây
- `GET /api/chat/all-messages` - Tất cả tin nhắn  
- `POST /api/chat/message` - Gửi tin nhắn
- `WebSocket /ws` - Real-time chat
- `PUT /api/chat/admin/mark-read/user/{userId}` - Mark as read

Happy coding! 🚀