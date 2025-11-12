import React from 'react'
import { useAuth } from '../store'
import NotificationDebugPanel from '../components/NotificationDebugPanel'

const Dashboard = () => {
  const { user } = useAuth()
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Chào mừng, {user?.username || user?.email}!
          </h2>
          <p className="text-blue-700">
            Đây là trang dashboard dành riêng cho người dùng đã đăng nhập.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Thông tin tài khoản</h3>
            <p className="text-sm text-gray-600">
              <strong>Username:</strong> {user?.username}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {user?.email}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Role:</strong> {user?.roleName}
            </p>
            <p className="text-sm text-gray-600">
              <strong>ID:</strong> {user?.id}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Sách đã mua</h3>
            <p className="text-sm text-gray-600">Chưa có sách nào</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Đơn hàng</h3>
            <p className="text-sm text-gray-600">Chưa có đơn hàng nào</p>
          </div>
        </div>

        {/* Debug Panel - Remove in production */}
        <div className="mt-8">
          <NotificationDebugPanel />
        </div>
      </div>
    </div>
  )
}

export default Dashboard