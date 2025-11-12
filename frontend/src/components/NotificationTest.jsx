import React, { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { useWebSocket } from '../store/WebSocketContext'

/**
 * Component test thông báo tin nhắn mới
 * Kiểm tra xem notification system có hoạt động đúng theo tài liệu không
 */
const NotificationTest = () => {
  const { user } = useAuth()
  const { notifications, unreadCount, markAsRead, refresh } = useNotifications()
  const { isConnected } = useWebSocket()

  // Refresh notifications when component mounts
  useEffect(() => {
    refresh()
  }, [])

  if (!user || !['ADMIN', 'MANAGER'].some(role => user.roles?.includes(role))) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto z-50">
      <h4 className="font-semibold text-gray-800 mb-2">
        🔧 Test Notification System
      </h4>
      
      <div className="text-sm space-y-2 mb-3">
        <p>
          <strong>WebSocket:</strong> 
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? ' ✅ Connected' : ' ❌ Disconnected'}
          </span>
        </p>
        <p>
          <strong>Unread Count:</strong> 
          <span className="text-blue-600">{unreadCount}</span>
        </p>
        <p>
          <strong>Total Notifications:</strong> 
          <span className="text-purple-600">{notifications.length}</span>
        </p>
      </div>

      <div className="mb-3">
        <button 
          onClick={refresh}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        <h5 className="font-medium text-gray-700 text-sm">Recent Notifications:</h5>
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-sm">No notifications</p>
        ) : (
          notifications.slice(0, 3).map(notification => (
            <div 
              key={notification.id}
              className={`p-2 rounded text-sm border ${
                notification.status === 'UNREAD' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-xs text-gray-600">
                  {notification.type}
                </span>
                <span className="text-xs text-gray-500">
                  {notification.status}
                </span>
              </div>
              <p className="text-gray-700">{notification.message}</p>
              {notification.status === 'UNREAD' && (
                <button 
                  onClick={() => markAsRead(notification.id)}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))
        )}
      </div>
      
      {notifications.length > 3 && (
        <p className="text-xs text-gray-500 mt-2">
          ... and {notifications.length - 3} more
        </p>
      )}
    </div>
  )
}

export default NotificationTest