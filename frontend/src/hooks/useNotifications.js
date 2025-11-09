import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { notificationService } from '../services/notificationService'

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

  // Fetch notifications with optional parameters
  const fetchNotifications = useCallback(async (params = {}) => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    
    try {
      const response = await notificationService.getUserNotifications(user.id, {
        skipCount: 0,
        maxResultCount: 20,
        sortDirection: 'desc',
        ...params
      })

      if (response.success && response.result) {
        const notificationData = response.result.data || response.result
        setNotifications(Array.isArray(notificationData) ? notificationData : [])
      } else {
        setNotifications([])
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Không thể tải thông báo')
      setNotifications([])
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
        setUnreadCount(response.result || 0)
      }
    } catch (err) {
      console.error('Error fetching unread count:', err)
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
            ? { ...notification, status: 'READ' }
            : notification
        )
      )
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
      setError('Không thể cập nhật trạng thái thông báo')
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.id) return

    try {
      await notificationService.markAllAsRead(user.id)
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          status: 'READ' 
        }))
      )
      
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      setError('Không thể cập nhật tất cả thông báo')
    }
  }

  // Add new notification (for real-time updates)
  const addNotification = useCallback((newNotification) => {
    setNotifications(prev => [newNotification, ...prev])
    
    if (newNotification.status === 'UNREAD') {
      setUnreadCount(prev => prev + 1)
    }
  }, [])

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