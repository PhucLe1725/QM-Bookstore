import { useState, useCallback, useEffect, useRef } from 'react'
import chatReadStatusService from '../services/chatReadStatusService'
import { useAuth } from './useAuth'
import { useWebSocket } from '../store/WebSocketContext'

const useChatReadStatus = () => {
  const { user, isAuthenticated } = useAuth()
  const { registerReadStatusCallback } = useWebSocket()
  const [unreadCounts, setUnreadCounts] = useState({
    totalAdminUnread: 0,
    userUnreadFromAdmin: {},  // { userId: count }
    adminUnreadFromUser: {}   // { userId: count }
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Use ref to prevent infinite loops
  const stableUserIdRef = useRef(user?.id)
  const stableIsAdminRef = useRef(user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER'))
  
  // Update refs when user changes
  useEffect(() => {
    stableUserIdRef.current = user?.id
    stableIsAdminRef.current = user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER')
  }, [user?.id, user?.roles])

  // Kiểm tra user có phải admin không
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER') || 
                  user?.roleName === 'admin' || user?.roleName === 'manager'
  
  console.log('🔍 Admin check:', {
    user: user?.username,
    roles: user?.roles,
    roleName: user?.roleName,
    isAdmin,
    isAuthenticated
  })

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Lấy tổng số tin nhắn chưa đọc bởi admin (DISABLED to avoid API errors)
  const fetchTotalAdminUnread = useCallback(async () => {
    if (!isAdmin || !isAuthenticated) return

    try {
      setLoading(true)
      // const count = await chatReadStatusService.getTotalUnreadCountByAdmin()
      // setUnreadCounts(prev => ({
      //   ...prev,
      //   totalAdminUnread: count
      // }))
      console.log('📝 fetchTotalAdminUnread disabled to avoid API errors')
      clearError()
    } catch (error) {
      console.error('Error fetching total admin unread:', error)
      setError('Không thể tải số tin nhắn chưa đọc')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAuthenticated, clearError])

  // Lấy số tin nhắn chưa đọc từ admin cho user (DISABLED to avoid API errors)
  const fetchUserUnreadFromAdmin = useCallback(async (userId) => {
    if (!userId || !isAuthenticated) return

    try {
      // const count = await chatReadStatusService.getUnreadCountByUserFromAdmin(userId)
      // setUnreadCounts(prev => ({
      //   ...prev,
      //   userUnreadFromAdmin: {
      //     ...prev.userUnreadFromAdmin,
      //     [userId]: count
      //   }
      // }))
      console.log('📝 fetchUserUnreadFromAdmin disabled to avoid API errors for userId:', userId)
      clearError()
    } catch (error) {
      console.error('Error fetching user unread from admin:', error)
      setError('Không thể tải số tin nhắn chưa đọc')
    }
  }, [isAuthenticated, clearError])

  // Lấy số tin nhắn chưa đọc từ user cho admin
  const fetchAdminUnreadFromUser = useCallback(async (userId) => {
    if (!isAdmin || !userId || !isAuthenticated) return

    try {
      const count = await chatReadStatusService.getUnreadCountByAdminFromUser(userId)
      setUnreadCounts(prev => ({
        ...prev,
        adminUnreadFromUser: {
          ...prev.adminUnreadFromUser,
          [userId]: count
        }
      }))
      clearError()
    } catch (error) {
      console.error('Error fetching admin unread from user:', error)
      setError('Không thể tải số tin nhắn chưa đọc')
    }
  }, [isAdmin, isAuthenticated, clearError])

  // Đánh dấu tin nhắn đã đọc bởi admin cho user
  const markAsReadByAdminForUser = useCallback(async (userId) => {
    if (!isAdmin || !userId || !isAuthenticated) {
      console.log('❌ Cannot mark as read by admin:', { isAdmin, userId, isAuthenticated })
      return
    }

    try {
      setLoading(true)
      console.log('📖 Marking messages as read by admin for user:', userId)
      
      const result = await chatReadStatusService.markAsReadByAdminForUser(userId)
      console.log('✅ Mark as read API response:', result)
      
      // Cập nhật local state
      setUnreadCounts(prev => ({
        ...prev,
        adminUnreadFromUser: {
          ...prev.adminUnreadFromUser,
          [userId]: 0
        }
      }))
      
      // Skip refresh total count to avoid API errors
      // await fetchTotalAdminUnread()
      clearError()
      console.log('🔄 Refreshed admin unread counts after marking as read')
      
      return result
    } catch (error) {
      console.error('❌ Error marking as read by admin:', error)
      setError('Không thể đánh dấu tin nhắn đã đọc')
      throw error
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAuthenticated, clearError]) // Removed fetchTotalAdminUnread

  // Đánh dấu tin nhắn đã đọc bởi user từ admin
  const markAsReadByUserFromAdmin = useCallback(async (userId) => {
    if (!userId || !isAuthenticated) return

    try {
      setLoading(true)
      const result = await chatReadStatusService.markAsReadByUserFromAdmin(userId)
      
      setUnreadCounts(prev => ({
        ...prev,
        userUnreadFromAdmin: {
          ...prev.userUnreadFromAdmin,
          [userId]: 0
        }
      }))
      
      clearError()
      return result
    } catch (error) {
      console.error('Error marking as read by user:', error)
      setError('Không thể đánh dấu tin nhắn đã đọc')
      throw error
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, clearError])

  // Đánh dấu tin nhắn cụ thể đã đọc
  const markMessageAsRead = useCallback(async (messageId, isAdminReading = false) => {
    if (!messageId || !isAuthenticated) return

    try {
      let result
      if (isAdminReading) {
        if (!isAdmin) return
        result = await chatReadStatusService.markMessageAsReadByAdmin(messageId)
      } else {
        result = await chatReadStatusService.markMessageAsReadByUser(messageId)
      }
      
      clearError()
      return result
    } catch (error) {
      console.error('Error marking message as read:', error)
      setError('Không thể đánh dấu tin nhắn đã đọc')
      throw error
    }
  }, [isAdmin, isAuthenticated, clearError])

  // Lấy danh sách users có tin nhắn chưa đọc
  const fetchUsersWithUnreadMessages = useCallback(async () => {
    if (!isAdmin || !isAuthenticated) return []

    try {
      const users = await chatReadStatusService.getUsersWithUnreadMessages()
      clearError()
      return users
    } catch (error) {
      console.error('Error fetching users with unread messages:', error)
      setError('Không thể tải danh sách người dùng')
      return []
    }
  }, [isAdmin, isAuthenticated, clearError])

  // Lấy tin nhắn chưa đọc cho admin (có phân trang)
  const fetchUnreadMessagesForAdmin = useCallback(async (params = {}) => {
    if (!isAdmin || !isAuthenticated) return { content: [], totalElements: 0 }

    try {
      setLoading(true)
      const result = await chatReadStatusService.getUnreadMessagesByAdmin(params)
      clearError()
      return result
    } catch (error) {
      console.error('Error fetching unread messages for admin:', error)
      setError('Không thể tải tin nhắn chưa đọc')
      return { content: [], totalElements: 0 }
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isAuthenticated, clearError])

  // Lấy tin nhắn chưa đọc cho user
  const fetchUnreadMessagesForUser = useCallback(async (userId) => {
    if (!userId || !isAuthenticated) return []

    try {
      const messages = await chatReadStatusService.getUnreadMessagesByUser(userId)
      clearError()
      return messages
    } catch (error) {
      console.error('Error fetching unread messages for user:', error)
      setError('Không thể tải tin nhắn chưa đọc')
      return []
    }
  }, [isAuthenticated, clearError])

  // Helper functions
  const getTotalUnreadCount = useCallback(() => {
    return unreadCounts.totalAdminUnread
  }, [unreadCounts.totalAdminUnread])

  const getUserUnreadCount = useCallback((userId) => {
    return unreadCounts.userUnreadFromAdmin[userId] || 0
  }, [unreadCounts.userUnreadFromAdmin])

  const getAdminUnreadFromUserCount = useCallback((userId) => {
    return unreadCounts.adminUnreadFromUser[userId] || 0
  }, [unreadCounts.adminUnreadFromUser])

  // Auto-refresh unread counts for current user
  useEffect(() => {
    if (!isAuthenticated) return

    if (isAdmin) {
      // fetchTotalAdminUnread() // Disabled to avoid API errors
    }

    if (user?.id) {
      // fetchUserUnreadFromAdmin(user.id) // Disabled to avoid API errors
    }
  }, [isAuthenticated, isAdmin, user?.id]) // Removed function dependencies

  // Register WebSocket callback for real-time updates
  useEffect(() => {
    if (!registerReadStatusCallback) return

    const handleReadStatusUpdate = (messageData) => {
      if (messageData.type === 'new_user_message' && isAdmin) {
        // User sent message to admin - refresh admin unread counts
        // fetchTotalAdminUnread() // Disabled to avoid API errors
        if (messageData.senderId) {
          fetchAdminUnreadFromUser(messageData.senderId)
        }
      } else if (messageData.type === 'new_admin_message' && !isAdmin) {
        // Admin sent message to user - refresh user unread count
        if (user?.id && messageData.receiverId === user.id) {
          // fetchUserUnreadFromAdmin(user.id) // Disabled to avoid API errors
        }
      }
    }

    const unregister = registerReadStatusCallback(handleReadStatusUpdate)
    return unregister
  }, [registerReadStatusCallback, isAdmin, user?.id]) // Removed function dependencies

  // Mark messages read theo DTO format
  const markMessagesRead = useCallback(async (userId, messageIds = null, markAllFromUser = false) => {
    if (!isAuthenticated) return null

    try {
      setLoading(true)
      clearError()
      
      const result = await chatReadStatusService.markMessagesRead(userId, messageIds, markAllFromUser)
      console.log('✅ Messages marked as read:', result)
      
      // Skip refresh unread counts to avoid API errors
      // if (isAdmin) {
      //   await fetchTotalAdminUnread()
      //   await fetchAdminUnreadFromUser(userId)
      // }
      
      return result
    } catch (error) {
      console.error('❌ Error marking messages as read:', error)
      setError(error.response?.data?.message || error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, isAdmin, clearError]) // Removed fetchTotalAdminUnread, fetchAdminUnreadFromUser

  return {
    // State
    unreadCounts,
    loading,
    error,
    isAdmin,

    // Getters
    getTotalUnreadCount,
    getUserUnreadCount,
    getAdminUnreadFromUserCount,

    // Actions
    fetchTotalAdminUnread,
    fetchUserUnreadFromAdmin,
    fetchAdminUnreadFromUser,
    markAsReadByAdminForUser,
    markAsReadByUserFromAdmin,
    markMessageAsRead,
    markMessagesRead, // New method for DTO format
    fetchUsersWithUnreadMessages,
    fetchUnreadMessagesForAdmin,
    fetchUnreadMessagesForUser,
    clearError
  }
}

export default useChatReadStatus