import React, { createContext, useContext, useEffect } from 'react'
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
  const { isConnected } = useWebSocket()
  const notificationHook = useNotifications()

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    if (!user?.id || !isConnected) return

    // This will be handled by WebSocketContext
    // Here we just provide the context for notification management
    console.log('📢 Notification system initialized for user:', user.username)
  }, [user?.id, isConnected])

  // Handle new real-time notifications
  const handleRealtimeNotification = (notification) => {
    console.log('🔔 New real-time notification:', notification)
    
    // Add to notification list
    notificationHook.addNotification(notification)
    
    // Show toast notification (optional)
    showNotificationToast(notification)
  }

  const showNotificationToast = (notification) => {
    // Create a simple toast notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(getNotificationTitle(notification.type), {
        body: notification.message,
        icon: '/favicon.ico',
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