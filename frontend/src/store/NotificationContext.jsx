import React, { createContext, useContext, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { useWebSocket } from './WebSocketContext'

const NotificationContext = createContext()

export const useNotificationContext = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const { isConnected, setNotificationHandler } = useWebSocket()
  const notificationHook = useNotifications()

  // Debug log notifications state
  useEffect(() => {
    console.log('🔍 NotificationContext - notificationHook state:', {
      notifications: notificationHook.notifications,
      notificationCount: notificationHook.notifications?.length || 0,
      unreadCount: notificationHook.unreadCount,
      loading: notificationHook.loading,
      error: notificationHook.error
    })
  }, [notificationHook.notifications, notificationHook.unreadCount, notificationHook.loading, notificationHook.error])

  // Handle new real-time notifications from WebSocket
  const handleRealtimeNotification = useCallback((notification) => {
    console.log('🔔 New real-time notification received in NotificationContext:', {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      message: notification.message,
      status: notification.status,
      isGlobal: notification.userId === null
    })
    
    // Add to notification list
    notificationHook.addNotification(notification)
    
    // Show toast notification (optional)
    showNotificationToast(notification)
  }, [notificationHook.addNotification])  // Only depend on addNotification method

  // Register notification handler with WebSocket context
  useEffect(() => {
    if (setNotificationHandler && handleRealtimeNotification) {
      console.log('🔗 Registering notification handler with WebSocket (isConnected:', isConnected, ')')
      setNotificationHandler(() => handleRealtimeNotification)
    }
    
    return () => {
      if (setNotificationHandler) {
        console.log('📢 Unregistering notification handler from WebSocket')
        setNotificationHandler(null)
      }
    }
  }, [setNotificationHandler, handleRealtimeNotification])  // Remove isConnected dependency to always set handler

  const showNotificationToast = (notification) => {
    // Create a simple toast notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(getNotificationTitle(notification.type), {
        body: notification.message,
        // Remove icon to avoid 404 error - browser will use default
        tag: notification.id
      })
    }
  }

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'NEW_MESSAGE':
        return '💬 Tin nhắn mới'
      case 'ORDER_UPDATE':
        return '📦 Cập nhật đơn hàng'
      case 'PAYMENT_UPDATE':
        return '💳 Cập nhật thanh toán'
      case 'SYSTEM_NOTIFICATION':
        return '🔔 Thông báo hệ thống'
      case 'PROMOTION':
        return '🎉 Khuyến mãi'
      default:
        return '🔔 Thông báo'
    }
  }

  // Request notification permission
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const value = {
    ...notificationHook,
    handleRealtimeNotification,
    requestNotificationPermission
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export default NotificationProvider