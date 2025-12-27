import React, { useState, useEffect } from 'react'
import {
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  X,
  DollarSign,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RotateCcw,
  MapPin
} from 'lucide-react'
import orderService from '../../services/orderService'
import { useToast } from '../../contexts/ToastContext'
import AdminPageHeader from '../../components/AdminPageHeader'

const AdminOrders = () => {
  const { showToast } = useToast()

  // State
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  // Filters
  const [filters, setFilters] = useState({
    paymentStatus: '',
    fulfillmentStatus: '',
    orderStatus: '',
    page: 0,
    size: 20
  })

  // Pagination
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Update form
  const [updateForm, setUpdateForm] = useState({
    paymentStatus: '',
    fulfillmentStatus: '',
    orderStatus: '',
    note: ''
  })

  // Quick filter buttons
  const quickFilters = [
    { label: 'Tất cả', filter: {} },
    { label: 'Chờ thanh toán', filter: { paymentStatus: 'pending' } },
    { label: 'Đang giao', filter: { fulfillmentStatus: 'shipping' } },
    { label: 'Chờ lấy tại quầy', filter: { fulfillmentStatus: 'pending_pickup' } },
    { label: 'Cần hoàn tiền', filter: { orderStatus: 'cancelled', paymentStatus: 'paid' } },
    { label: 'Đã hoàn tất', filter: { orderStatus: 'closed' } },
    { label: 'Đã hủy', filter: { orderStatus: 'cancelled' } }
  ]

  useEffect(() => {
    loadOrders()
  }, [filters])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await orderService.getAllOrders(filters)
      if (response.success) {
        const result = response.result
        setOrders(result.content || [])
        setTotalPages(result.totalPages || 0)
        setTotalElements(result.totalElements || 0)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      showToast('Không thể tải danh sách đơn hàng', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickFilter = (filter) => {
    setFilters(prev => ({
      ...prev,
      ...filter,
      paymentStatus: filter.paymentStatus || '',
      fulfillmentStatus: filter.fulfillmentStatus || '',
      orderStatus: filter.orderStatus || '',
      page: 0
    }))
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 0
    }))
  }

  const clearFilters = () => {
    setFilters({
      paymentStatus: '',
      fulfillmentStatus: '',
      orderStatus: '',
      page: 0,
      size: 20
    })
  }

  const handleViewDetail = async (order) => {
    try {
      const response = await orderService.getOrderDetail(order.orderId)
      if (response.success) {
        setSelectedOrder(response.result)
        setShowDetailModal(true)
      }
    } catch (error) {
      showToast('Không thể tải chi tiết đơn hàng', 'error')
    }
  }

  const handleOpenUpdateModal = (order) => {
    setSelectedOrder(order)
    setUpdateForm({
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus || '',
      orderStatus: order.orderStatus,
      note: ''
    })
    setShowUpdateModal(true)
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    
    try {
      const updateData = {}
      if (updateForm.paymentStatus !== selectedOrder.paymentStatus) {
        updateData.paymentStatus = updateForm.paymentStatus
      }
      if (updateForm.fulfillmentStatus !== selectedOrder.fulfillmentStatus) {
        updateData.fulfillmentStatus = updateForm.fulfillmentStatus || null
      }
      if (updateForm.orderStatus !== selectedOrder.orderStatus) {
        updateData.orderStatus = updateForm.orderStatus
      }
      if (updateForm.note) {
        updateData.note = updateForm.note
      }

      if (Object.keys(updateData).length === 0) {
        showToast('Không có thay đổi nào', 'warning')
        return
      }

      const response = await orderService.updateOrderStatus(selectedOrder.orderId, updateData)
      if (response.success) {
        showToast('Cập nhật trạng thái thành công', 'success')
        setShowUpdateModal(false)
        loadOrders()
      }
    } catch (error) {
      showToast('Không thể cập nhật trạng thái', 'error')
    }
  }

  // Status badge helpers
  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ thanh toán', icon: Clock },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã thanh toán', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Thất bại', icon: XCircle },
      refunded: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Đã hoàn tiền', icon: RotateCcw }
    }
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: AlertCircle }
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  const getFulfillmentStatusBadge = (status) => {
    if (!status) return <span className="text-xs text-gray-400">-</span>
    
    const badges = {
      shipping: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Đang giao', icon: Truck },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã giao', icon: CheckCircle },
      pending_pickup: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ lấy tại quầy', icon: Clock },
      picked_up: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Đã nhận hàng', icon: MapPin },
      pickup: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Đã nhận hàng', icon: MapPin },
      returned: { bg: 'bg-red-100', text: 'text-red-800', label: 'Đã trả', icon: RotateCcw }
    }
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: AlertCircle }
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  const getOrderStatusBadge = (status) => {
    const badges = {
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đã xác nhận', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Đã hủy', icon: XCircle },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã đóng', icon: Package }
    }
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: AlertCircle }
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader
        title="Quản lý Đơn hàng"
        description={`Tổng số: ${totalElements} đơn hàng`}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Quick Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((qf, index) => (
            <button
              key={index}
              onClick={() => handleQuickFilter(qf.filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.paymentStatus === (qf.filter.paymentStatus || '') &&
                filters.fulfillmentStatus === (qf.filter.fulfillmentStatus || '') &&
                filters.orderStatus === (qf.filter.orderStatus || '')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {qf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Bộ lọc nâng cao</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thanh toán
            </label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="failed">Thất bại</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
          </div>

          {/* Fulfillment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giao hàng
            </label>
            <select
              value={filters.fulfillmentStatus}
              onChange={(e) => handleFilterChange('fulfillmentStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="shipping">Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="pending_pickup">Chờ lấy tại quầy</option>
              <option value="picked_up">Đã nhận hàng</option>
              <option value="returned">Đã trả</option>
            </select>
          </div>

          {/* Order Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={filters.orderStatus}
              onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="cancelled">Đã hủy</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thanh toán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giao hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phương thức
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order.orderId}</div>
                      <div className="text-xs text-gray-500">{order.itemCount} sản phẩm</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getFulfillmentStatusBadge(order.fulfillmentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getOrderStatusBadge(order.orderStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.paymentMethod === 'prepaid' ? 'Trả trước' : 'COD'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.fulfillmentMethod === 'delivery' ? 'Giao hàng' : 'Lấy tại CH'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetail(order)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenUpdateModal(order)}
                          className="text-green-600 hover:text-green-800"
                          title="Cập nhật trạng thái"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handleFilterChange('page', Math.max(0, filters.page - 1))}
                  disabled={filters.page === 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => handleFilterChange('page', Math.min(totalPages - 1, filters.page + 1))}
                  disabled={filters.page >= totalPages - 1}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Trang <span className="font-medium">{filters.page + 1}</span> / <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handleFilterChange('page', Math.max(0, filters.page - 1))}
                      disabled={filters.page === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleFilterChange('page', Math.min(totalPages - 1, filters.page + 1))}
                      disabled={filters.page >= totalPages - 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Chi tiết đơn hàng #{selectedOrder.orderId}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Thanh toán</div>
                  {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Giao hàng</div>
                  {getFulfillmentStatusBadge(selectedOrder.fulfillmentStatus)}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Trạng thái</div>
                  {getOrderStatusBadge(selectedOrder.orderStatus)}
                </div>
              </div>

              {/* Receiver Info */}
              {selectedOrder.receiver && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Thông tin người nhận</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Tên:</span> <span className="font-medium">{selectedOrder.receiver.name}</span></div>
                    <div><span className="text-gray-600">SĐT:</span> <span className="font-medium">{selectedOrder.receiver.phone}</span></div>
                    <div><span className="text-gray-600">Địa chỉ:</span> <span className="font-medium">{selectedOrder.receiver.address}</span></div>
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Sản phẩm</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 pb-3 border-b border-gray-100 last:border-0">
                      <img
                        src={item.thumbnail || '/placeholder.png'}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.productName}</div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </div>
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(item.lineTotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.subtotalAmount)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá:</span>
                      <span className="font-medium">-{formatCurrency(selectedOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">Tổng cộng:</span>
                    <span className="font-bold text-lg text-blue-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Voucher Info */}
              {selectedOrder.voucher && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Voucher áp dụng</h3>
                  <div className="text-sm">
                    <span className="font-medium text-blue-700">{selectedOrder.voucher.code}</span>
                    <span className="text-gray-600"> - Giảm {formatCurrency(selectedOrder.voucher.discountAmount)}</span>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-sm text-gray-600 space-y-1">
                <div>Tạo lúc: {formatDate(selectedOrder.createdAt)}</div>
                {selectedOrder.updatedAt && (
                  <div>Cập nhật: {formatDate(selectedOrder.updatedAt)}</div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Cập nhật trạng thái</h2>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="text-sm text-blue-800">
                  Đơn hàng: <span className="font-semibold">#{selectedOrder.orderId}</span>
                </div>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái thanh toán
                </label>
                <select
                  value={updateForm.paymentStatus}
                  onChange={(e) => setUpdateForm({ ...updateForm, paymentStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Chờ thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="failed">Thất bại</option>
                  <option value="refunded">Đã hoàn tiền</option>
                </select>
              </div>

              {/* Fulfillment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái giao hàng
                </label>
                <select
                  value={updateForm.fulfillmentStatus}
                  onChange={(e) => setUpdateForm({ ...updateForm, fulfillmentStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="shipping">Đang giao</option>
                  <option value="delivered">Đã giao</option>
                  <option value="pending_pickup">Chờ lấy tại quầy</option>
                  <option value="picked_up">Đã nhận hàng</option>
                  <option value="returned">Đã trả</option>
                </select>
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái đơn hàng
                </label>
                <select
                  value={updateForm.orderStatus}
                  onChange={(e) => setUpdateForm({ ...updateForm, orderStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="cancelled">Đã hủy</option>
                  <option value="closed">Đã đóng</option>
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={updateForm.note}
                  onChange={(e) => setUpdateForm({ ...updateForm, note: e.target.value })}
                  rows="3"
                  placeholder="Ghi chú về thay đổi (tùy chọn)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default AdminOrders
