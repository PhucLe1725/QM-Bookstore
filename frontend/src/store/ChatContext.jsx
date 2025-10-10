import React, { createContext, useContext, useState, useEffect } from 'react'
import { useWebSocket } from './WebSocketContext'

const ChatContext = createContext()

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [chatMode, setChatMode] = useState('select') // 'select' | 'admin' | 'chatbot'
  const [displayMode, setDisplayMode] = useState('popup') // 'popup' | 'fullscreen'
  const [adminMessages, setAdminMessages] = useState([])
  const [chatbotMessages, setChatbotMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  
  const { isConnected, sendMessage, messages } = useWebSocket()

  // Listen for admin chat messages from WebSocket
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      
      // Filter messages for admin chat
      if (latestMessage.type === 'admin_chat' || latestMessage.chatType === 'admin') {
        setAdminMessages(prev => [...prev, {
          id: Date.now(),
          text: latestMessage.content || latestMessage.message,
          sender: 'admin',
          timestamp: new Date(latestMessage.timestamp || Date.now()),
          senderName: latestMessage.senderName || 'Admin'
        }])
      }
    }
  }, [messages])

  const openChat = () => {
    setIsOpen(true)
  }

  const closeChat = () => {
    setIsOpen(false)
    setChatMode('select')
  }

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'popup' ? 'fullscreen' : 'popup')
  }

  const selectChatMode = (mode) => {
    setChatMode(mode)
    if (mode === 'chatbot' && chatbotMessages.length === 0) {
      // Add welcome message for chatbot
      setChatbotMessages([{
        id: Date.now(),
        text: 'Xin chào! Tôi là chatbot hỗ trợ của Books Store. Tôi có thể giúp bạn tìm sách, trả lời câu hỏi về đơn hàng và nhiều thứ khác. Bạn cần hỗ trợ gì?',
        sender: 'bot',
        timestamp: new Date()
      }])
    }
  }

  const sendAdminMessage = (text) => {
    if (!isConnected) {
      console.error('WebSocket is not connected')
      return
    }

    const message = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    }

    // Add to local state immediately
    setAdminMessages(prev => [...prev, message])

    // Send via WebSocket
    sendMessage('/app/admin-chat', {
      type: 'admin_chat',
      content: text,
      timestamp: message.timestamp,
      userId: 'current_user', // Replace with actual user ID
      chatType: 'admin'
    })
  }

  const sendChatbotMessage = async (text) => {
    const userMessage = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    }

    setChatbotMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      // Simulate chatbot response (replace with actual API call)
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          text: generateChatbotResponse(text),
          sender: 'bot',
          timestamp: new Date()
        }
        setChatbotMessages(prev => [...prev, botResponse])
        setIsTyping(false)
      }, 1000 + Math.random() * 2000) // Random delay 1-3 seconds
    } catch (error) {
      console.error('Error sending chatbot message:', error)
      setIsTyping(false)
    }
  }

  const generateChatbotResponse = (userMessage) => {
    const responses = {
      greeting: [
        'Chào bạn! Tôi có thể giúp gì cho bạn hôm nay?',
        'Xin chào! Bạn đang tìm kiếm loại sách nào?',
        'Chào mừng bạn đến với Books Store! Tôi có thể hỗ trợ gì?'
      ],
      book: [
        'Chúng tôi có rất nhiều đầu sách hay. Bạn quan tâm đến thể loại nào? Văn học, khoa học, kinh doanh, hay thể loại khác?',
        'Tôi có thể giúp bạn tìm sách theo tác giả, thể loại hoặc chủ đề. Bạn có tiêu chí cụ thể nào không?',
        'Books Store có hàng ngàn đầu sách. Hãy cho tôi biết bạn đang tìm gì để tôi có thể gợi ý phù hợp!'
      ],
      order: [
        'Về đơn hàng, bạn có thể kiểm tra trạng thái trong mục "Đơn hàng của tôi" hoặc cho tôi mã đơn hàng để hỗ trợ.',
        'Tôi có thể giúp bạn tra cứu thông tin đơn hàng, thay đổi địa chỉ giao hàng hoặc hủy đơn hàng nếu cần.',
        'Đơn hàng của bạn thường được xử lý trong 24h. Bạn có vấn đề gì cần hỗ trợ không?'
      ],
      price: [
        'Giá sách trên website đã bao gồm VAT. Chúng tôi thường có các chương trình khuyến mãi hàng tuần.',
        'Bạn có thể tham khảo mức giá trên từng sản phẩm. Nhiều sách có giá ưu đãi so với giá bìa.',
        'Phí vận chuyển sẽ được tính dựa trên địa chỉ và trọng lượng đơn hàng. Đơn từ 300k được miễn phí ship.'
      ],
      default: [
        'Tôi hiểu câu hỏi của bạn. Để được hỗ trợ tốt nhất, bạn có thể liên hệ với admin hoặc gọi hotline 1900-xxxx.',
        'Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể nói rõ hơn hoặc chọn chat với Admin để được hỗ trợ trực tiếp.',
        'Cảm ơn bạn đã liên hệ. Để được hỗ trợ chính xác nhất, tôi khuyên bạn nên chat với Admin.'
      ]
    }

    const message = userMessage.toLowerCase()
    
    if (message.includes('xin chào') || message.includes('chào') || message.includes('hello')) {
      return responses.greeting[Math.floor(Math.random() * responses.greeting.length)]
    } else if (message.includes('sách') || message.includes('book') || message.includes('đọc')) {
      return responses.book[Math.floor(Math.random() * responses.book.length)]
    } else if (message.includes('đơn hàng') || message.includes('order') || message.includes('mua')) {
      return responses.order[Math.floor(Math.random() * responses.order.length)]
    } else if (message.includes('giá') || message.includes('tiền') || message.includes('cost')) {
      return responses.price[Math.floor(Math.random() * responses.price.length)]
    } else {
      return responses.default[Math.floor(Math.random() * responses.default.length)]
    }
  }

  const clearAdminChat = () => {
    setAdminMessages([])
  }

  const clearChatbotChat = () => {
    setChatbotMessages([{
      id: Date.now(),
      text: 'Xin chào! Tôi là chatbot hỗ trợ của Books Store. Tôi có thể giúp bạn tìm sách, trả lời câu hỏi về đơn hàng và nhiều thứ khác. Bạn cần hỗ trợ gì?',
      sender: 'bot',
      timestamp: new Date()
    }])
  }

  const value = {
    isOpen,
    chatMode,
    displayMode,
    adminMessages,
    chatbotMessages,
    isTyping,
    isConnected,
    openChat,
    closeChat,
    toggleDisplayMode,
    selectChatMode,
    sendAdminMessage,
    sendChatbotMessage,
    clearAdminChat,
    clearChatbotChat
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}