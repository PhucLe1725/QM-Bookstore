import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import SockJS from 'sockjs-client'
import Stomp from 'stompjs'
import Cookies from 'js-cookie'
import { useAuth } from '../hooks/useAuth'
import { chatService } from '../services'

const WebSocketContext = createContext()

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState([]) // Public messages from admin
  const [adminMessages, setAdminMessages] = useState([]) // User messages to admin
  const [privateMessages, setPrivateMessages] = useState([]) // Private 1-1 messages
  const [chatHistory, setChatHistory] = useState([]) // Loaded chat history
  const [adminNotifications, setAdminNotifications] = useState([]) // Admin notifications
  const clientRef = useRef(null)
  const { user } = useAuth()

  useEffect(() => {
    // Chỉ kết nối khi có user
    if (!user) return

    connectWebSocket()

    // Cleanup function
    return () => {
      disconnectWebSocket()
    }
  }, [user])

  const connectWebSocket = () => {
    // Lấy token cho WebSocket authentication
    const getToken = () => {
      return Cookies.get('token') || localStorage.getItem('token')
    }

    // Tạo kết nối SockJS + STOMP theo API guide
    const socket = new SockJS('http://localhost:8080/ws')
    const stompClient = Stomp.over(socket)
    
    // Enable debug
    stompClient.debug = function (str) {
      console.log('STOMP: ' + str)
    }

    // Connect với headers authentication
    stompClient.connect({
      'Authorization': `Bearer ${getToken()}`
    }, function (frame) {
      console.log('WebSocket Connected: ' + frame)
      setIsConnected(true)

      // Subscribe các channels theo API guide
      subscribeToChannels(stompClient)
      
      // Load chat history khi connect
      loadChatHistory(stompClient)

    }, function (error) {
      console.error('STOMP Connection error:', error)
      setIsConnected(false)
      
      // Thử kết nối lại sau 5s
      setTimeout(() => {
        if (!isConnected) {
          console.log('Attempting to reconnect...')
          connectWebSocket()
        }
      }, 5000)
    })

    clientRef.current = stompClient
  }

  const subscribeToChannels = (stompClient) => {
    // 1. Subscribe admin broadcast messages (cho tất cả users)
    stompClient.subscribe('/topic/messages', function (message) {
      const chatMessage = JSON.parse(message.body)
      console.log('Admin broadcast message:', chatMessage)
      setMessages(prev => [...prev, chatMessage])
    })

    // 2. Subscribe private messages
    stompClient.subscribe('/user/queue/private-messages', function (message) {
      const privateMessage = JSON.parse(message.body)
      console.log('💬 Private message received:', privateMessage)
      setPrivateMessages(prev => {
        const newMessages = [...prev, privateMessage]
        console.log('📝 Updated privateMessages count:', newMessages.length)
        return newMessages
      })
    })

    // 3. Subscribe chat history
    stompClient.subscribe('/user/queue/chat-history', function (message) {
      const history = JSON.parse(message.body)
      console.log('Chat history loaded:', history)
      setChatHistory(history)
    })

    // 4. Subscribe user messages to admin (admin & manager)
    if (user?.roleName === 'admin' || user?.roleName === 'manager') {
      stompClient.subscribe('/topic/admin-messages', function (message) {
        const userMessage = JSON.parse(message.body)
        console.log('📨 User message to admin received:', userMessage)
        setAdminMessages(prev => {
          const newMessages = [...prev, userMessage]
          console.log('📝 Updated adminMessages count:', newMessages.length)
          return newMessages
        })
      })

      // 5. Subscribe admin notifications (thông báo có tin nhắn mới)
      stompClient.subscribe('/topic/admin-notifications', function (message) {
        const notification = JSON.parse(message.body)
        console.log('🔔 Admin notification received:', notification)
        // Trigger conversation reload cho admin đang xem user này
        if (notification.type === 'conversation_update') {
          setAdminNotifications(prev => [...prev, notification])
        }
      })
    }

    // 6. Subscribe to typing indicators (all users)
    stompClient.subscribe('/topic/typing-indicators', function (message) {
      const typingIndicator = JSON.parse(message.body)
      console.log('Typing indicator:', typingIndicator)
      // Handle typing indicator updates
    })

    // 7. Subscribe to user status updates (all users)
    stompClient.subscribe('/topic/user-status', function (message) {
      const statusUpdate = JSON.parse(message.body)
      console.log('User status update:', statusUpdate)
      // Handle user status updates
    })
  }

  const loadChatHistory = (stompClient) => {
    // Load chat history theo API guide
    stompClient.send('/app/load-history', {}, JSON.stringify({}))
  }

  const disconnectWebSocket = () => {
    if (clientRef.current) {
      clientRef.current.disconnect()
      setIsConnected(false)
    }
  }

  // === MESSAGE SENDING METHODS ===

  // Admin gửi broadcast message
  const sendAdminBroadcast = (message) => {
    if (clientRef.current && isConnected && user?.roleName === 'admin') {
      const payload = {
        senderId: user.id,
        message: message,
        senderType: 'admin'
      }
      clientRef.current.send('/app/admin-chat', {}, JSON.stringify(payload))
    } else {
      console.error('Cannot send admin broadcast: not connected or not admin')
    }
  }

  // User gửi message cho admin
  const sendUserMessage = (message) => {
    if (clientRef.current && isConnected) {
      const payload = {
        senderId: user.id,
        message: message,
        senderType: 'user'
      }
      clientRef.current.send('/app/user-message', {}, JSON.stringify(payload))
    } else {
      console.error('Cannot send user message: not connected')
    }
  }

  // Gửi private message
  const sendPrivateMessage = (receiverId, message) => {
    if (clientRef.current && isConnected) {
      const payload = {
        senderId: user.id,
        receiverId: receiverId,
        message: message,
        senderType: user?.roleName === 'admin' ? 'admin' : 'user'
      }
      
      console.log('📤 Sending private message:', payload)
      clientRef.current.send('/app/private-message', {}, JSON.stringify(payload))
      
      // For admin/manager messages, also add to privateMessages immediately
      // to trigger UI updates in AdminMessages component
      if (user?.roleName === 'admin' || user?.roleName === 'manager') {
        const messageForUI = {
          ...payload,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          senderUsername: user.username
        }
        console.log('➕ Adding admin message to privateMessages for UI update')
        setPrivateMessages(prev => [...prev, messageForUI])
      }
    } else {
      console.error('Cannot send private message: not connected')
    }
  }

  // Generic send method (backward compatibility)
  const sendMessage = (destination, message) => {
    if (clientRef.current && isConnected) {
      clientRef.current.send(destination, {}, JSON.stringify(message))
    } else {
      console.error('WebSocket is not connected')
    }
  }

  // Send typing indicator
  const sendTypingIndicator = (conversationUserId, isTyping) => {
    if (clientRef.current && isConnected && user) {
      const typingData = {
        userId: user.id,
        username: user.username,
        conversationUserId: conversationUserId,
        isTyping: isTyping
      }
      clientRef.current.send('/app/chat.typing', {}, JSON.stringify(typingData))
    }
  }

  // Send user status update
  const sendStatusUpdate = (status) => {
    if (clientRef.current && isConnected && user) {
      const statusData = {
        userId: user.id,
        username: user.username,
        status: status, // 'online', 'away', 'busy', 'offline'
        timestamp: new Date().toISOString()
      }
      clientRef.current.send('/app/chat.status', {}, JSON.stringify(statusData))
    }
  }

  // === HELPER METHODS ===

  // Subscribe to conversation updates for specific user
  const subscribeToConversation = (userId, onMessageReceived) => {
    if (clientRef.current && isConnected) {
      let subscription
      let channelName
      
      if (user?.roleName === 'admin' || user?.roleName === 'manager') {
        // Admin subscribes to specific user conversation
        channelName = `/topic/conversation/${userId}`
        console.log(`🔗 Admin subscribing to channel: ${channelName}`)
        subscription = clientRef.current.subscribe(channelName, function (message) {
          const conversationUpdate = JSON.parse(message.body)
          console.log(`📨 Admin received conversation update for user ${userId}:`, conversationUpdate)
          if (onMessageReceived) {
            onMessageReceived(conversationUpdate)
          } else {
            setPrivateMessages(prev => [...prev, conversationUpdate])
          }
        })
      } else {
        // Regular user subscribes to their own conversation with admin
        // Use the same channel format for consistency
        channelName = `/topic/conversation/${user.id}`
        console.log(`🔗 User subscribing to channel: ${channelName}`)
        subscription = clientRef.current.subscribe(channelName, function (message) {
          const conversationUpdate = JSON.parse(message.body)
          console.log(`📨 User received conversation update:`, conversationUpdate)
          if (onMessageReceived) {
            onMessageReceived(conversationUpdate)
          } else {
            setPrivateMessages(prev => [...prev, conversationUpdate])
          }
        })
      }
      
      return subscription
    }
    console.log('❌ Cannot subscribe: WebSocket not connected or user not available')
    return null
  }

  // Unsubscribe from conversation updates
  const unsubscribeFromConversation = (subscription) => {
    if (subscription) {
      subscription.unsubscribe()
    }
  }

  // Load conversation với specific user (cho admin)
  const loadConversationWithUser = async (userId) => {
    try {
      if (user?.roleName === 'admin' || user?.roleName === 'manager') {
        const conversation = await chatService.getAdminConversationWithUser(userId)
        return conversation.result || conversation.data || conversation
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
    return []
  }

  // Load recent public messages
  const loadRecentMessages = async () => {
    try {
      const recent = await chatService.getRecentMessages(50)
      setMessages(recent.result || recent.data || recent)
    } catch (error) {
      console.error('Error loading recent messages:', error)
    }
  }

  const value = {
    // Connection status
    isConnected,
    
    // Message arrays
    messages, // Admin broadcasts
    adminMessages, // User messages to admin
    privateMessages, // Private 1-1 messages
    chatHistory, // Loaded history
    adminNotifications, // Admin notifications
    
    // Send methods
    sendMessage, // Generic
    sendAdminBroadcast, // Admin broadcast
    sendUserMessage, // User to admin
    sendPrivateMessage, // Private message
    sendTypingIndicator, // Typing indicator
    sendStatusUpdate, // Status update
    
    // Conversation management
    subscribeToConversation,
    unsubscribeFromConversation,
    
    // Helper methods
    loadConversationWithUser,
    loadRecentMessages,
    
    // Connection control
    connectWebSocket,
    disconnectWebSocket,
    
    // STOMP client reference
    client: clientRef.current
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}