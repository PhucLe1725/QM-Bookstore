import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { notificationService } from '../services/notificationService'
import { userService } from '../services'
import { isAdminOrManager } from '../utils/adminUtils'

/**
 * Custom hook to manage notifications
 * Provides state and methods for handling user notifications
 */
export const useNotifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [updateTrigger, setUpdateTrigger] = useState(0) // Force update trigger

  // Debug notifications state changes
  useEffect(() => {
    // console.log('🔍 useNotifications state change:', {
    //   notificationsCount: notifications.length,
    //   notifications: notifications,
    //   unreadCount,
    //   loading,
    //   error,
    //   updateTrigger
    // })
  }, [notifications, unreadCount, loading, error, updateTrigger])

  // Helper function to enrich notifications with usernames
  const enrichNotificationsWithUsernames = async (notifications) => {
    if (!Array.isArray(notifications)) return notifications
    
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        // Skip global notifications (userId = null) and notifications that already have username
        if (notification.userId === null || notification.username) {
          return notification
        }
        
        // Try to fetch username for user-specific notifications
        try {
          const userResponse = await userService.getUserById(notification.userId)
          if (userResponse.success && userResponse.result) {
            return {
              ...notification,
              username: userResponse.result.username || userResponse.result.fullName || 'Unknown User'
            }
          }
        } catch (err) {
          console.warn('Could not fetch username for userId:', notification.userId, err)
        }
        
        return notification
      })
    )
    
    return enrichedNotifications
  }

  // Fetch notifications with optional parameters
  const fetchNotifications = useCallback(async (params = {}) => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    
    try {
      // console.log('🔄 Fetching notifications for user:', user.id)
      
      // Fetch both personal and global notifications in parallel
      const isAdminUser = isAdminOrManager(user)
      // console.log('👤 User role check:', {
      //   userId: user.id,
      //   roles: user.roles,
      //   roleName: user.roleName,
      //   isAdmin: isAdminUser
      // })
      
      const [userNotificationsResponse, globalNotificationsResponse] = await Promise.allSettled([
        notificationService.getUserNotifications(user.id, {
          skipCount: 0,
          maxResultCount: 20,
          sortDirection: 'desc',
          ...params
        }),
        // Only fetch global if user is admin/manager
        isAdminUser
          ? notificationService.getGlobalNotifications()
          : Promise.resolve({ success: false, result: [] })
      ])

      // console.log('✅ User notifications response:', userNotificationsResponse)
      // console.log('✅ Global notifications response:', globalNotificationsResponse)

      // Combine notifications
      let allNotifications = []

      // Add personal notifications
      if (userNotificationsResponse.status === 'fulfilled' && userNotificationsResponse.value?.success) {
        const userData = userNotificationsResponse.value.result?.data || userNotificationsResponse.value.result || []
        if (Array.isArray(userData)) {
          allNotifications.push(...userData)
        }
      }

      // Add global notifications (for admin/manager)
      if (globalNotificationsResponse.status === 'fulfilled' && globalNotificationsResponse.value?.success) {
        const globalData = globalNotificationsResponse.value.result || []
        if (Array.isArray(globalData)) {
          allNotifications.push(...globalData)
        }
      }

      // Sort by createdAt (newest first)
      allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      // console.log('🔗 Combined notifications:', allNotifications)
      
      // Enrich notifications with usernames
      const enrichedNotifications = await enrichNotificationsWithUsernames(allNotifications)
      // console.log('🎯 Setting notifications state with:', enrichedNotifications)
      setNotifications(enrichedNotifications)
      
    } catch (err) {
      console.error('❌ Error fetching notifications:', err)
      console.error('❌ Error response:', err.response?.data)
      console.error('❌ Error status:', err.response?.status)
      setError('Không thể tải thông báo')
      
      // Fallback to getUserNotifications if main API fails
      try {
        const fallbackResponse = await notificationService.getUserNotifications(user.id, {
          skipCount: 0,
          maxResultCount: 20,
          sortDirection: 'desc',
          ...params
        })
        
        if (fallbackResponse.success && fallbackResponse.result) {
          const notificationData = fallbackResponse.result.data || fallbackResponse.result
          const rawNotifications = Array.isArray(notificationData) ? notificationData : []
          
          // Enrich notifications with usernames
          const enrichedNotifications = await enrichNotificationsWithUsernames(rawNotifications)
          setNotifications(enrichedNotifications)
          setError(null) // Clear error if fallback works
        }
      } catch (fallbackErr) {
        console.error('❌ Fallback API also failed:', fallbackErr)
        setNotifications([])
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Fetch unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await notificationService.getUnreadCount(user.id)
      
      if (response.success) {
        const count = response.result || 0
        setUnreadCount(count)
      } else {
        console.warn('⚠️ Unread count API returned unsuccessful response:', response)
      }
    } catch (err) {
      console.error('❌ Error fetching unread count:', err)
    }
  }, [user?.id])

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'read' }
            : notification
        )
      )
      
      // Refresh unread count from server for accuracy
      fetchUnreadCount()
      
    } catch (err) {
      console.error('❌ Error marking notification as read:', err)
      setError('Không thể cập nhật trạng thái thông báo')
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.id) return

    try {
      const isAdminUser = isAdminOrManager(user)
      
      // Admin/Manager: mark both personal and global notifications
      if (isAdminUser) {
        // Call both APIs in parallel
        await Promise.all([
          notificationService.markAllAsRead(user.id),
          notificationService.markAllGlobalAsRead()
        ])
      } else {
        // Customer: mark only personal notifications
        await notificationService.markAllAsRead(user.id)
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          status: 'read' 
        }))
      )
      
      // Refresh unread count from server
      fetchUnreadCount()
      
    } catch (err) {
      console.error('❌ Error marking all notifications as read:', err)
      setError('Không thể cập nhật tất cả thông báo')
    }
  }

  // Add new notification (for real-time updates)
  const addNotification = useCallback(async (newNotification) => {
    
    // Enrich with username if needed
    const enrichedNotifications = await enrichNotificationsWithUsernames([newNotification])
    const enrichedNotification = enrichedNotifications[0]
    
    
    setNotifications(prev => {
      const updated = [enrichedNotification, ...prev]
      return updated
    })
    
    // Immediately update unread count for responsive UI
    if (enrichedNotification.status === 'UNREAD') {
      setUnreadCount(prev => {
        const newCount = prev + 1
        return newCount
      })
    }
    
    // Then refresh from server for accuracy (async)
    setTimeout(() => fetchUnreadCount(), 100) // Small delay to avoid race condition
    
    // Force component re-render
    setUpdateTrigger(prev => prev + 1)
    
  }, [])  // Remove fetchUnreadCount from dependencies to avoid infinite loops

  // Remove notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId)
      const filtered = prev.filter(n => n.id !== notificationId)
      
      // Update unread count if removing unread notification
      if (notification?.status === 'UNREAD') {
        setUnreadCount(current => Math.max(0, current - 1))
      }
      
      return filtered
    })
  }, [])

  // Refresh all notification data
  const refresh = useCallback(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, []) // Removed function dependencies - they're stable functions

  // Load notifications on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchNotifications()
      fetchUnreadCount()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [user?.id]) // Removed function dependencies

  // Periodic refresh for unread count (every 30 seconds)
  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user?.id, fetchUnreadCount])

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    
    // Methods
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    refresh,
    
    // Clear error
    clearError: () => setError(null)
  }
}

export default useNotifications