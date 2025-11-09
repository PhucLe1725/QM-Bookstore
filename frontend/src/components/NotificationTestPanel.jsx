import React, { useState } from 'react'
import { useNotificationContext } from '../store/NotificationContext'

const NotificationTestPanel = () => {
  const { addNotification } = useNotificationContext()
  const [isOpen, setIsOpen] = useState(false)

  const testNotifications = [
    {
      type: 'NEW_MESSAGE',
      message: 'Bạn có tin nhắn mới từ admin',
      username: 'admin'
    },
    {
      type: 'ORDER_UPDATE', 
      message: 'Đơn hàng #12345 đã được xác nhận',
      anchor: '/orders/12345'
    },
    {
      type: 'PAYMENT_UPDATE',
      message: 'Thanh toán thành công cho đơn hàng #12345'
    },
    {
      type: 'PROMOTION',
      message: 'Khuyến mãi mới: Giảm 50% cho tất cả sách công nghệ!'
    },
    {
      type: 'SYSTEM_NOTIFICATION',
      message: 'Hệ thống sẽ bảo trì từ 2:00 - 4:00 sáng ngày mai'
    }
  ]

  const sendTestNotification = (notification) => {
    const testNotif = {
      id: Date.now(),
      ...notification,
      status: 'UNREAD',
      createdAt: new Date().toISOString(),
      userId: 1 // Mock user ID
    }
    
    addNotification(testNotif)
    
    // Also show toast
    if (window.showNotificationToast) {
      window.showNotificationToast(testNotif)
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Test Notifications"
      >
        🧪
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border p-4 w-80">
          <h3 className="font-semibold text-gray-900 mb-3">Test Notifications</h3>
          
          <div className="space-y-2">
            {testNotifications.map((notification, index) => (
              <button
                key={index}
                onClick={() => sendTestNotification(notification)}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="font-medium text-sm text-gray-700">
                  {notification.type.replace('_', ' ')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {notification.message}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationTestPanel