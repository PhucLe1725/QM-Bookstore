import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Bell, 
  BellRing,
  MessageSquare, 
  Package, 
  CreditCard, 
  Settings, 
  Gift,
  Check,
  CheckCheck,
  X,
  ExternalLink
} from 'lucide-react'
import { useNotificationContext } from '../store/NotificationContext'

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
    clearError
  } = useNotificationContext()

  // Debug logs
  useEffect(() => {
    console.log('🔍 NotificationDropdown - notifications:', notifications)
    console.log('🔍 NotificationDropdown - unreadCount:', unreadCount)
    console.log('🔍 NotificationDropdown - loading:', loading)
    console.log('🔍 NotificationDropdown - error:', error)
  }, [notifications, unreadCount, loading, error])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Format relative time
  const formatTime = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} ngày trước`
    
    return date.toLocaleDateString('vi-VN')
  }

  // Get notification icon based on type
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

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (notification.status === 'UNREAD') {
      markAsRead(notification.id)
    }
    
    // Navigate to anchor if exists
    if (notification.anchor) {
      let targetUrl = notification.anchor
      
      // For NEW_MESSAGE notifications, redirect to admin messages page
      if (notification.type === 'NEW_MESSAGE') {
        targetUrl = '/admin/messages'
      }
      
      window.location.href = targetUrl
      setIsOpen(false)
    }
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
    if (error) clearError()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Thông báo"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-6 w-6" />
        ) : (
          <Bell className="h-6 w-6" />
        )}
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Thông báo
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refresh}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                  disabled={loading}
                >
                  Làm mới
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {unreadCount} thông báo chưa đọc
              </p>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {error && (
              <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400">
                <div className="flex">
                  <X className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Chưa có thông báo nào</p>
                <p className="text-xs text-gray-400 mt-1">
                  Debug: Array length = {notifications?.length || 'undefined'}, Array = {JSON.stringify(notifications)}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      notification.status === 'UNREAD' ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <div className="relative">
                          {getNotificationIcon(notification.type)}
                          {/* Global notification indicator */}
                          {notification.userId === null && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">🌐</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          notification.status === 'UNREAD' 
                            ? 'text-gray-900 font-medium' 
                            : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs text-gray-500">
                              {formatTime(notification.createdAt)}
                            </p>
                            {notification.userId === null && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                Global
                              </span>
                            )}
                          </div>
                          {notification.anchor && (
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {/* Read Status */}
                      {notification.status === 'UNREAD' && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200">
              <Link 
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="w-full block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Xem tất cả thông báo
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown