import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderService } from '../services/orderService'
import { comboService } from '../services'
import { Package, Clock, CheckCircle, XCircle, Truck, Eye, RotateCcw, DollarSign, Store } from 'lucide-react'

const Orders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [comboImages, setComboImages] = useState({})
  
  // 3-axis status system từ documentation
  const statusTabs = [
    { 
      key: null, 
      label: 'Tất cả', 
      filter: {} 
    },
    { 
      key: 'pending', 
      label: 'Chờ thanh toán', 
      filter: { paymentStatus: 'pending' },
      color: 'yellow',
      icon: Clock
    },
    { 
      key: 'paid', 
      label: 'Đã thanh toán', 
      filter: { paymentStatus: 'paid' },
      color: 'green',
      icon: CheckCircle
    },
    { 
      key: 'shipping', 
      label: 'Đang giao', 
      filter: { fulfillmentStatus: 'shipping' },
      color: 'blue',
      icon: Truck
    },
    { 
      key: 'delivered', 
      label: 'Đã giao', 
      filter: { fulfillmentStatus: 'delivered' },
      color: 'green',
      icon: CheckCircle
    },
    { 
      key: 'pending_pickup', 
      label: 'Chờ lấy hàng', 
      filter: { fulfillmentStatus: 'pending_pickup' },
      color: 'yellow',
      icon: Store
    },
    { 
      key: 'picked_up', 
      label: 'Đã nhận hàng', 
      filter: { fulfillmentStatus: 'picked_up' },
      color: 'purple',
      icon: CheckCircle
    },
    { 
      key: 'cancelled', 
      label: 'Đã hủy', 
      filter: { orderStatus: 'cancelled' },
      color: 'red',
      icon: XCircle
    }
  ]

  useEffect(() => {
    loadOrders()
  }, [currentPage, selectedStatus])

  // Fetch combo images when orders change
  useEffect(() => {
    const fetchComboImages = async () => {
      const comboIds = []
      orders.forEach(order => {
        order.items?.forEach(item => {
          if (item.itemType === 'COMBO' && item.comboId && !comboImages[item.comboId]) {
            comboIds.push(item.comboId)
          }
        })
      })

      if (comboIds.length === 0) return

      // Fetch combo details for images
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
  }, [orders])

  const loadOrders = async () => {
    try {
      setLoading(true)
      
      // Tìm filter config cho selected status
      const activeTab = statusTabs.find(tab => tab.key === selectedStatus)
      const filters = {
        page: currentPage,
        size: 10,
        ...(activeTab?.filter || {})
      }
      
      const response = await orderService.getMyOrders(filters)
      
      if (response.success) {
        setOrders(response.result.content || [])
        setTotalPages(response.result.totalPages || 0)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusFilter = (statusKey) => {
    setSelectedStatus(statusKey === selectedStatus ? null : statusKey)
    setCurrentPage(0)
  }

  const handleReorder = async (orderId) => {
    try {
      const result = await orderService.reorder(orderId)
      if (result.success) {
        alert('Đã thêm sản phẩm vào giỏ hàng!')
        navigate('/cart')
      }
    } catch (error) {
      console.error('Reorder error:', error)
      alert('Không thể đặt lại đơn hàng')
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (order) => {
    // Hiển thị payment status và fulfillment status
    const paymentColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-blue-100 text-blue-800'
    }
    
    const fulfillmentColors = {
      shipping: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      pending_pickup: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-purple-100 text-purple-800',
      pickup: 'bg-purple-100 text-purple-800',  // backward compatibility
      returned: 'bg-orange-100 text-orange-800'
    }
    
    const orderColors = {
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    
    const paymentLabels = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thanh toán thất bại',
      refunded: 'Đã hoàn tiền'
    }
    
    const fulfillmentLabels = {
      shipping: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      pending_pickup: 'Chờ lấy tại quầy',
      picked_up: 'Đã nhận hàng',
      pickup: 'Đã nhận hàng',  // backward compatibility
      returned: 'Đã trả hàng'
    }
    
    const orderLabels = {
      confirmed: 'Đã xác nhận',
      cancelled: 'Đã hủy',
      closed: 'Hoàn thành'
    }
    
    return (
      <div className="flex flex-wrap gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
          {paymentLabels[order.paymentStatus] || order.paymentStatus}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${fulfillmentColors[order.fulfillmentStatus] || 'bg-gray-100 text-gray-800'}`}>
          {fulfillmentLabels[order.fulfillmentStatus] || order.fulfillmentStatus}
        </span>
        {order.orderStatus === 'cancelled' && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${orderColors[order.orderStatus]}`}>
            {orderLabels[order.orderStatus]}
          </span>
        )}
      </div>
    )
  }

  if (loading && currentPage === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Đơn hàng của tôi</h1>
          
          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key || 'all'}
                onClick={() => handleStatusFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có đơn hàng</h3>
            <p className="text-gray-600 mb-6">Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!</p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mua sắm ngay
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.orderId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm text-gray-600">Mã đơn hàng</p>
                      <p className="font-semibold text-gray-900">#{order.orderId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ngày đặt</p>
                      <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  {getStatusBadge(order)}
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        {item.itemType === 'COMBO' ? (
                          // Combo Item
                          <>
                            <div className="relative">
                              {comboImages[item.comboId] ? (
                                <img
                                  src={comboImages[item.comboId]}
                                  alt={item.comboName}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                                  <Package className="w-10 h-10 text-purple-600" />
                                </div>
                              )}
                              <div className="absolute -top-1 -right-1 bg-purple-600 text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-lg">
                                COMBO
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  🎁 Combo
                                </span>
                              </div>
                              <h3 className="font-medium text-gray-900">{item.comboName}</h3>
                              {item.comboSnapshot?.items && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {item.comboSnapshot.items.length} sản phẩm
                                </p>
                              )}
                              <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                            </div>
                          </>
                        ) : (
                          // Product Item
                          <>
                            <img
                              src={item.thumbnail || '/placeholder.png'}
                              alt={item.productName}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{item.productName}</h3>
                              <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                            </div>
                          </>
                        )}
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">{formatPrice(item.unitPrice)}</p>
                          <p className="text-sm text-gray-600">Tổng: {formatPrice(item.lineTotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Tổng số sản phẩm: {order.itemCount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Tổng thanh toán</p>
                        <p className="text-2xl font-bold text-blue-600">{formatPrice(order.totalPay || order.totalAmount)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => navigate(`/orders/${order.orderId}`)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Chi tiết
                    </button>
                    
                    {order.orderStatus === 'closed' && order.fulfillmentStatus === 'delivered' && (
                      <button
                        onClick={() => handleReorder(order.orderId)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Mua lại
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders
