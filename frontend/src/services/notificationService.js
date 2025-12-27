import api from './api'

/**
 * Notification Service
 * Handles all notification-related API calls
 */

export const notificationService = {
  // Get notifications with pagination and filters
  getNotifications: async (params = {}) => {
    
    const queryParams = new URLSearchParams({
      skipCount: 0,
      maxResultCount: 10,
      sortDirection: 'desc',
      ...params
    })
    
    const url = `/notifications?${queryParams}`
    
    try {
      const response = await api.get(url)
      return response
    } catch (error) {
      console.error('❌ notificationService.getNotifications error:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: url
      })
      throw error
    }
  },

  // Get notification by ID
  getNotificationById: async (id) => {
    return await api.get(`/notifications/${id}`)
  },

  // Get notifications for specific user
  getUserNotifications: async (userId, params = {}) => {    
    const queryParams = new URLSearchParams({
      skipCount: 0,
      maxResultCount: 20,
      ...params
    })
    
    const url = `/notifications/user/${userId}?${queryParams}`
    
    try {
      const response = await api.get(url)
      return response
    } catch (error) {
      console.error('❌ notificationService.getUserNotifications error:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: url
      })
      throw error
    }
  },

  // Get global notifications for admin/manager
  getGlobalNotifications: async () => {
    
    try {
      const response = await api.get('/notifications/global')
      return response
    } catch (error) {
      console.error('❌ notificationService.getGlobalNotifications error:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      throw error
    }
  },

  // Get unread notifications for user
  getUnreadNotifications: async (userId) => {
    return await api.get(`/notifications/user/${userId}/unread`)
  },

  // Get unread notifications count
  getUnreadCount: async (userId) => {
    try {
      const response = await api.get(`/notifications/user/${userId}/unread/count`)
      return response
    } catch (error) {
      console.error('❌ notificationService.getUnreadCount error:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: `/notifications/user/${userId}/unread/count`
      })
      throw error
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return await api.put(`/notifications/${notificationId}/mark-read`)
  },

  // Mark all notifications as read for user
  markAllAsRead: async (userId) => {
    return await api.put(`/notifications/user/${userId}/mark-all-read`)
  },

  // Mark all global notifications as read (Admin/Manager only)
  markAllGlobalAsRead: async () => {
    
    try {
      const response = await api.put('/notifications/global/mark-all-read')
      return response
    } catch (error) {
      console.error('❌ notificationService.markAllGlobalAsRead error:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      throw error
    }
  },

  // Update notification status
  updateNotificationStatus: async (notificationId, status) => {
    return await api.put(`/notifications/${notificationId}`, { status })
  },

  // Create new notification (Admin/Manager only)
  createNotification: async (notificationData) => {
    return await api.post('/notifications', notificationData)
  },

  // Delete notification (Admin/Manager only)
  deleteNotification: async (notificationId) => {
    return await api.delete(`/notifications/${notificationId}`)
  },

  // Helper methods for creating specific notification types
  createNewMessageNotification: async (userId, senderName, messagePreview) => {
    const params = new URLSearchParams({
      userId,
      senderName,
      messagePreview
    })
    
    return await api.post('/notifications/new-message', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },

  createOrderUpdateNotification: async (userId, orderNumber, status) => {
    const params = new URLSearchParams({
      userId,
      orderNumber,
      status
    })
    
    return await api.post('/notifications/order-update', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },

  createPaymentUpdateNotification: async (userId, paymentId, status) => {
    const params = new URLSearchParams({
      userId,
      paymentId,
      status
    })
    
    return await api.post('/notifications/payment-update', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },

  createSystemNotification: async (userId, message) => {
    const params = new URLSearchParams({
      userId,
      message
    })
    
    return await api.post('/notifications/system', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },

  createPromotionNotification: async (userId, promotionTitle, promotionLink = '') => {
    const params = new URLSearchParams({
      userId,
      promotionTitle,
      promotionLink
    })
    
    return await api.post('/notifications/promotion', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  }
}

export default notificationService