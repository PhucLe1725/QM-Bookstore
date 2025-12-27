import api from './api'

class ChatReadStatusService {
  // Admin APIs
  
  /**
   * Admin đánh dấu tin nhắn từ user đã đọc
   * @param {string} userId - UUID của user
   * @returns {Promise<Object>} ReadStatusResponse
   */
  async markAsReadByAdminForUser(userId) {
    try {
      const response = await api.put(`/chat/admin/mark-read/user/${userId}`)
      return response.data
    } catch (error) {
      console.error('❌ API Error marking messages as read by admin for user:', error)
      console.error('❌ Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      })
      throw error
    }
  }

  /**
   * Đánh dấu tin nhắn đã đọc theo MarkMessagesReadRequest DTO
   * @param {string} userId - UUID của user
   * @param {Array<number>} messageIds - Optional: specific message IDs to mark as read
   * @param {boolean} markAllFromUser - Mark all messages from this user as read
   * @returns {Promise<Object>} ReadStatusResponse
   */
  async markMessagesRead(userId, messageIds = null, markAllFromUser = false) {
    try {
      const payload = {
        userId: userId,
        messageIds: messageIds,
        markAllFromUser: markAllFromUser
      }
      
      const response = await api.put('/chat/mark-read', payload)
      return response.data
    } catch (error) {
      console.error('❌ API Error marking messages as read:', error)
      console.error('❌ Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText, 
        data: error.response?.data,
        url: error.config?.url
      })
      
      // If new API fails, fallback to old API
      if (markAllFromUser) {
        try {
          const fallbackResponse = await api.put(`/chat/admin/mark-read/user/${userId}`)
          return fallbackResponse.data
        } catch (fallbackError) {
          console.error('❌ Fallback API also failed:', fallbackError)
        }
      }
      
      throw error
    }
  }

  /**
   * Đánh dấu tin nhắn cụ thể đã đọc bởi admin
   * @param {number} messageId - ID của tin nhắn
   * @returns {Promise<Object>} ReadStatusResponse
   */
  async markMessageAsReadByAdmin(messageId) {
    try {
      const response = await api.put(`/chat/admin/mark-read/message/${messageId}`)
      return response.data
    } catch (error) {
      console.error('Error marking message as read by admin:', error)
      throw error
    }
  }

  /**
   * Lấy số tin nhắn chưa đọc bởi admin từ user
   * @param {string} userId - UUID của user
   * @returns {Promise<number>} Số tin nhắn chưa đọc
   */
  async getUnreadCountByAdminFromUser(userId) {
    try {
      const response = await api.get(`/chat/admin/unread-count/user/${userId}`)
      return response.data.result || 0
    } catch (error) {
      console.error('Error getting unread count by admin from user:', error)
      return 0
    }
  }

  /**
   * Lấy tổng số tin nhắn chưa đọc bởi admin
   * @returns {Promise<number>} Tổng số tin nhắn chưa đọc
   */
  async getTotalUnreadCountByAdmin() {
    try {
      const response = await api.get('/chat/admin/total-unread-count')
      return response.data.result || 0
    } catch (error) {
      console.error('Error getting total unread count by admin:', error)
      return 0
    }
  }

  /**
   * Lấy danh sách users có tin nhắn chưa đọc
   * @returns {Promise<string[]>} Array của user IDs
   */
  async getUsersWithUnreadMessages() {
    try {
      const response = await api.get('/chat/admin/users-with-unread')
      return response.data.result || []
    } catch (error) {
      console.error('Error getting users with unread messages:', error)
      return []
    }
  }

  /**
   * Lấy tin nhắn chưa đọc bởi admin (có phân trang)
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<Object>} Paginated response
   */
  async getUnreadMessagesByAdmin(params = {}) {
    try {
      const { page = 0, size = 20, sort } = params
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...(sort && { sort })
      })
      
      const response = await api.get(`/chat/admin/unread-messages?${queryParams}`)
      return response.data.result
    } catch (error) {
      console.error('Error getting unread messages by admin:', error)
      throw error
    }
  }

  // User APIs

  /**
   * User đánh dấu tin nhắn từ admin đã đọc
   * @param {string} userId - UUID của user
   * @returns {Promise<Object>} ReadStatusResponse
   */
  async markAsReadByUserFromAdmin(userId) {
    try {
      const response = await api.put(`/chat/user/${userId}/mark-read-from-admin`)
      return response.data
    } catch (error) {
      console.error('Error marking messages as read by user from admin:', error)
      throw error
    }
  }

  /**
   * Đánh dấu tin nhắn cụ thể đã đọc bởi user
   * @param {number} messageId - ID của tin nhắn
   * @returns {Promise<Object>} ReadStatusResponse
   */
  async markMessageAsReadByUser(messageId) {
    try {
      const response = await api.put(`/chat/user/mark-read/message/${messageId}`)
      return response.data
    } catch (error) {
      console.error('Error marking message as read by user:', error)
      throw error
    }
  }

  /**
   * Lấy số tin nhắn chưa đọc bởi user từ admin
   * @param {string} userId - UUID của user
   * @returns {Promise<number>} Số tin nhắn chưa đọc
   */
  async getUnreadCountByUserFromAdmin(userId) {
    try {
      const response = await api.get(`/chat/user/${userId}/unread-count-from-admin`)
      return response.data.result || 0
    } catch (error) {
      console.error('Error getting unread count by user from admin:', error)
      return 0
    }
  }

  /**
   * Lấy tin nhắn chưa đọc bởi user từ admin
   * @param {string} userId - UUID của user
   * @returns {Promise<Array>} Array of unread messages
   */
  async getUnreadMessagesByUser(userId) {
    try {
      const response = await api.get(`/chat/user/${userId}/unread-messages`)
      return response.data.result || []
    } catch (error) {
      console.error('Error getting unread messages by user:', error)
      return []
    }
  }

  // General API

  /**
   * Đánh dấu multiple messages đã đọc
   * @param {Object} request - MarkMessagesReadRequest
   * @returns {Promise<Object>} ReadStatusResponse
   */
  async markMultipleMessagesAsRead(request) {
    try {
      const response = await api.put('/chat/mark-read', request)
      return response.data
    } catch (error) {
      console.error('Error marking multiple messages as read:', error)
      throw error
    }
  }
}

export default new ChatReadStatusService()