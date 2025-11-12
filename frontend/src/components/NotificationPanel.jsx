import React from 'react'
import { useNotificationContext } from '../store/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

/**
 * Component hiển thị danh sách thông báo
 * Theo tài liệu NOTIFICATION_API_GUIDE.md
 */
const NotificationPanel = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    error
  } = useNotificationContext()

  const handleNotificationClick = (notification) => {
    // Đánh dấu đã đọc nếu chưa đọc
    if (notification.status === 'UNREAD') {
      markAsRead(notification.id)
    }
    
    // Navigate to anchor if exists
    if (notification.anchor) {
      // Đóng panel trước khi navigate
      onClose()
      
      let targetUrl = notification.anchor
      
      // For NEW_MESSAGE notifications, redirect to admin messages page
      if (notification.type === 'NEW_MESSAGE') {
        targetUrl = '/admin/messages'
      }
      
      // Navigate to the link
      if (targetUrl.startsWith('http')) {
        window.open(targetUrl, '_blank')
      } else {
        window.location.href = targetUrl
      }
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_MESSAGE':
        return '💬'
      case 'ORDER_UPDATE':
        return '📦'
      case 'PAYMENT_UPDATE':
        return '💳'
      case 'SYSTEM_NOTIFICATION':
        return '🔔'
      case 'PROMOTION':
        return '🎉'
      default:
        return '📄'
    }
  }

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true, locale: vi })
    } catch (error) {
      return 'Không xác định'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25" 
        onClick={onClose}
      />
      
      {/* Notification Panel */}
      <div className="relative bg-white shadow-xl rounded-l-lg w-96 max-h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Thông báo {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                {unreadCount}
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-sm bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded transition-colors"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 text-xl"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Đang tải thông báo...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">📭</div>
              <p>Không có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    notification.status === 'UNREAD' 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl relative">
                      {getNotificationIcon(notification.type)}
                      {/* Global notification indicator */}
                      {notification.userId === null && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">🌐</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {notification.username || 'Hệ thống'}
                          </span>
                          {notification.userId === null && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Global
                            </span>
                          )}
                        </div>
                        {notification.status === 'UNREAD' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className={`text-sm ${
                        notification.status === 'UNREAD' 
                          ? 'text-gray-900 font-medium' 
                          : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.createdAt)}
                        </span>
                        {notification.anchor && (
                          <span className="text-xs text-blue-600">
                            Nhấn để xem chi tiết →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationPanel