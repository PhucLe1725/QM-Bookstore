import React, { useState, useEffect } from 'react'
import { X, Bell, MessageSquare, Package, CreditCard, Settings, Gift } from 'lucide-react'

const NotificationToast = ({ notification, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_MESSAGE':
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'ORDER_UPDATE':
        return <Package className="h-5 w-5 text-green-500" />
      case 'PAYMENT_UPDATE':
        return <CreditCard className="h-5 w-5 text-purple-500" />
      case 'SYSTEM_NOTIFICATION':
        return <Settings className="h-5 w-5 text-gray-500" />
      case 'PROMOTION':
        return <Gift className="h-5 w-5 text-orange-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'NEW_MESSAGE':
        return 'border-blue-400 bg-blue-50'
      case 'ORDER_UPDATE':
        return 'border-green-400 bg-green-50'
      case 'PAYMENT_UPDATE':
        return 'border-purple-400 bg-purple-50'
      case 'SYSTEM_NOTIFICATION':
        return 'border-gray-400 bg-gray-50'
      case 'PROMOTION':
        return 'border-orange-400 bg-orange-50'
      default:
        return 'border-gray-400 bg-gray-50'
    }
  }

  if (!isVisible) return null

  return (
    <div className={`
      fixed top-4 right-4 z-50 w-80 max-w-sm
      transform transition-all duration-300 ease-in-out
      ${isExiting 
        ? 'translate-x-full opacity-0' 
        : 'translate-x-0 opacity-100'
      }
    `}>
      <div className={`
        bg-white rounded-lg shadow-lg border-l-4 p-4
        ${getNotificationColor(notification.type)}
      `}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {notification.message}
            </p>
            {notification.username && (
              <p className="text-xs text-gray-600 mt-1">
                Từ: {notification.username}
              </p>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-blue-500 h-1 rounded-full transition-all duration-100 ease-linear"
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// Toast Container to manage multiple toasts
export const NotificationToastContainer = () => {
  const [toasts, setToasts] = useState([])

  const addToast = (notification) => {
    const id = Date.now()
    const newToast = { ...notification, id }
    
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Expose addToast method globally
  useEffect(() => {
    window.showNotificationToast = addToast
    
    return () => {
      delete window.showNotificationToast
    }
  }, [])

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ transform: `translateY(${index * 10}px)` }}
        >
          <NotificationToast
            notification={toast}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}

export default NotificationToast