import api from './api'

// Chat service để tích hợp với backend API
const chatService = {
  // Lấy lịch sử chat của user
  getChatHistory: async (userId, page = 0, size = 20, sort = 'createdAt,desc') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sort
      })
      const response = await api.get(`/chat/history/${userId}?${params.toString()}`)
      return response
    } catch (error) {
      console.error('Error fetching chat history:', error)
      throw error
    }
  },

  // Lấy tin nhắn công khai gần đây
  getRecentMessages: async (limit = 50) => {
    try {
      const response = await api.get(`/chat/recent-messages?limit=${limit}`)
      return response
    } catch (error) {
      console.error('Error fetching recent messages:', error)
      throw error
    }
  },

  // Lấy cuộc trò chuyện giữa 2 users (không được backend hỗ trợ)
  getConversation: async (user1Id, user2Id, page = 0, size = 20) => {
    return {
      success: false,
      message: 'Conversation endpoint not supported',
      result: []
    }
  },

  // Lấy số tin nhắn chưa đọc
  getUnreadCount: async (userId) => {
    try {
      const response = await api.get(`/chat/unread-count/${userId}`)
      return response
    } catch (error) {
      console.error('Error fetching unread count:', error)
      throw error
    }
  },

  // Lưu tin nhắn thủ công (chỉ dùng khi cần thiết, WebSocket đã tự động lưu)
  saveMessage: async (messageData) => {
    try {
      const payload = {
        message: messageData.message,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        senderType: messageData.senderType
      }
      
      const response = await api.post('/chat/message', payload)
      return response
    } catch (error) {
      console.error('Error saving message:', error)
      throw error
    }
  },

  // === ADMIN & MANAGER METHODS ===

  // Lấy tất cả tin nhắn (admin & manager)
  getAllMessages: async (page = 0, size = 20) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      })
      const response = await api.get(`/chat/admin/messages?${params.toString()}`)
      return response
    } catch (error) {
      console.error('Error fetching all messages:', error)
      throw error
    }
  },

  // Lấy tất cả tin nhắn từ user đến hệ thống (receiverId = null)
  getAllUserMessages: async (page = 0, size = 20) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      })
      const response = await api.get(`/chat/admin/user-messages?${params.toString()}`)
      return response
    } catch (error) {
      console.error('Error fetching user messages:', error)
      throw error
    }
  },

  // Lấy tin nhắn từ user cụ thể
  getMessagesFromUser: async (userId, page = 0, size = 20) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      })
      const response = await api.get(`/chat/admin/messages-from-user/${userId}?${params.toString()}`)
      return response
    } catch (error) {
      console.error('Error fetching messages from user:', error)
      throw error
    }
  },

  // Lấy cuộc trò chuyện mới nhất (admin)
  getLatestConversations: async (adminId) => {
    try {
      const response = await api.get(`/chat/admin/latest-conversations/${adminId}`)
      return response
    } catch (error) {
      console.error('Error fetching latest conversations:', error)
      throw error
    }
  },

    // Lấy cuộc trò chuyện hiện tại giữa hệ thống và user (admin/manager)
    getAdminConversationWithUser: async (userId, page = 0, size = 20) => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          size: size.toString()
        })
        const response = await api.get(`/chat/admin/conversation-with-user/${userId}?${params.toString()}`)
        return response
      } catch (error) {
        console.error('Error fetching admin conversation with user:', error)
        throw error
      }
    },

  // Gửi tin nhắn broadcast (admin only)
  sendBroadcast: async (message) => {
    try {
      const response = await api.post('/chat/admin/broadcast', { message })
      return response
    } catch (error) {
      console.error('Error sending broadcast:', error)
      throw error
    }
  },

  // Lấy các cuộc trò chuyện đang hoạt động
  getActiveConversations: async () => {
    try {
      const response = await api.get('/chat/conversations')
      return response
    } catch (error) {
      console.error('Error fetching active conversations:', error)
      throw error
    }
  },

  // Xóa lịch sử chat của user
  clearChatHistory: async (userId) => {
    try {
      const response = await api.delete(`/chat/history/${userId}`)
      return response
    } catch (error) {
      console.error('Error clearing chat history:', error)
      throw error
    }
  }
}

export default chatService