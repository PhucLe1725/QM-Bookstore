import React, { useState, useRef, useEffect } from 'react'
import { useWebSocket } from '../store/WebSocketContext'
import { useAuth } from '../hooks/useAuth'
import { useNotificationContext } from '../store/NotificationContext'
import { chatService } from '../services'

const AdminChat = () => {
  const { user } = useAuth()
  const { notifications } = useNotificationContext()
  const { 
    isConnected,
    sendUserMessage,
    subscribeToConversation,
    unsubscribeFromConversation,
    sendTypingIndicator,
    sendStatusUpdate
  } = useWebSocket()
  
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const conversationSubscriptionRef = useRef(null)
  
  // Load conversation and subscribe when component mounts
  useEffect(() => {
    if (user?.id) {
      loadConversation()
      
      // Subscribe to conversation updates for current user
      if (subscribeToConversation) {
        conversationSubscriptionRef.current = subscribeToConversation(user.id)
      }
    }
    
    // Cleanup subscription on unmount
    return () => {
      if (conversationSubscriptionRef.current && unsubscribeFromConversation) {
        unsubscribeFromConversation(conversationSubscriptionRef.current)
        conversationSubscriptionRef.current = null
      }
    }
  }, [user?.id, subscribeToConversation, unsubscribeFromConversation])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Listen for NEW_MESSAGE notifications and reload conversation
  useEffect(() => {
    if (!user?.id || !notifications || notifications.length === 0) return
    
    // Get the latest notification
    const latestNotification = notifications[0]
    
    // Only reload if it's a NEW_MESSAGE notification
    if (latestNotification?.type === 'NEW_MESSAGE') {
      console.log('💬 AdminChat: NEW_MESSAGE notification received, reloading conversation...')
      loadConversation()
    }
  }, [notifications])

  const loadConversation = async () => {
    if (!user?.id) return
    
    setLoading(true)
    
    try {
      // Load recent conversation messages - same as AdminMessages
      const response = await chatService.getRecentConversationMessages(user.id, 50)
      
      let conversationData = []
      if (response.success && response.result) {
        conversationData = Array.isArray(response.result) ? response.result : []
      } else if (response.data) {
        conversationData = Array.isArray(response.data) ? response.data : []
      }
      
      // Sort messages by createdAt ascending (oldest first) for proper chat display
      const sortedMessages = conversationData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      setChatHistory(sortedMessages)
      
    } catch (error) {
      console.error('Failed to load chat history:', error)
      setChatHistory([])
      
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || !isConnected || !user) return

    const messageText = message.trim()
    
    try {
      // Create message object for immediate UI update (like admin does)
      const messageToSend = {
        id: Date.now(), // temporary ID
        senderId: user.id,
        receiverId: null, // User messages to admin system
        message: messageText,
        senderType: 'user',
        createdAt: new Date().toISOString(),
        senderUsername: user.username || user.name
      }

      // Add message to UI immediately (like admin does)
      setChatHistory(prev => {
        const prevArray = Array.isArray(prev) ? prev : []
        return [...prevArray, messageToSend]
      })

      // Send message via WebSocket - use sendUserMessage for user-to-admin messages
      // This will send to /app/user-message endpoint and backend will broadcast to /topic/admin-messages
      sendUserMessage(messageText)
      
      // Clear input
      setMessage('')

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setTimeout(() => {
        setIsTyping(false)
      }, 1000)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    // Always show full date and time in standard format
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleClearChat = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat?')) {
      try {
        const response = await chatService.clearChatHistory(user.id)
        if (response.success) {
          setChatHistory([])
        } else {
          console.error('Failed to clear chat history:', response.message)
        }
      } catch (error) {
        console.error('Error clearing chat history:', error)
      }
    }
  }

  const renderMessage = (msg, index) => {
    const isUser = msg.senderType === 'user'
    const isAdmin = msg.senderType === 'admin' || msg.senderType === 'manager'
    const isFromCurrentUser = msg.senderId === user?.id
    
    return (
      <div
        key={msg.id || `${msg.createdAt}-${index}`}
        className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isFromCurrentUser
            ? 'bg-blue-600 text-white rounded-br-none' 
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}>
          {!isFromCurrentUser && (
            <div className="text-xs text-gray-600 mb-1 font-medium">
              {msg.senderUsername || (isAdmin ? 'Admin' : 'User')}
            </div>
          )}
          <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
          <div className={`text-xs mt-1 ${
            isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formatTime(msg.createdAt)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className={`px-4 py-2 text-sm ${
        isConnected 
          ? 'bg-green-50 text-green-700 border-b border-green-200' 
          : 'bg-red-50 text-red-700 border-b border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>
              {isConnected ? 'Đã kết nối - Sẵn sàng chat' : 'Đang kết nối lại...'}
            </span>
          </div>
          
          {chatHistory.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-1 hover:bg-black/10 rounded transition-colors"
              title="Xóa lịch sử chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Đang tải lịch sử chat...</span>
          </div>
        ) : chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium mb-2">Bắt đầu cuộc trò chuyện</p>
            <p className="text-sm">
              Gửi tin nhắn để được hỗ trợ trực tiếp từ admin
            </p>
          </div>
        ) : (
          chatHistory.map((msg, index) => renderMessage(msg, index))
        )}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-200 text-gray-900 rounded-lg rounded-bl-none px-4 py-2 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        {chatHistory.length > 0 && (
          <div className="mb-3 flex justify-end">
            <button
              onClick={handleClearChat}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Xóa lịch sử chat
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isConnected 
                  ? "Nhập tin nhắn..." 
                  : "Đang kết nối lại..."
              }
              disabled={!isConnected}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows="2"
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || !isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        
        <div className="mt-2 text-xs text-gray-500">
          Nhấn Enter để gửi, Shift + Enter để xuống dòng
        </div>
      </div>
    </div>
  )
}

export default AdminChat