import React, { useState, useRef, useEffect } from 'react'
import { useChat } from '../store/ChatContext'
import { useWebSocket } from '../store/WebSocketContext'
import { useAuth } from '../hooks/useAuth'

const Chatbot = () => {
  const { user } = useAuth()
  const { 
    chatbotMessages, 
    sendChatbotMessage, 
    clearChatbotChat, 
    isTyping 
  } = useChat()
  
  const {
    isConnected,
    messages,
    sendUserMessage
  } = useWebSocket()
  
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('chatbot') // 'chatbot' | 'support'
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [chatbotMessages, messages, isTyping])

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    if (activeTab === 'chatbot') {
      sendChatbotMessage(message.trim())
    } else if (activeTab === 'support') {
      // Send message to admin via WebSocket
      if (isConnected) {
        sendUserMessage(message.trim())
      } else {
        console.error('WebSocket not connected')
      }
    }
    
    setMessage('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleQuickReply = (text) => {
    if (activeTab === 'chatbot') {
      sendChatbotMessage(text)
    } else if (activeTab === 'support') {
      if (isConnected) {
        sendUserMessage(text)
      }
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const quickReplies = [
    "Tôi muốn tìm sách về kinh doanh",
    "Làm sao để đặt hàng?",
    "Chính sách đổi trả như thế nào?",
    "Có khuyến mãi gì không?",
    "Thời gian giao hàng bao lâu?"
  ]

  const renderMessage = (msg, index) => {
    const isUser = msg.sender === 'user'
    
    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-600 text-white rounded-br-none' 
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}>
          <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
          <div className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formatTime(msg.timestamp)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('chatbot')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chatbot'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🤖 Chatbot
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'support'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👨‍💼 Hỗ trợ trực tiếp
          </button>
        </div>
      </div>

      {/* Status Info */}
      <div className={`px-4 py-2 border-b ${
        activeTab === 'chatbot' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            activeTab === 'chatbot' ? 'bg-green-500' : (isConnected ? 'bg-blue-500' : 'bg-red-500')
          }`}></div>
          <span className={`text-sm ${
            activeTab === 'chatbot' ? 'text-green-700' : 'text-blue-700'
          }`}>
            {activeTab === 'chatbot' 
              ? 'Chatbot đang hoạt động - Phản hồi tự động'
              : isConnected 
                ? 'Đã kết nối - Hỗ trợ trực tiếp'
                : 'Mất kết nối - Đang thử kết nối lại...'
            }
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {activeTab === 'chatbot' ? (
          // Chatbot Messages
          <>
            {chatbotMessages.map((msg, index) => renderMessage(msg, index))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-200 text-gray-900 rounded-lg rounded-bl-none px-4 py-2 max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs text-gray-600">Bot đang trả lời...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Support Messages (from WebSocket)
          <>
            {messages.map((msg, index) => {
              const isFromAdmin = msg.senderType === 'admin'
              const isFromUser = msg.senderId === user?.id
              
              return (
                <div
                  key={msg.id || index}
                  className={`flex ${isFromAdmin ? 'justify-start' : 'justify-end'} mb-4`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isFromAdmin 
                      ? 'bg-gray-200 text-gray-900 rounded-bl-none' 
                      : 'bg-blue-600 text-white rounded-br-none'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                    <div className={`text-xs mt-1 ${
                      isFromAdmin ? 'text-gray-500' : 'text-blue-100'
                    }`}>
                      {formatTime(msg.createdAt || new Date().toISOString())}
                      {isFromAdmin && <span className="ml-2">👨‍💼 Admin</span>}
                    </div>
                  </div>
                </div>
              )
            })}
            
            {!isConnected && (
              <div className="text-center text-gray-500 text-sm">
                <p>⚠️ Mất kết nối với server</p>
                <p>Đang thử kết nối lại...</p>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {((activeTab === 'chatbot' && chatbotMessages.length <= 1 && !isTyping) ||
        (activeTab === 'support' && messages.length === 0)) && (
        <div className="border-t border-gray-200 p-4">
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">
              {activeTab === 'chatbot' ? 'Câu hỏi thường gặp:' : 'Các câu hỏi mẫu:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                  disabled={activeTab === 'support' && !isConnected}
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        {chatbotMessages.length > 1 && (
          <div className="mb-3 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              💡 Tip: Bạn có thể hỏi về sách, đơn hàng, giá cả, chính sách...
            </div>
            <button
              onClick={clearChatbotChat}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Bắt đầu lại
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
                activeTab === 'chatbot' 
                  ? "Hỏi gì đó về Văn phòng phẩm Quang Minh..." 
                  : isConnected 
                    ? "Nhập tin nhắn cho admin..."
                    : "Chưa kết nối..."
              }
              disabled={isTyping || (activeTab === 'support' && !isConnected)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows="2"
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || isTyping || (activeTab === 'support' && !isConnected)}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
              activeTab === 'chatbot' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
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

export default Chatbot