import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { 
  Users, 
  ShoppingBag, 
  BookOpen, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Package,
  TrendingUp,
  UserCheck,
  FileText
} from 'lucide-react'

const AdminDashboard = () => {
  const { user } = useAuth()

  // Statistics cards data
  const stats = [
    {
      title: 'Tổng người dùng',
      value: '2,543',
      change: '+12%',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Đơn hàng hôm nay',
      value: '84',
      change: '+8%', 
      icon: ShoppingBag,
      color: 'bg-green-500'
    },
    {
      title: 'Sách đã bán',
      value: '1,247',
      change: '+23%',
      icon: BookOpen,
      color: 'bg-purple-500'
    },
    {
      title: 'Doanh thu tháng',
      value: '₫45,2M',
      change: '+15%',
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ]

  // Quick actions
  const quickActions = [
    {
      title: 'Quản lý người dùng',
      description: 'Xem và quản lý tài khoản người dùng',
      icon: UserCheck,
      href: '/admin/users',
      color: 'border-blue-200 hover:border-blue-300'
    },
    {
      title: 'Quản lý sách',
      description: 'Thêm, sửa, xóa sách trong kho',
      icon: Package,
      href: '/admin/books',
      color: 'border-green-200 hover:border-green-300'
    },
    {
      title: 'Đơn hàng',
      description: 'Theo dõi và xử lý đơn hàng',
      icon: FileText,
      href: '/admin/orders',
      color: 'border-purple-200 hover:border-purple-300'
    },
    {
      title: 'Tin nhắn hỗ trợ',
      description: 'Trả lời tin nhắn từ khách hàng',
      icon: MessageSquare,
      href: '/admin/messages',
      color: 'border-orange-200 hover:border-orange-300'
    },
    {
      title: 'Báo cáo & Thống kê',
      description: 'Xem báo cáo chi tiết về doanh thu',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'border-red-200 hover:border-red-300'
    },
    {
      title: 'Cài đặt hệ thống',
      description: 'Cấu hình chung của website',
      icon: Settings,
      href: '/admin/settings',
      color: 'border-gray-200 hover:border-gray-300'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Bảng điều khiển Admin
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Chào mừng trở lại, {user?.fullName || user?.username}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Hôm nay</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date().toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-sm text-green-600 mt-1">{stat.change} so với tháng trước</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon
              return (
                <div 
                  key={index}
                  className={`bg-white rounded-lg border-2 ${action.color} p-6 cursor-pointer transition-all duration-200 hover:shadow-md`}
                  onClick={() => {
                    // Tạm thời alert, sau này sẽ navigate
                    alert(`Chuyển đến: ${action.title}`)
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <IconComponent className="h-8 w-8 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Đơn hàng gần đây</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((order) => (
                  <div key={order} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900">#DH00{order}234</p>
                      <p className="text-sm text-gray-600">Nguyễn Văn A</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₫{(order * 150).toLocaleString()},000</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Đang xử lý
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Xem tất cả đơn hàng →
                </button>
              </div>
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Tin nhắn mới</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((msg) => (
                  <div key={msg} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">A</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Khách hàng {msg}</p>
                      <p className="text-sm text-gray-600">Tôi muốn hỏi về tình trạng đơn hàng...</p>
                      <p className="text-xs text-gray-500 mt-1">{msg} phút trước</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Xem tất cả tin nhắn →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard