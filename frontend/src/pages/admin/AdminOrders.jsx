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
  MapPin,
  PackageCheck,
  FileText,
  Download
} from 'lucide-react'
import orderService from '../../services/orderService'
import inventoryService from '../../services/inventoryService'
import invoiceService from '../../services/invoiceService'
import comboService from '../../services/comboService'
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
  const [inventoryStatus, setInventoryStatus] = useState({})
  const [invoiceStatus, setInvoiceStatus] = useState({})
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceData, setInvoiceData] = useState(null)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [comboImages, setComboImages] = useState({})

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

  // Fetch combo images when selectedOrder changes
  useEffect(() => {
    if (!selectedOrder || !selectedOrder.items) return

    const fetchComboImages = async () => {
      const comboIds = []
      selectedOrder.items.forEach(item => {
        if (item.itemType === 'COMBO' && item.comboId && !comboImages[item.comboId]) {
          comboIds.push(item.comboId)
        }
      })

      if (comboIds.length === 0) return

      const uniqueComboIds = [...new Set(comboIds)]
      const imageMap = {}
      
      await Promise.all(
        uniqueComboIds.map(async (comboId) => {
          try {
            const response = await comboService.getComboById(comboId)
            if (response.success && response.result?.imageUrl) {
              imageMap[comboId] = response.result.imageUrl
            }
          } catch (error) {
            console.error(`Failed to fetch combo ${comboId}:`, error)
          }
        })
      )

      if (Object.keys(imageMap).length > 0) {
        setComboImages(prev => ({ ...prev, ...imageMap }))
      }
    }

    fetchComboImages()
  }, [selectedOrder])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await orderService.getAllOrders(filters)
      if (response.success) {
        const result = response.result
        const loadedOrders = result.content || []
        setOrders(loadedOrders)
        setTotalPages(result.totalPages || 0)
        setTotalElements(result.totalElements || 0)
        
        // Check inventory status for each order
        checkInventoryStatus(loadedOrders)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      showToast('Không thể tải danh sách đơn hàng', 'error')
    } finally {
      setLoading(false)
    }
  }

  const checkInventoryStatus = async (ordersList) => {
    const statusMap = {}
    for (const order of ordersList) {
      // Set to 'loading' initially
      statusMap[order.orderId] = 'loading'
    }
    setInventoryStatus(statusMap)
    
    // Then check each order
    for (const order of ordersList) {
      try {
        const isExported = await inventoryService.checkOrderExported(order.orderId)
        setInventoryStatus(prev => ({ ...prev, [order.orderId]: isExported }))
      } catch (error) {
        console.error(`Error checking inventory for order ${order.orderId}:`, error)
        setInventoryStatus(prev => ({ ...prev, [order.orderId]: false }))
      }
    }
  }

  // Invoice status is no longer pre-checked, will be generated fresh each time

  const handleExportStock = async (order) => {
    // Check if status is still loading
    if (inventoryStatus[order.orderId] === 'loading') {
      showToast('Đang kiểm tra trạng thái xuất kho, vui lòng đợi...', 'warning')
      return
    }
    
    if (order.paymentStatus !== 'paid') {
      showToast('Chỉ xuất kho cho đơn hàng đã thanh toán', 'warning')
      return
    }

    if (inventoryStatus[order.orderId]) {
      showToast('Đơn hàng này đã được xuất kho', 'warning')
      return
    }

    if (!window.confirm(`Xác nhận xuất kho cho đơn hàng #${order.orderId}?`)) {
      return
    }

    try {
      const response = await inventoryService.exportFromOrder({
        orderId: order.orderId,
        note: `Xuất kho cho đơn hàng #${order.orderId}`
      })

      // exportFromOrder already returns response.data, so response.success is correct
      if (response?.success) {
        showToast('Xuất kho thành công!', 'success')
        // Update inventory status immediately
        setInventoryStatus(prev => ({ ...prev, [order.orderId]: true }))
        // No need to reload, status already updated
      }
    } catch (error) {
      console.error('Error exporting stock:', error)
      const errorData = error.response?.data
      
      // Handle specific error codes
      if (errorData?.code === 9002) {
        showToast('Đơn hàng này đã được xuất kho trước đó', 'error')
        setInventoryStatus(prev => ({ ...prev, [order.orderId]: true }))
      } else if (errorData?.code === 9003) {
        showToast('Không đủ tồn kho. Vui lòng kiểm tra lại', 'error')
      } else if (errorData?.code === 7001) {
        showToast('Không tìm thấy đơn hàng', 'error')
      } else if (errorData?.code === 3001) {
        showToast('Không tìm thấy sản phẩm trong đơn hàng', 'error')
      } else if (errorData?.code === 9206) {
        showToast('Dữ liệu combo không hợp lệ. Vui lòng liên hệ hỗ trợ', 'error')
      } else {
        showToast(errorData?.message || 'Có lỗi xảy ra khi xuất kho', 'error')
      }
    }
  }

  const handleGenerateInvoice = async (order) => {
    // Check if order is eligible for invoice
    if (order.paymentStatus !== 'paid') {
      showToast('Chỉ xuất hóa đơn cho đơn hàng đã thanh toán', 'warning')
      return
    }

    if (order.orderStatus === 'cancelled') {
      showToast('Không thể xuất hóa đơn cho đơn hàng đã hủy', 'warning')
      return
    }

    setGeneratingInvoice(true)

    try {
      const requestBody = {
        orderId: order.orderId
      }

      const response = await invoiceService.generateInvoice(requestBody)

      if (response.success) {
        showToast('Xuất hóa đơn thành công!', 'success')
        setInvoiceData(response.result)
        setShowInvoiceModal(true)
        setInvoiceStatus(prev => ({ ...prev, [order.orderId]: true }))
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      const errorData = error.response?.data
      
      if (errorData?.code === 'INVOICE_ORDER_NOT_PAID') {
        showToast('Đơn hàng chưa thanh toán', 'error')
      } else if (errorData?.code === 'INVOICE_ORDER_CANCELLED') {
        showToast('Không thể xuất hóa đơn cho đơn đã hủy', 'error')
      } else if (errorData?.code === 'INVOICE_ALREADY_EXISTS') {
        showToast('Hóa đơn đã tồn tại', 'warning')
        setInvoiceStatus(prev => ({ ...prev, [order.orderId]: true }))
      } else if (errorData?.code === 9999 && errorData?.error?.includes('null')) {
        showToast('Có lỗi xảy ra với dữ liệu sản phẩm. Vui lòng liên hệ hỗ trợ', 'error')
      } else {
        showToast(errorData?.message || 'Có lỗi xảy ra khi xuất hóa đơn', 'error')
      }
    } finally {
      setGeneratingInvoice(false)
    }
  }

  const handleDownloadInvoicePdf = async () => {
    if (!invoiceData) return

    try {
      await invoiceService.downloadInvoicePdf(invoiceData.invoiceId)
      showToast('Tải file PDF thành công', 'success')
    } catch (error) {
      showToast('Tính năng PDF đang được phát triển', 'info')
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
      delivered: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Đã giao', icon: CheckCircle },
      pending_pickup: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ lấy tại quầy', icon: Clock },
      picked_up: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Đã nhận hàng', icon: MapPin },
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
                  Xuất kho
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
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isExported = inventoryStatus[order.orderId]
                  const canExport = order.paymentStatus === 'paid' && !isExported
                  
                  return (
                  <tr key={order.orderId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order.orderId}</div>
                      <div className="text-xs text-gray-500">{order.itemCount} sản phẩm</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.totalPay || order.totalAmount)}
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
                      {isExported === 'loading' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                          Đang kiểm tra...
                        </span>
                      ) : isExported === true ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          Đã xuất kho
                        </span>
                      ) : order.paymentStatus === 'paid' ? (
                        <button
                          onClick={() => handleExportStock(order)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <PackageCheck className="w-3 h-3" />
                          Xuất kho
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          <Clock className="w-3 h-3" />
                          Chờ thanh toán
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.paymentMethod === 'prepaid' ? 'Thanh toán Online' : 'COD'}
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
                  )
                })
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
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
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
                    <div key={index}>
                      {item.itemType === 'COMBO' ? (
                        <div className="border-l-4 border-purple-500 pl-3 py-2">
                          <div className="flex items-start gap-4 pb-2">
                            <div>
                              {comboImages[item.comboId] ? (
                                <img
                                  src={comboImages[item.comboId]}
                                  alt={item.comboName}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 flex items-center justify-center">
                                  <Package className="w-8 h-8 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  COMBO
                                </span>
                                <div className="font-medium text-gray-900">{item.comboName}</div>
                              </div>
                              {item.comboSnapshot && item.comboSnapshot.items && (
                                <div className="mt-2 bg-purple-50 rounded p-2 text-sm">
                                  <div className="font-medium text-gray-700 mb-1">Bao gồm:</div>
                                  {item.comboSnapshot.items.map((comboItem, idx) => (
                                    <div key={idx} className="text-gray-600 text-xs ml-2">
                                      • {comboItem.productName} × {comboItem.quantity}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="text-sm text-gray-600 mt-1">
                                {formatCurrency(item.unitPrice)} × {item.quantity}
                              </div>
                              {item.comboSnapshot && item.comboSnapshot.discountPercentage > 0 && (
                                <div className="text-xs text-green-600 mt-1">
                                  Tiết kiệm {item.comboSnapshot.discountPercentage}%
                                </div>
                              )}
                            </div>
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(item.lineTotal)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 pb-3 border-b border-gray-100 last:border-0">
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
                      )}
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
                    <span className="text-gray-600">Thuế VAT (10%):</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.vatAmount || (selectedOrder.totalAmount * 0.1))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">Tổng thanh toán:</span>
                    <span className="font-bold text-lg text-blue-600">{formatCurrency(selectedOrder.totalPay || (selectedOrder.totalAmount + (selectedOrder.vatAmount || 0) + (selectedOrder.shippingFee || 0)))}</span>
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

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 space-y-3">
              {/* Export Stock Button */}
              {selectedOrder.paymentStatus === 'paid' && !inventoryStatus[selectedOrder.orderId] && (
                <button
                  onClick={() => {
                    handleExportStock(selectedOrder)
                  }}
                  disabled={inventoryStatus[selectedOrder.orderId] === 'loading'}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <PackageCheck className="w-5 h-5" />
                  {inventoryStatus[selectedOrder.orderId] === 'loading' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang kiểm tra...
                    </>
                  ) : (
                    'Xuất kho'
                  )}
                </button>
              )}
              
              {/* Inventory Status Display */}
              {inventoryStatus[selectedOrder.orderId] === true && (
                <div className="w-full px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Đã xuất kho</span>
                </div>
              )}
              
              {/* Invoice Button */}
              {selectedOrder.paymentStatus === 'paid' && selectedOrder.orderStatus !== 'cancelled' && (
                <button
                  onClick={() => handleGenerateInvoice(selectedOrder)}
                  disabled={invoiceStatus[selectedOrder.orderId] === 'loading'}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  {invoiceStatus[selectedOrder.orderId] === 'loading' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang kiểm tra...
                    </>
                  ) : invoiceStatus[selectedOrder.orderId] === true ? (
                    'Xem hóa đơn'
                  ) : (
                    'Xuất hóa đơn điện tử'
                  )}
                </button>
              )}
              
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

      {/* Invoice Modal */}
      {showInvoiceModal && invoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Hóa đơn điện tử</h2>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Header */}
              <div className="text-center border-b pb-4">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">HÓA ĐƠN ĐIỆN TỬ</h3>
                <p className="text-lg font-semibold text-blue-600">{invoiceData.invoiceNumber}</p>
                <p className="text-sm text-gray-600">Ngày xuất: {formatDate(invoiceData.issuedAt)}</p>
              </div>

              {/* Seller & Buyer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Người bán</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Tên:</span> {invoiceData.seller.name}</p>
                    <p><span className="font-medium">MST:</span> {invoiceData.seller.taxCode}</p>
                    <p><span className="font-medium">Địa chỉ:</span> {invoiceData.seller.address}</p>
                    <p><span className="font-medium">SĐT:</span> {invoiceData.seller.phone}</p>
                    <p><span className="font-medium">Email:</span> {invoiceData.seller.email}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Người mua</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Tên:</span> {invoiceData.buyer.name}</p>
                    {invoiceData.buyer.taxCode && (
                      <p><span className="font-medium">MST:</span> {invoiceData.buyer.taxCode}</p>
                    )}
                    <p><span className="font-medium">Địa chỉ:</span> {invoiceData.buyer.address}</p>
                    <p><span className="font-medium">SĐT:</span> {invoiceData.buyer.phone}</p>
                    <p><span className="font-medium">Email:</span> {invoiceData.buyer.email}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Chi tiết sản phẩm</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 border text-left text-sm font-medium text-gray-700">STT</th>
                        <th className="px-4 py-2 border text-left text-sm font-medium text-gray-700">Tên sản phẩm</th>
                        <th className="px-4 py-2 border text-center text-sm font-medium text-gray-700">Số lượng</th>
                        <th className="px-4 py-2 border text-right text-sm font-medium text-gray-700">Đơn giá</th>
                        <th className="px-4 py-2 border text-right text-sm font-medium text-gray-700">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.items.map((item, index) => (
                        <tr key={index} className={!item.categoryName ? 'bg-purple-50' : ''}>
                          <td className="px-4 py-2 border text-sm">{index + 1}</td>
                          <td className="px-4 py-2 border text-sm">
                            <div className="flex items-center gap-2">
                              {!item.categoryName && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                  COMBO
                                </span>
                              )}
                              <span>{item.productName}</span>
                            </div>
                            {item.categoryName && (
                              <div className="text-xs text-gray-500 mt-1">{item.categoryName}</div>
                            )}
                          </td>
                          <td className="px-4 py-2 border text-sm text-center">{item.quantity}</td>
                          <td className="px-4 py-2 border text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-2 border text-sm text-right">{formatCurrency(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Amount Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng tiền hàng:</span>
                    <span className="font-medium">{formatCurrency(invoiceData.subtotalAmount)}</span>
                  </div>
                  {invoiceData.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá:</span>
                      <span className="font-medium">-{formatCurrency(invoiceData.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính (chưa VAT):</span>
                    <span className="font-medium">{formatCurrency(invoiceData.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Thuế VAT ({invoiceData.vatRate}%):</span>
                    <span className="font-medium">{formatCurrency(invoiceData.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-medium">{formatCurrency(invoiceData.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-blue-600 pt-2 border-t">
                    <span>TỔNG THANH TOÁN:</span>
                    <span>{formatCurrency(invoiceData.totalPay)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Phương thức thanh toán:</span>
                  <span className="font-medium text-gray-800">{invoiceData.paymentMethod === 'prepaid' ? 'Thanh toán online' : 'Thanh toán khi nhận hàng'}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-700">Trạng thái thanh toán:</span>
                  <span className="font-medium text-green-600">✓ Đã thanh toán</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadInvoicePdf}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Tải PDF
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default AdminOrders
