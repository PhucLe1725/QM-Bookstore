import React, { createContext, useContext, useState, useEffect } from 'react'
import { useWebSocket } from './WebSocketContext'

const MessageContext = createContext()

export const useMessage = () => {
  const context = useContext(MessageContext)
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider')
  }
  return context
}

export const MessageProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const { messages } = useWebSocket()

  // Listen to WebSocket messages and create notifications
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      addNotification({
        id: Date.now(),
        type: latestMessage.type || 'info',
        title: latestMessage.title || 'Thông báo mới',
        message: latestMessage.content || latestMessage.message,
        timestamp: new Date()
      })
    }
  }, [messages])

  const addNotification = (notification) => {
    setNotifications(prev => [...prev, notification])
    setShowPopup(true)
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id)
    }, 5000)
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
    if (notifications.length <= 1) {
      setShowPopup(false)
    }
  }

  const clearAllNotifications = () => {
    setNotifications([])
    setShowPopup(false)
  }

  const togglePopup = () => {
    setShowPopup(!showPopup)
  }

  // Function to manually add notifications (for testing or other purposes)
  const showNotification = (type, title, message) => {
    addNotification({
      id: Date.now(),
      type,
      title,
      message,
      timestamp: new Date()
    })
  }

  const value = {
    notifications,
    showPopup,
    addNotification,
    removeNotification,
    clearAllNotifications,
    togglePopup,
    showNotification
  }

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  )
}