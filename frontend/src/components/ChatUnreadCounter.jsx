import React, { useEffect } from 'react'
import { MessageCircle, Check, CheckCheck } from 'lucide-react'
import useChatReadStatus from '../hooks/useChatReadStatus'

const ChatUnreadCounter = ({ 
  userId, 
  isAdminView = false, 
  showMarkAllRead = true,
  className = "",
  size = "default" // "small", "default", "large"
}) => {
  const {
    unreadCounts,
    loading,
    error,
    isAdmin,
    getTotalUnreadCount,
    getUserUnreadCount,
    getAdminUnreadFromUserCount,
    markAsReadByAdminForUser,
    markAsReadByUserFromAdmin,
    fetchTotalAdminUnread,
    fetchUserUnreadFromAdmin,
    fetchAdminUnreadFromUser
  } = useChatReadStatus()

  useEffect(() => {
    if (isAdminView && isAdmin) {
      fetchTotalAdminUnread()
      if (userId) {
        fetchAdminUnreadFromUser(userId)
      }
    } else if (userId) {
      fetchUserUnreadFromAdmin(userId)
    }
  }, [isAdminView, isAdmin, userId]) // Removed function dependencies

  const handleMarkAllRead = async () => {
    try {
      if (isAdminView && isAdmin && userId) {
        await markAsReadByAdminForUser(userId)
      } else if (userId) {
        await markAsReadByUserFromAdmin(userId)
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const getUnreadCount = () => {
    if (isAdminView && isAdmin) {
      if (userId) {
        return getAdminUnreadFromUserCount(userId)
      }
      return getTotalUnreadCount()
    }
    return getUserUnreadCount(userId)
  }

  const unreadCount = getUnreadCount()

  // Size configurations
  const sizeConfig = {
    small: {
      badge: 'h-4 w-4 text-xs',
      button: 'p-1',
      icon: 'h-3 w-3'
    },
    default: {
      badge: 'h-5 w-5 text-xs',
      button: 'p-2',
      icon: 'h-4 w-4'
    },
    large: {
      badge: 'h-6 w-6 text-sm',
      button: 'p-2',
      icon: 'h-5 w-5'
    }
  }

  const config = sizeConfig[size] || sizeConfig.default

  if (loading && unreadCount === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-xs text-gray-500">Đang tải...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-500 ${className}`}>
        <MessageCircle className={config.icon} />
        <span className="text-xs" title={error}>Lỗi</span>
      </div>
    )
  }

  if (unreadCount === 0) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Unread Badge */}
      <div className="relative">
        <MessageCircle className={`${config.icon} text-blue-600`} />
        <span className={`absolute -top-1 -right-1 bg-red-500 text-white font-bold rounded-full ${config.badge} flex items-center justify-center`}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      </div>

      {/* Mark All Read Button */}
      {showMarkAllRead && (
        <button
          onClick={handleMarkAllRead}
          disabled={loading}
          className={`${config.button} text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Đánh dấu tất cả đã đọc"
        >
          {loading ? (
            <div className="animate-spin rounded-full border-b-2 border-current h-4 w-4"></div>
          ) : (
            <CheckCheck className={config.icon} />
          )}
        </button>
      )}

      {/* Count Text (optional) */}
      <span className="text-xs text-gray-600 font-medium">
        {unreadCount} tin nhắn mới
      </span>
    </div>
  )
}

export default ChatUnreadCounter