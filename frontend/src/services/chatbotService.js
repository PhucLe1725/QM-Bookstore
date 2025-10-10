import api from './api'

export const chatbotService = {
  // Send message to chatbot API
  sendMessage: async (message, conversationId = null) => {
    try {
      const response = await api.post('/chatbot/message', {
        message,
        conversationId,
        timestamp: new Date().toISOString()
      })
      return response
    } catch (error) {
      console.error('Chatbot service error:', error)
      throw error
    }
  },

  // Get conversation history
  getConversationHistory: async (conversationId) => {
    try {
      const response = await api.get(`/chatbot/conversation/${conversationId}`)
      return response
    } catch (error) {
      console.error('Failed to get conversation history:', error)
      throw error
    }
  },

  // Start new conversation
  startConversation: async (userId = null) => {
    try {
      const response = await api.post('/chatbot/conversation/start', {
        userId,
        timestamp: new Date().toISOString()
      })
      return response
    } catch (error) {
      console.error('Failed to start conversation:', error)
      throw error
    }
  },

  // End conversation
  endConversation: async (conversationId) => {
    try {
      const response = await api.post(`/chatbot/conversation/${conversationId}/end`)
      return response
    } catch (error) {
      console.error('Failed to end conversation:', error)
      throw error
    }
  },

  // Get suggested questions/quick replies
  getSuggestedQuestions: async () => {
    try {
      const response = await api.get('/chatbot/suggestions')
      return response
    } catch (error) {
      console.error('Failed to get suggested questions:', error)
      return {
        suggestions: [
          "Tôi muốn tìm sách về kinh doanh",
          "Làm sao để đặt hàng?",
          "Chính sách đổi trả như thế nào?",
          "Có khuyến mãi gì không?",
          "Thời gian giao hàng bao lâu?"
        ]
      }
    }
  },

  // Rate conversation
  rateConversation: async (conversationId, rating, feedback = '') => {
    try {
      const response = await api.post(`/chatbot/conversation/${conversationId}/rate`, {
        rating,
        feedback,
        timestamp: new Date().toISOString()
      })
      return response
    } catch (error) {
      console.error('Failed to rate conversation:', error)
      throw error
    }
  }
}