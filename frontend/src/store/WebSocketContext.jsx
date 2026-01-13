import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react'
import SockJS from 'sockjs-client'
import Stomp from 'stompjs'
import Cookies from 'js-cookie'
import { useAuth } from '../hooks/useAuth'
import { chatService } from '../services'
import { isAdminOrManager } from '../utils/adminUtils'

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
  const [notifications, setNotifications] = useState([]) // Real-time notifications
  const [readStatusCallbacks, setReadStatusCallbacks] = useState([]) // Callbacks for read status updates

  // New: Notification handler for NotificationContext integration
  const [notificationHandler, setNotificationHandler] = useState(null)

  // Debug notification handler changes
  useEffect(() => {
    // console.log('🔔 NotificationHandler changed:', notificationHandler ? 'SET' : 'NULL')
  }, [notificationHandler])

  const clientRef = useRef(null)
  const isConnectedRef = useRef(false)
  const readStatusCallbacksRef = useRef([])
  const { user } = useAuth()

  // Update refs when state changes
  useEffect(() => {
    isConnectedRef.current = isConnected
  }, [isConnected])

  useEffect(() => {
    readStatusCallbacksRef.current = readStatusCallbacks
  }, [readStatusCallbacks])

  // Register callback for read status updates
  const registerReadStatusCallback = useCallback((callback) => {
    setReadStatusCallbacks(prev => [...prev, callback])
    // Return unregister function
    return () => {
      setReadStatusCallbacks(prev => prev.filter(cb => cb !== callback))
    }
  }, [])

  // Trigger read status callbacks
  const triggerReadStatusUpdate = useCallback((messageData) => {
    readStatusCallbacksRef.current.forEach(callback => {
      try {
        callback(messageData)
      } catch (error) {
        console.error('Error in read status callback:', error)
      }
    })
  }, [])

  // Define helper functions first
  const subscribeToChannels = useCallback((stompClient) => {
    // 1. Subscribe admin broadcast messages (cho tất cả users)
    stompClient.subscribe('/topic/messages', function (message) {
      const chatMessage = JSON.parse(message.body)
      // console.log('Admin broadcast message:', chatMessage)
      setMessages(prev => [...prev, chatMessage])

      // Trigger read status update for new admin message
      if (chatMessage.senderType === 'admin') {
        triggerReadStatusUpdate({
          type: 'new_admin_message',
          senderId: chatMessage.senderId,
          messageId: chatMessage.id,
          receiverId: chatMessage.receiverId
        })
      }
    })

    // 2. Subscribe private messages
    stompClient.subscribe('/user/queue/private-messages', function (message) {
      const privateMessage = JSON.parse(message.body)
      // console.log('💬 Private message received:', privateMessage)

      // Skip auto-adding admin's own messages to avoid duplicates
      // AdminMessages component will handle its own messages via API reload
      if (user?.roleName === 'admin' && privateMessage.senderId === user.id) {
        // console.log('🚫 Skipping admin own message auto-add to prevent duplicate')
        return
      }

      setPrivateMessages(prev => {
        const newMessages = [...prev, privateMessage]
        // console.log('📝 Updated privateMessages count:', newMessages.length)
        return newMessages
      })
    })

    // 3. Subscribe chat history
    stompClient.subscribe('/user/queue/chat-history', function (message) {
      const history = JSON.parse(message.body)
      // console.log('Chat history loaded:', history)
      setChatHistory(history)
    })

    // 4. Subscribe user messages to admin (admin & manager)
    if (user?.roleName === 'admin' || user?.roleName === 'manager') {
      stompClient.subscribe('/topic/admin-messages', function (message) {
        const userMessage = JSON.parse(message.body)
        // console.log('📨 User message to admin received:', userMessage)
        setAdminMessages(prev => {
          const newMessages = [...prev, userMessage]
          // console.log('📝 Updated adminMessages count:', newMessages.length)
          return newMessages
        })

        // Trigger read status update for new user message to admin
        if (userMessage.senderType === 'user') {
          triggerReadStatusUpdate({
            type: 'new_user_message',
            senderId: userMessage.senderId,
            messageId: userMessage.id,
            receiverId: userMessage.receiverId
          })
        }
      })

      // Admin-specific notifications
      stompClient.subscribe('/topic/admin-notifications', function (message) {
        const notification = JSON.parse(message.body)
        // console.log('🔔 Admin notification received:', notification)
        setAdminNotifications(prev => [notification, ...prev])

        // Handle different notification types for chat updates
        if (notification.type === 'new_user_message') {
          // console.log('📨 Converting new_user_message notification to adminMessage for chat update')
          const adminMessage = {
            id: notification.messageId,
            senderId: notification.senderId,
            senderUsername: notification.senderUsername,
            senderType: notification.senderType,
            message: notification.message,
            createdAt: notification.timestamp,
            type: 'new_user_message'
          }
          setAdminMessages(prev => {
            const newMessages = [...prev, adminMessage]
            // console.log('📝 Updated adminMessages count from user notification:', newMessages.length)
            return newMessages
          })
        } else if (notification.type === 'conversation_update') {
          // console.log('📨 Converting conversation_update notification to privateMessage for chat update')
          const privateMessage = {
            id: notification.messageId,
            senderId: notification.senderId,
            receiverId: notification.userId, // userId is the receiver in this case
            senderUsername: notification.senderUsername,
            senderType: notification.senderType,
            message: notification.message,
            createdAt: notification.timestamp,
            type: 'conversation_update'
          }

          // Only add to privateMessages if it's not from current user (avoid self-duplicate)
          if (notification.senderId !== user.id) {
            setPrivateMessages(prev => {
              const newMessages = [...prev, privateMessage]
              // console.log('📝 Updated privateMessages count from admin notification:', newMessages.length)
              return newMessages
            })
          }
        }
      })
    }

    // console.log('🔗 Setting up WebSocket subscriptions for user:', {
    //   userId: user?.id,
    //   roleName: user?.roleName,
    //   roles: user?.roles,
    //   isAdmin: user && (user.roles?.includes('ADMIN') || user.roles?.includes('MANAGER') || 
    //                    user.roleName === 'admin' || user.roleName === 'manager')
    // });

    // 5. Subscribe user-specific private notifications
    if (user?.id) {
      // console.log('📡 Subscribing to private notifications for user:', user.id, 'role:', user.roleName || user.roles)

      stompClient.subscribe(`/user/${user.id}/queue/notifications`, function (message) {
        const notification = JSON.parse(message.body)
        // console.log('🔔 Private notification received via /user/queue:', notification)

        // Use notification handler instead of local state
        if (notificationHandler) {
          // console.log('📞 Calling notification handler for private notification')
          notificationHandler(notification)
        } else {
          // console.warn('⚠️ No notification handler available for private notification')
        }
      })

      // Subscribe to user-specific notifications channel (per documentation)
      stompClient.subscribe(`/topic/notifications/${user.id}`, function (message) {
        const notification = JSON.parse(message.body)
        // console.log('🔔 User-specific notification received via /topic:', notification)

        // Only use notification handler, don't update local WebSocket state
        if (notificationHandler) {
          // console.log('📞 Calling notification handler for user-specific notification')
          notificationHandler(notification)
        } else {
          // console.warn('⚠️ No notification handler available for user-specific notification')
        }
      })
    }

    // 5.1. Subscribe to all notifications (for admin/manager ONLY)
    if (isAdminOrManager(user)) {
      // console.log('🔐 Subscribing to global notifications for admin/manager:', user.roleName || user.roles)
      stompClient.subscribe('/topic/notifications', function (message) {
        const notification = JSON.parse(message.body)
        // console.log('🔔 Global notification received:', {
        //   id: notification.id,
        //   userId: notification.userId,
        //   type: notification.type,
        //   message: notification.message,
        //   isGlobal: notification.userId === null
        // })

        // Only use notification handler, don't update local WebSocket state
        // Let NotificationContext handle the state management
        if (notificationHandler) {
          // console.log('📞 Calling notification handler for global notification')
          notificationHandler(notification)
        } else {
          // console.warn('⚠️ No notification handler available for global notification')
        }
      })
    } else {
      // console.log('🚫 Not subscribing to global notifications - user is customer')
    }

    // Note: Comment notifications (COMMENT_REPLY and NEW_CUSTOMER_COMMENT) are now sent 
    // via the main notification channels (/topic/notifications/{userId})
    // No need for separate /queue/comment-reply or /queue/customer-comment subscriptions

    // 6. Subscribe to read status updates
    stompClient.subscribe('/topic/read-status', function (message) {
      const readStatus = JSON.parse(message.body)
      // console.log('📖 Read status update:', readStatus)

      // Trigger callbacks for components using read status
      triggerReadStatusUpdate({
        type: 'read_status_update',
        ...readStatus
      })
    })

    // 7. Subscribe to user status updates (online/offline)
    stompClient.subscribe('/topic/user-status', function (message) {
      const userStatus = JSON.parse(message.body)
      // console.log('👤 User status update:', userStatus)
      // Handle user status updates
    })

    // Note: User-specific notifications already handled in step 5 above
  }, [user, triggerReadStatusUpdate])

  const loadChatHistory = useCallback((stompClient) => {
    // Load chat history theo API guide - check if connected first
    if (stompClient && stompClient.connected) {
      stompClient.send('/app/load-history', {}, JSON.stringify({}))
    }
  }, [])

  const disconnectWebSocket = useCallback(() => {
    if (clientRef.current && clientRef.current.connected) {
      try {
        clientRef.current.disconnect()
      } catch (error) {
        console.error('Error disconnecting WebSocket:', error)
      }
    }
    setIsConnected(false)
    clientRef.current = null
  }, [])

  const connectWebSocket = useCallback(() => {
    // Tránh multiple connections
    if (clientRef.current && clientRef.current.connected) {
      // console.log('WebSocket already connected, skipping...')
      return
    }

    // Cleanup existing connection if any
    if (clientRef.current) {
      try {
        clientRef.current.disconnect()
      } catch (error) {
        console.error('Error cleaning up existing connection:', error)
      }
    }

    // Lấy token cho WebSocket authentication
    const getToken = () => {
      return Cookies.get('token') || localStorage.getItem('token')
    }

    // Tạo kết nối SockJS + STOMP theo API guide
    // Auto-detect WebSocket URL based on environment
    const getWebSocketUrl = () => {
      // Use environment variable if available
      if (import.meta.env.VITE_WS_URL) {
        return import.meta.env.VITE_WS_URL;
      }

      // Auto-detect based on current page protocol
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

      try {
        const url = new URL(apiBaseUrl);
        return `${protocol}//${url.host}/ws`;
      } catch (error) {
        console.error('Invalid API_BASE_URL:', apiBaseUrl, error);
        // Fallback to localhost
        return 'http://localhost:8080/ws';
      }
    };

    const socket = new SockJS(getWebSocketUrl());
    const stompClient = Stomp.over(socket)

    // Disable STOMP debug logs
    stompClient.debug = null

    // Connect với headers authentication
    stompClient.connect({
      'Authorization': `Bearer ${getToken()}`
    }, function (frame) {
      // console.log('WebSocket Connected: ' + frame)
      setIsConnected(true)

      // Subscribe các channels theo API guide
      subscribeToChannels(stompClient)

      // Load chat history khi connect
      loadChatHistory(stompClient)

    }, function (error) {
      console.error('STOMP Connection error:', error)
      setIsConnected(false)

      // Thử kết nối lại sau 5s (không gọi recursive)
      setTimeout(() => {
        if (!isConnectedRef.current && user) {
          // console.log('Attempting to reconnect...')
          // Trigger reconnect thông qua state thay vì gọi function
          setIsConnected(false) // This will trigger useEffect
        }
      }, 5000)
    })

    clientRef.current = stompClient
  }, [user, subscribeToChannels, loadChatHistory])

  // Create stable function references
  const connectWebSocketRef = useRef()
  const disconnectWebSocketRef = useRef()
  const previousUserIdRef = useRef(null)

  connectWebSocketRef.current = connectWebSocket
  disconnectWebSocketRef.current = disconnectWebSocket

  useEffect(() => {
    // console.log('🔄 WebSocket useEffect triggered - User changed:', {
    //   hasUser: !!user,
    //   userId: user?.id,
    //   previousUserId: previousUserIdRef.current,
    //   isConnected: isConnectedRef.current
    // })

    // Chỉ kết nối khi có user và chưa connected
    if (!user) {
      // Disconnect if user logged out
      if (clientRef.current && clientRef.current.connected) {
        // console.log('👋 User logged out, disconnecting WebSocket...')
        disconnectWebSocketRef.current()
      }
      previousUserIdRef.current = null
      return
    }

    // Check if user ID changed (new login)
    const userIdChanged = previousUserIdRef.current !== null && previousUserIdRef.current !== user.id

    if (userIdChanged) {
      // console.log('🔄 User ID changed, reconnecting WebSocket...', {
      //   from: previousUserIdRef.current,
      //   to: user.id
      // })
      // Disconnect old connection first
      if (clientRef.current && clientRef.current.connected) {
        disconnectWebSocketRef.current()
      }
    }

    // Update previous user ID
    previousUserIdRef.current = user.id

    // Only connect if not already connected or user changed
    if (!clientRef.current || !clientRef.current.connected || userIdChanged) {
      // console.log('🔌 Initiating WebSocket connection for user:', user.id)
      connectWebSocketRef.current()
    }

    // Cleanup function
    return () => {
      // Don't disconnect on every render, only when component unmounts or user logs out
      if (!user) {
        disconnectWebSocketRef.current()
      }
    }
  }, [user?.id]) // Theo dõi user.id thay vì toàn bộ user object

  // === MESSAGE SENDING METHODS ===

  // Admin gửi broadcast message
  const sendAdminBroadcast = (message) => {
    if (clientRef.current && clientRef.current.connected && isConnected && user?.roleName === 'admin') {
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
    if (clientRef.current && clientRef.current.connected && isConnected) {
      const payload = {
        senderId: user.id,
        senderUsername: user.username, // Add username for notification creation
        message: message,
        senderType: 'user'
      }
      // console.log('📤 Sending user message:', payload)
      clientRef.current.send('/app/user-message', {}, JSON.stringify(payload))
    } else {
      console.error('Cannot send user message: not connected')
    }
  }

  // Gửi private message
  const sendPrivateMessage = (receiverId, message) => {
    if (clientRef.current && clientRef.current.connected && isConnected) {
      const payload = {
        senderId: user.id,
        senderUsername: user.username, // Add username for consistency
        receiverId: receiverId,
        message: message,
        senderType: user?.roleName === 'admin' ? 'admin' : 'user'
      }

      // console.log('📤 Sending private message:', payload)
      clientRef.current.send('/app/private-message', {}, JSON.stringify(payload))
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
        // console.log(`🔗 Admin subscribing to channel: ${channelName}`)
        subscription = clientRef.current.subscribe(channelName, function (message) {
          const conversationUpdate = JSON.parse(message.body)
          // console.log(`📨 Admin received conversation update for user ${userId}:`, conversationUpdate)

          // Skip auto-adding admin's own messages to avoid duplicates
          if (conversationUpdate.senderId === user.id) {
            // console.log('🚫 Skipping admin own message auto-add to prevent duplicate')
            return
          }

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
        // console.log(`🔗 User subscribing to channel: ${channelName}`)
        subscription = clientRef.current.subscribe(channelName, function (message) {
          const conversationUpdate = JSON.parse(message.body)
          // console.log(`📨 User received conversation update:`, conversationUpdate)
          if (onMessageReceived) {
            onMessageReceived(conversationUpdate)
          } else {
            setPrivateMessages(prev => [...prev, conversationUpdate])
          }
        })
      }

      return subscription
    }
    // console.log('❌ Cannot subscribe: WebSocket not connected or user not available')
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

  const value = useMemo(() => ({
    // Connection status
    isConnected,

    // Message arrays
    messages, // Admin broadcasts
    adminMessages, // User messages to admin
    privateMessages, // Private 1-1 messages
    chatHistory, // Loaded history
    adminNotifications, // Admin notifications
    notifications, // Real-time notifications

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

    // Read status integration
    registerReadStatusCallback,

    // Notification handler management
    setNotificationHandler,

    // Connection control
    connectWebSocket,
    disconnectWebSocket,

    // STOMP client reference
    client: clientRef.current
  }), [
    // Only include state values, not functions
    isConnected,
    messages,
    adminMessages,
    privateMessages,
    chatHistory,
    adminNotifications,
    notifications,
    registerReadStatusCallback,
    connectWebSocket,
    disconnectWebSocket
  ])

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}