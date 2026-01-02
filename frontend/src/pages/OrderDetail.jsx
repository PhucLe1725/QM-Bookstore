import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { orderService } from '../services/orderService'
import transactionService from '../services/transactionService'
import QRPayment from '../components/QRPayment'
import { useToast } from '../contexts/ToastContext'
import { 
  Package, MapPin, Phone, User, Tag, Truck, CreditCard, 
  Calendar, CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft, RefreshCw 
} from 'lucide-react'

const OrderDetail = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [validating, setValidating] = useState(false)

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
      toast.warning('Vui lòng nhập lý do hủy đơn')
      return
    }

    try {
      setCancelling(true)
      const result = await orderService.cancelOrder(orderId, cancelReason)
      
      if (result.success) {
        toast.success('Đã hủy đơn hàng thành công')
        setShowCancelModal(false)
        loadOrderDetail()
      } else {
        // Handle error code 7003: CANNOT_CANCEL_ORDER
        if (result.error?.code === 7003) {
          toast.error('Không thể hủy đơn hàng với trạng thái hiện tại')
        } else {
          toast.error(result.error?.message || 'Không thể hủy đơn hàng')
        }
      }
    } catch (error) {
      console.error('Cancel order error:', error)
      toast.error('Có lỗi xảy ra khi hủy đơn hàng')
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

  const getPaymentStatusLabel = () => {
    if (!order) return ''
    
    if (order.paymentStatus === 'pending') {
      // Phân biệt COD và Prepaid khi chưa thanh toán
      if (order.paymentMethod === 'prepaid') {
        return 'Chờ chuyển khoản'
      } else {
        return 'Thanh toán khi nhận hàng'
      }
    }
    
    // Các trạng thái khác giống nhau
    const statusLabels = {
      paid: 'Đã thanh toán',
      failed: 'Thanh toán thất bại',
      refunded: 'Đã hoàn tiền'
    }
    
    return statusLabels[order.paymentStatus] || order.paymentStatus
  }

  const getPaymentStatusColor = () => {
    if (!order) return 'bg-gray-100 text-gray-800 border-gray-200'
    
    if (order.paymentStatus === 'pending') {
      // Prepaid: màu vàng (cảnh báo cần thanh toán)
      // COD: màu xanh nhạt (thông tin bình thường)
      if (order.paymentMethod === 'prepaid') {
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      } else {
        return 'bg-blue-50 text-blue-700 border-blue-200'
      }
    }
    
    const statusColors = {
      paid: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      refunded: 'bg-blue-100 text-blue-800 border-blue-200'
    }
    
    return statusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const canCancelOrder = () => {
    // Chỉ có thể hủy khi orderStatus = confirmed và paymentStatus != paid
    return order && order.orderStatus === 'confirmed' && order.paymentStatus !== 'paid'
  }

  const shouldShowQRPayment = () => {
    // Hiển thị QR khi: paymentMethod = prepaid VÀ paymentStatus = pending
    return order && order.paymentMethod === 'prepaid' && order.paymentStatus === 'pending'
  }

  const handleValidatePayment = async () => {
    try {
      setValidating(true)
      
      // Step 1: Fetch latest transactions from email first
      toast.info('🔄 Đang kiểm tra giao dịch mới từ ngân hàng...')
      try {
        await transactionService.fetchFromEmail(10)
      } catch (fetchError) {
        console.warn('Failed to fetch emails:', fetchError)
        // Continue anyway - transaction might already exist in DB
      }
      
      // Step 2: Validate payment
      const response = await orderService.validatePayment(orderId)
      
      if (response.success) {
        if (response.result.paymentConfirmed) {
          toast.success('✅ Thanh toán đã được xác nhận!')
          loadOrderDetail() // Reload để cập nhật trạng thái
        } else {
          toast.warning('⏳ Chưa nhận được thanh toán. Vui lòng thử lại sau vài phút.')
        }
      } else {
        // Handle error codes
        if (response.error?.code === 7209) {
          toast.error('Đơn hàng không dùng phương thức chuyển khoản')
        } else if (response.error?.code === 7210) {
          toast.error('Đơn hàng đã được thanh toán rồi')
        } else {
          toast.error(response.error?.message || 'Không thể kiểm tra thanh toán')
        }
      }
    } catch (error) {
      console.error('Validate payment error:', error)
      toast.error('Có lỗi xảy ra khi kiểm tra thanh toán')
    } finally {
      setValidating(false)
    }
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
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getPaymentStatusColor()}`}>
                {getPaymentStatusLabel()}
              </span>
              
              {/* Fulfillment Status */}
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border
                ${order.fulfillmentStatus === 'shipping' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                ${order.fulfillmentStatus === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                ${order.fulfillmentStatus === 'pending_pickup' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                ${order.fulfillmentStatus === 'picked_up' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}
                ${order.fulfillmentStatus === 'pickup' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}
                ${order.fulfillmentStatus === 'returned' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
              `}>
                {order.fulfillmentStatus === 'shipping' && 'Đang giao hàng'}
                {order.fulfillmentStatus === 'delivered' && 'Đã giao hàng'}
                {order.fulfillmentStatus === 'pending_pickup' && 'Chờ lấy tại quầy'}
                {order.fulfillmentStatus === 'picked_up' && 'Đã nhận hàng'}
                {order.fulfillmentStatus === 'pickup' && 'Đã nhận hàng'}
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
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Thuế VAT (10%)</span>
                  <span>{formatPrice(order.vatAmount || (order.totalAmount * 0.1))}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>{formatPrice(order.shippingFee || 0)}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng thanh toán</span>
                  <span className="text-blue-600">{formatPrice(order.totalPay || (order.totalAmount + (order.vatAmount || 0) + (order.shippingFee || 0)))}</span>
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
              
              {/* Payment Method Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Phương thức thanh toán:</span>
                  <span className="text-sm font-medium text-gray-800">
                    {order.paymentMethod === 'prepaid' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt (COD)'}
                  </span>
                </div>
                
                {order.paymentStatus === 'pending' && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    {order.paymentMethod === 'prepaid' ? (
                      <p className="text-xs text-yellow-700">
                        ⏳ Vui lòng chuyển khoản và kiểm tra thanh toán bên dưới
                      </p>
                    ) : (
                      <p className="text-xs text-blue-700">
                        💵 Thanh toán khi nhận hàng
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* QR Payment Section */}
            {shouldShowQRPayment() && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                  Quét mã thanh toán
                </h2>
                
                <QRPayment
                  amount={order.totalPay || (order.totalAmount + (order.vatAmount || 0) + (order.shippingFee || 0))}
                  orderCode={`QMORD${order.orderId}`}
                  showInstructions={false}
                />
                
                <div className="mt-4 space-y-3">
                  <button
                    onClick={handleValidatePayment}
                    disabled={validating}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {validating ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Đang kiểm tra...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Kiểm tra thanh toán
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Sau khi chuyển khoản, bấm nút trên để kiểm tra và xác nhận thanh toán
                  </p>
                </div>
              </div>
            )}

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
