import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import voucherService from '../services/voucherService'
import { Tag, Package, Truck, Calendar, Users } from 'lucide-react'

const Vouchers = () => {
  const navigate = useNavigate()
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadVouchers()
  }, [])

  const loadVouchers = async () => {
    try {
      setLoading(true)
      const response = await voucherService.getAvailableVouchers({ page: 0, size: 50 })
      
      if (response.success) {
        setVouchers(response.result.content || [])
      } else {
        setError('Không thể tải danh sách voucher')
      }
    } catch (err) {
      console.error('Error loading vouchers:', err)
      setError('Có lỗi xảy ra khi tải danh sách voucher')
    } finally {
      setLoading(false)
    }
  }

  const handleUseVoucher = (code) => {
    // Navigate to checkout with voucher pre-filled
    navigate('/checkout?voucher=' + code)
  }

  const copyVoucherCode = (code) => {
    navigator.clipboard.writeText(code)
    alert(`Đã sao chép mã: ${code}`)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getVoucherIcon = (applyTo) => {
    return applyTo === 'ORDER' ? <Package className="w-5 h-5" /> : <Truck className="w-5 h-5" />
  }

  const getVoucherBadge = (applyTo) => {
    if (applyTo === 'ORDER') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Giảm giá đơn hàng
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Miễn phí ship
      </span>
    )
  }

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mã giảm giá</h1>
          <p className="text-gray-600">Chọn mã giảm giá phù hợp cho đơn hàng của bạn</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {vouchers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có mã giảm giá khả dụng
            </h3>
            <p className="text-gray-600">
              Hiện tại không có mã giảm giá nào. Vui lòng quay lại sau!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2">
                      {getVoucherIcon(voucher.applyTo)}
                      <span className="font-bold text-lg tracking-wider">{voucher.code}</span>
                    </div>
                    <button
                      onClick={() => copyVoucherCode(voucher.code)}
                      className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded transition-colors"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  {/* Badge */}
                  <div className="mb-3">
                    {getVoucherBadge(voucher.applyTo)}
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {voucher.description || 'Mã giảm giá hấp dẫn'}
                  </p>

                  {/* Discount Info */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    {voucher.discountType === 'PERCENT' ? (
                      <div>
                        <p className="text-blue-900 font-bold text-lg">
                          Giảm {voucher.discountAmount}%
                        </p>
                        {voucher.maxDiscount && (
                          <p className="text-blue-700 text-sm">
                            Tối đa {formatPrice(voucher.maxDiscount)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-blue-900 font-bold text-lg">
                        Giảm {formatPrice(voucher.discountAmount)}
                      </p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {voucher.minOrderAmount > 0 && (
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        <span>Đơn tối thiểu: {formatPrice(voucher.minOrderAmount)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span>
                        Còn lại: {voucher.remainingUsage}/{voucher.usageLimit}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>HSD: {formatDate(voucher.validTo)}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleUseVoucher(voucher.code)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Sử dụng ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Vouchers
