import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { isAdmin } from '../../utils/adminUtils'
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
  FileText,
  Star,
  MessageCircle,
  Ticket,
  Shield,
  ArrowUp,
  ArrowDown,
  Loader2,
  FolderTree,
  Warehouse
} from 'lucide-react'
import { reportService } from '../../services/reportService'
import orderService from '../../services/orderService'
import chatService from '../../services/chatService'
import NotificationDropdown from '../../components/NotificationDropdown'

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [recentMessages, setRecentMessages] = useState([])
  
  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData()
  }, [])
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard summary
      const summary = await reportService.getDashboardSummary()
      setDashboardData(summary)
      
      // Fetch recent orders (admin view)
      const ordersResponse = await orderService.getAllOrders({ 
        page: 0, 
        size: 5
      })
      if (ordersResponse.success) {
        setRecentOrders(ordersResponse.result?.content || ordersResponse.result || [])
      }
      
      // Fetch recent chat messages
      const messagesResponse = await chatService.getRecentMessages(5)
      if (messagesResponse.success) {
        setRecentMessages(messagesResponse.result || [])
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }
  
  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Get time ago
  const getTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const seconds = Math.floor((now - date) / 1000)
    
    if (seconds < 60) return `${seconds} giây trước`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} phút trước`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} giờ trước`
    const days = Math.floor(hours / 24)
    return `${days} ngày trước`
  }

  // Statistics cards data
  const stats = dashboardData ? [
    {
      title: 'Tổng người dùng',
      value: formatNumber(dashboardData.userData?.totalUsers || 0),
      change: `${dashboardData.userData?.growthRate > 0 ? '+' : ''}${dashboardData.userData?.growthRate?.toFixed(1) || 0}%`,
      isPositive: dashboardData.userData?.growthRate >= 0,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Đơn hàng (30 ngày)',
      value: formatNumber(dashboardData.orderData?.totalOrders || 0),
      change: `${dashboardData.orderData?.completedOrders || 0} hoàn thành`,
      isPositive: true,
      icon: ShoppingBag,
      color: 'bg-green-500'
    },
    {
      title: 'Đơn đang xử lý',
      value: formatNumber(dashboardData.orderData?.pendingOrders || 0),
      change: `${dashboardData.orderData?.cancelledOrders || 0} đã hủy`,
      isPositive: false,
      icon: BookOpen,
      color: 'bg-purple-500'
    },
    {
      title: 'Doanh thu (30 ngày)',
      value: formatCurrency(dashboardData.revenueData?.totalRevenue || 0),
      change: `${dashboardData.revenueData?.growthRate > 0 ? '+' : ''}${dashboardData.revenueData?.growthRate?.toFixed(1) || 0}%`,
      isPositive: dashboardData.revenueData?.growthRate >= 0,
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ] : []

  // Quick actions - Filter sensitive actions for MANAGER
  const allQuickActions = [
    {
      title: 'Quản lý người dùng',
      description: 'Xem và quản lý tài khoản người dùng',
      icon: UserCheck,
      href: '/admin/users',
      color: 'border-blue-200 hover:border-blue-300',
      adminOnly: true // MANAGER không có quyền
    },
    {
      title: 'Quản lý sản phẩm',
      description: 'Thêm, sửa, xóa sản phẩm trong kho',
      icon: Package,
      href: '/admin/products',
      color: 'border-green-200 hover:border-green-300'
    },
    {
      title: 'Quản lý danh mục',
      description: 'Quản lý cây phân cấp danh mục',
      icon: FolderTree,
      href: '/admin/categories',
      color: 'border-teal-200 hover:border-teal-300'
    },
    {
      title: 'Đơn hàng',
      description: 'Theo dõi và xử lý đơn hàng',
      icon: FileText,
      href: '/admin/orders',
      color: 'border-purple-200 hover:border-purple-300'
    },
    {
      title: 'Quản lý Kho',
      description: 'Nhập/xuất kho, kiểm kê, lịch sử biến động',
      icon: Warehouse,
      href: '/admin/inventory',
      color: 'border-emerald-200 hover:border-emerald-300'
    },
    {
      title: 'Tin nhắn hỗ trợ',
      description: 'Trả lời tin nhắn từ khách hàng',
      icon: MessageSquare,
      href: '/admin/messages',
      color: 'border-orange-200 hover:border-orange-300'
    },
    {
      title: 'Đánh giá sản phẩm',
      description: 'Quản lý đánh giá từ khách hàng',
      icon: Star,
      href: '/admin/reviews',
      color: 'border-yellow-200 hover:border-yellow-300'
    },
    {
      title: 'Bình luận sản phẩm',
      description: 'Quản lý bình luận về sản phẩm',
      icon: MessageCircle,
      href: '/admin/comments',
      color: 'border-indigo-200 hover:border-indigo-300'
    },
    {
      title: 'Quản lý Voucher',
      description: 'Tạo và quản lý mã giảm giá',
      icon: Ticket,
      href: '/admin/vouchers',
      color: 'border-pink-200 hover:border-pink-300',
      adminOnly: true // MANAGER không có quyền
    },
    {
      title: 'Quản lý Role',
      description: 'Quản lý vai trò người dùng',
      icon: Shield,
      href: '/admin/roles',
      color: 'border-cyan-200 hover:border-cyan-300',
      adminOnly: true // MANAGER không có quyền
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
      href: '/admin/system-config',
      color: 'border-gray-200 hover:border-gray-300',
      adminOnly: true // MANAGER không có quyền
    }
  ]

  // Filter actions based on user role
  const quickActions = allQuickActions.filter(action => {
    // If action is admin-only, only show for ADMIN
    if (action.adminOnly) {
      return isAdmin(user)
    }
    return true
  })

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
              <div className="flex items-center space-x-4">
                <NotificationDropdown />
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon
                const ChangeIcon = stat.isPositive ? ArrowUp : ArrowDown
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        <div className="flex items-center mt-1">
                          <ChangeIcon className={`h-4 w-4 ${stat.isPositive ? 'text-green-600' : 'text-red-600'} mr-1`} />
                          <p className={`text-sm ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.change}
                          </p>
                        </div>
                      </div>
                      <div className={`${stat.color} p-3 rounded-lg`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Top Products Chart */}
            {dashboardData?.topProducts && dashboardData.topProducts.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border mb-8">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">Sản phẩm bán chạy (30 ngày qua)</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {dashboardData.topProducts.map((product, index) => {
                      const maxRevenue = Math.max(...dashboardData.topProducts.map(p => p.totalRevenue))
                      const percentage = (product.totalRevenue / maxRevenue) * 100
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900">{product.productName}</p>
                                <p className="text-sm text-gray-500">
                                  Đã bán: {formatNumber(product.totalQuantitySold)} • 
                                  Đơn hàng: {formatNumber(product.orderCount)}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(product.totalRevenue)}
                            </p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-6 pt-4 border-t">
                    <button 
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      onClick={() => navigate('/admin/reports')}
                    >
                      Xem báo cáo chi tiết →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

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
                    // Navigate to the action's href
                    navigate(action.href)
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
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : recentOrders.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {recentOrders.map((order) => {
                      const getPaymentBadge = () => {
                        const badges = {
                          pending: 'bg-yellow-100 text-yellow-800',
                          paid: 'bg-green-100 text-green-800',
                          failed: 'bg-red-100 text-red-800',
                          refunded: 'bg-gray-100 text-gray-800'
                        }
                        return badges[order.paymentStatus] || 'bg-gray-100 text-gray-800'
                      }
                      
                      return (
                        <div 
                          key={order.orderId} 
                          className="flex items-center justify-between py-2 hover:bg-gray-50 px-2 rounded cursor-pointer"
                          onClick={() => navigate(`/admin/orders`)}
                        >
                          <div>
                            <p className="font-medium text-gray-900">Đơn hàng {order.orderId}</p>
                            <p className="text-sm text-gray-600">Order ID: {order.orderId}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(order.totalAmount)}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentBadge()}`}>
                              {order.paymentStatus === 'pending' && 'Chờ thanh toán'}
                              {order.paymentStatus === 'paid' && 'Đã thanh toán'}
                              {order.paymentStatus === 'failed' && 'Thất bại'}
                              {order.paymentStatus === 'refunded' && 'Đã hoàn tiền'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <button 
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      onClick={() => navigate('/admin/orders')}
                    >
                      Xem tất cả đơn hàng →
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">Chưa có đơn hàng nào</p>
              )}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Tin nhắn mới</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : recentMessages.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {recentMessages.map((msg, index) => {
                      const getInitials = (name) => {
                        if (!name) return 'U'
                        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      }
                      
                      return (
                        <div 
                          key={index} 
                          className="flex items-start space-x-3 hover:bg-gray-50 p-2 rounded cursor-pointer"
                          onClick={() => navigate('/admin/messages')}
                        >
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {getInitials(msg.senderName || msg.senderUsername)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {msg.senderName || msg.senderUsername || 'Người dùng'}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {msg.content || msg.message || 'Tin nhắn mới...'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {getTimeAgo(msg.createdAt || msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <button 
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      onClick={() => navigate('/admin/messages')}
                    >
                      Xem tất cả tin nhắn →
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">Chưa có tin nhắn mới</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard