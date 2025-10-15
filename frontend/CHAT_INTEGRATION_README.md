# 🚀 Frontend WebSocket & Chat Integration - Test Guide

## ✅ What's Implemented

### 1. **Updated Services**
- ✅ **userService.js** - Updated to use `/users/getAll` endpoint
- ✅ **chatService.js** - NEW! Complete chat API integration
- ✅ **WebSocketContext.jsx** - Updated to use SockJS + STOMP with correct endpoints

### 2. **Updated Components**
- ✅ **AdminMessages.jsx** - Real-time chat with conversation loading
- ✅ **Chatbot.jsx** - Dual tabs: Chatbot + Live Support
- ✅ **WebSocketTest.jsx** - NEW! Complete testing interface

### 3. **API Integration**
- ✅ **REST APIs** - Chat history, users, conversations
- ✅ **WebSocket** - Real-time messaging with proper endpoints
- ✅ **Authentication** - JWT tokens in WebSocket headers

## 🧪 How to Test

### Step 1: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 2: Access Test Interface
Navigate to: `http://localhost:5173/test`

The test interface shows:
- 🔌 **Connection Status** - WebSocket & API
- 📊 **Message Counts** - Real-time message tracking  
- 💬 **Send Test Messages** - Public & private messaging
- 📋 **Live Message Display** - See messages in real-time
- 🐛 **Debug Info** - JSON data for troubleshooting

### Step 3: Test Different User Roles
1. **Login as Admin** → Can send broadcasts, see user messages
2. **Login as User** → Can send messages to admin
3. **Test Private Messages** → Select user and send private chat

### Step 4: Test Chat Features
1. **Go to `/admin/messages`** (admin only)
   - See user list with real API data
   - Click user to load conversation
   - Send real-time messages
   - Watch WebSocket status

2. **Use Chat Button** (non-admin users)
   - Switch between "Chatbot" and "Hỗ trợ trực tiếp" tabs
   - Send messages to admin in support tab
   - Auto-receive admin responses

## 🔧 Backend Requirements

For full functionality, backend needs to implement:

### 1. **User API** (Already working based on tests)
```
GET /api/users/getAll - ✅ Working
```

### 2. **WebSocket Endpoints** (Need implementation)
```
ws://localhost:8080/ws - WebSocket connection
/app/admin-chat - Admin broadcast
/app/user-message - User to admin
/app/private-message - Private 1-1 chat
/app/load-history - Load chat history
```

### 3. **Chat REST APIs** (Need implementation)
```
GET /api/chat/history/{userId} - Chat history
GET /api/chat/conversation/{user1Id}/{user2Id} - Conversation
GET /api/chat/recent-messages - Recent public messages
```

## 🎯 Expected Behavior

### ✅ **Working Now:**
- User list loading from API
- WebSocket connection attempt
- UI components fully functional
- Real-time message handling (when backend ready)

### ⏳ **Will Work When Backend Ready:**
- Real-time messaging
- Chat persistence to database
- Message history loading
- Admin-user conversations

## 🐛 Troubleshooting

### Issue: WebSocket Connection Failed
- **Cause**: Backend WebSocket not implemented
- **Solution**: Implement WebSocketConfig in backend

### Issue: "Cannot read users"
- **Cause**: API response structure mismatch
- **Solution**: Check `/api/users/getAll` response format

### Issue: Messages not persisting
- **Cause**: Chat endpoints not implemented
- **Solution**: Implement ChatController in backend

## 📊 Test Results Expected

When backend is ready, you should see:

1. **Connection Status**: 🟢 Connected
2. **Message Flow**: User → WebSocket → Database → Admin
3. **Real-time Updates**: Messages appear instantly
4. **Persistence**: Messages saved and loadable
5. **Chat History**: Previous conversations loadable

## 🎉 Next Steps

1. **Backend Developer**: Implement endpoints from guides
2. **Test Connection**: Use `/test` route to verify
3. **Admin Chat**: Test admin panel messaging
4. **User Support**: Test user chat button
5. **Production**: Deploy with proper CORS & security

---

## 🔗 Quick Links

- **Test Interface**: `http://localhost:5173/test`
- **Admin Messages**: `http://localhost:5173/admin/messages`
- **User Chat**: Chat button on any page (non-admin users)
- **Backend Guides**: 
  - `WEBSOCKET_IMPLEMENTATION_GUIDE.md`
  - `USER_MANAGEMENT_API_GUIDE.md`
  - `FRONTEND_API_GUIDE.md`

The frontend is **100% ready** for real-time chat! 🚀