import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Loader2,
  FileText
} from 'lucide-react'
import { reportService } from '../../services/reportService'
import AdminPageHeader from '../../components/AdminPageHeader'

const AdminReports = () => {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('revenue') // revenue, orders, products, users
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  
  const [revenueData, setRevenueData] = useState(null)
  const [orderStats, setOrderStats] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [productLimit, setProductLimit] = useState(10)

  useEffect(() => {
    fetchReports()
  }, [dateRange, productLimit])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }

      // Fetch all reports in parallel
      const [revenue, orders, products, users] = await Promise.all([
        reportService.getRevenueReport(params),
        reportService.getOrderStatistics(params),
        reportService.getTopSellingProducts({ ...params, limit: productLimit }),
        reportService.getUserStatistics(params)
      ])

      setRevenueData(revenue)
      setOrderStats(orders)
      setTopProducts(products)
      setUserStats(users)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const handleExport = () => {
    if (activeTab === 'revenue' && revenueData) {
      reportService.exportRevenueReport(revenueData)
    } else if (activeTab === 'products' && topProducts) {
      reportService.exportTopProducts(topProducts)
    } else if (activeTab === 'orders' && orderStats) {
      reportService.exportOrderStatistics(orderStats)
    }
  }

  const tabs = [
    { id: 'revenue', label: 'Doanh thu', icon: DollarSign },
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingCart },
    { id: 'products', label: 'Sản phẩm', icon: Package },
    { id: 'users', label: 'Người dùng', icon: Users }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader
        title="Báo cáo & Thống kê"
        description="Xem chi tiết về doanh thu, đơn hàng và hiệu suất kinh doanh"
        actions={
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo CSV
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={fetchReports}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Áp dụng'
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            {/* Revenue Report */}
            {activeTab === 'revenue' && revenueData && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(revenueData.totalRevenue)}
                        </p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Doanh thu thuần</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(revenueData.netRevenue)}
                        </p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tổng giảm giá</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(revenueData.totalDiscount)}
                        </p>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-lg">
                        <FileText className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatNumber(revenueData.totalOrders)}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          {revenueData.paidOrders} đã thanh toán
                        </p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue by Date Chart */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Doanh thu theo ngày</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Doanh thu
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Số đơn
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Giá trị TB
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {revenueData.revenueByDate.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(item.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(item.revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatNumber(item.orderCount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(item.averageOrderValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Revenue by Payment Method */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Theo phương thức thanh toán</h3>
                    <div className="space-y-4">
                      {revenueData.revenueByPaymentMethod.map((method, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{method.paymentMethod}</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(method.revenue)} ({method.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${method.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Revenue by Category */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Theo danh mục</h3>
                    <div className="space-y-4">
                      {revenueData.revenueByCategory.map((category, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{category.categoryName}</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(category.revenue)} ({category.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${category.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Statistics */}
            {activeTab === 'orders' && orderStats && (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tổng quan đơn hàng</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Tổng đơn</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(orderStats.totalOrders)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Đã thanh toán</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatNumber(orderStats.ordersByPaymentStatus.PAID || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Chờ thanh toán</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {formatNumber(orderStats.ordersByPaymentStatus.PENDING || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Thất bại</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatNumber(orderStats.ordersByPaymentStatus.FAILED || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Orders by Date */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Đơn hàng theo ngày</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng đơn</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã thanh toán</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã giao</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã hủy</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orderStats.ordersByDate.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(item.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatNumber(item.totalOrders)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                              {formatNumber(item.paidOrders)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                              {formatNumber(item.deliveredOrders)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                              {formatNumber(item.cancelledOrders)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Trạng thái thanh toán</h3>
                    <div className="space-y-3">
                      {Object.entries(orderStats.ordersByPaymentStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{status}</span>
                          <span className="text-sm font-semibold text-gray-900">{formatNumber(count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Trạng thái vận chuyển</h3>
                    <div className="space-y-3">
                      {Object.entries(orderStats.ordersByFulfillmentStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{status}</span>
                          <span className="text-sm font-semibold text-gray-900">{formatNumber(count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Trạng thái đơn hàng</h3>
                    <div className="space-y-3">
                      {Object.entries(orderStats.ordersByOrderStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{status}</span>
                          <span className="text-sm font-semibold text-gray-900">{formatNumber(count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Selling Products */}
            {activeTab === 'products' && topProducts && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Sản phẩm bán chạy nhất</h3>
                    <select
                      value={productLimit}
                      onChange={(e) => setProductLimit(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={5}>Top 5</option>
                      <option value={10}>Top 10</option>
                      <option value={20}>Top 20</option>
                      <option value={50}>Top 50</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã bán</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số đơn</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá TB</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {topProducts.map((product, index) => (
                          <tr key={product.productId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                              <div className="text-sm text-gray-500">ID: {product.productId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.categoryName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatNumber(product.totalQuantitySold)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              {formatCurrency(product.totalRevenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatNumber(product.orderCount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(product.averagePrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* User Statistics */}
            {activeTab === 'users' && userStats && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatNumber(userStats.totalUsers)}
                        </p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">
                          {formatNumber(userStats.activeUsers)}
                        </p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-lg">
                        <ArrowUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Không hoạt động</p>
                        <p className="text-2xl font-bold text-gray-600 mt-1">
                          {formatNumber(userStats.inactiveUsers)}
                        </p>
                      </div>
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <ArrowDown className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Người dùng mới</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">
                          {formatNumber(userStats.newUsersInPeriod)}
                        </p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Users by Date */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Người dùng mới theo ngày</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng mới</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tích lũy</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userStats.usersByDate.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(item.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              +{formatNumber(item.newUsers)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatNumber(item.cumulativeUsers)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Users by Role */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Phân bố theo vai trò</h3>
                  <div className="space-y-4">
                    {userStats.usersByRole.map((role, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{role.roleName}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatNumber(role.userCount)} ({role.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${role.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminReports
