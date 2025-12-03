import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { orderService } from '../services/orderService'
import { 
  Package, MapPin, Phone, User, Tag, Truck, CreditCard, 
  Calendar, CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft 
} from 'lucide-react'

const OrderDetail = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadOrderDetail()
  }, [orderId])

  const loadOrderDetail = async () => {
    try {
      setLoading(true)
      const response = await orderService.getOrderDetail(orderId)
      
      if (response.success) {
        setOrder(response.result)
      } else {
        alert('Không tìm thấy đơn hàng')
        navigate('/orders')
      }
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn')
      return
    }

    try {
      setCancelling(true)
      const result = await orderService.cancelOrder(orderId, cancelReason)
      
      if (result.success) {
        alert('Đã hủy đơn hàng thành công')
        setShowCancelModal(false)
        loadOrderDetail()
      } else {
        alert(result.error?.message || 'Không thể hủy đơn hàng')
      }
    } catch (error) {
      console.error('Cancel order error:', error)
      alert('Có lỗi xảy ra khi hủy đơn hàng')
    } finally {
      setCancelling(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusInfo = (status) => {
    const configs = {
      pending: { label: 'Chờ thanh toán', color: 'yellow', icon: Clock },
      paid: { label: 'Đã thanh toán', color: 'blue', icon: CheckCircle },
      shipping: { label: 'Đang giao', color: 'purple', icon: Truck },
      delivered: { label: 'Đã giao', color: 'green', icon: CheckCircle },
      pickup: { label: 'Tự lấy', color: 'purple', icon: Truck },
      confirmed: { label: 'Đã xác nhận', color: 'green', icon: CheckCircle },
      cancelled: { label: 'Đã hủy', color: 'red', icon: XCircle },
      closed: { label: 'Hoàn thành', color: 'green', icon: CheckCircle }
    }
    return configs[status] || { label: status, color: 'gray', icon: AlertCircle }
  }

  const canCancelOrder = () => {
    // Chỉ có thể hủy khi orderStatus = confirmed và paymentStatus != paid
    return order && order.orderStatus === 'confirmed' && order.paymentStatus !== 'paid'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy đơn hàng</h2>
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.paymentStatus)
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chi tiết đơn hàng #{order.orderId}</h1>
              <p className="text-gray-600 mt-1">Đặt hàng lúc {formatDate(order.createdAt)}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Payment Status */}
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border
                ${order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                ${order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                ${order.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
              `}>
                {order.paymentStatus === 'pending' && 'Chờ thanh toán'}
                {order.paymentStatus === 'paid' && 'Đã thanh toán'}
                {order.paymentStatus === 'failed' && 'Thanh toán thất bại'}
                {order.paymentStatus === 'refunded' && 'Đã hoàn tiền'}
              </span>
              
              {/* Fulfillment Status */}
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border
                ${order.fulfillmentStatus === 'shipping' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                ${order.fulfillmentStatus === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                ${order.fulfillmentStatus === 'pickup' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}
                ${order.fulfillmentStatus === 'returned' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
              `}>
                {order.fulfillmentStatus === 'shipping' && 'Đang giao hàng'}
                {order.fulfillmentStatus === 'delivered' && 'Đã giao hàng'}
                {order.fulfillmentStatus === 'pickup' && 'Tự lấy hàng'}
                {order.fulfillmentStatus === 'returned' && 'Đã trả hàng'}
              </span>
              
              {/* Order Status (chỉ hiện khi cancelled) */}
              {order.orderStatus === 'cancelled' && (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border bg-red-100 text-red-800 border-red-200">
                  Đã hủy
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sản phẩm */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                Sản phẩm
              </h2>
              
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 py-4 border-b last:border-b-0">
                    <img
                      src={item.thumbnail || '/placeholder.png'}
                      alt={item.productName}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600 mt-1">Số lượng: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Đơn giá: {formatPrice(item.unitPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-blue-600">{formatPrice(item.lineTotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thông tin vận chuyển */}
            {order.shipping && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-blue-600" />
                  Thông tin vận chuyển
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Đơn vị vận chuyển:</span>
                    <span className="font-medium">{order.shipping.provider}</span>
                  </div>
                  {order.shipping.orderCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã vận đơn:</span>
                      <span className="font-medium">{order.shipping.orderCode}</span>
                    </div>
                  )}
                  {order.shipping.status && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className="font-medium">{order.shipping.status}</span>
                    </div>
                  )}
                  {order.shipping.expectedDeliveryTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dự kiến giao:</span>
                      <span className="font-medium">{formatDate(order.shipping.expectedDeliveryTime)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Thông tin người nhận */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Thông tin người nhận
              </h2>
              
              {order.receiver && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Họ tên</p>
                    <p className="font-medium">{order.receiver.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Số điện thoại</p>
                    <p className="font-medium">{order.receiver.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Địa chỉ</p>
                    <p className="font-medium">{order.receiver.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tổng kết thanh toán */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                Thanh toán
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{formatPrice(order.subtotalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>{formatPrice(order.shippingFee || 0)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>

              {order.voucher && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Mã giảm giá: <strong className="ml-1">{order.voucher.code}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            {canCancelOrder() && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Hủy đơn hàng
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Hủy đơn hàng</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do hủy đơn *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Vui lòng nhập lý do hủy đơn hàng..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
              >
                {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderDetail
