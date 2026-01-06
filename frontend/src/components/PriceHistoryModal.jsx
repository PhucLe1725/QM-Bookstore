import React, { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, Minus, DollarSign, Calendar, User, FileText, Save, AlertCircle } from 'lucide-react'
import { priceHistoryService, productService } from '../services'
import { useToast } from '../contexts/ToastContext'

const PriceHistoryModal = ({ isOpen, onClose, product, onPriceUpdated }) => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [latestChange, setLatestChange] = useState(null)
  const [trend, setTrend] = useState(null)
  
  // Form for new price
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [newPrice, setNewPrice] = useState('')
  const [priceChangeReason, setPriceChangeReason] = useState('')
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (isOpen && product) {
      // Reset state when product changes to avoid showing old data
      setHistory([])
      setLatestChange(null)
      setTrend(null)
      setShowUpdateForm(false)
      setFormErrors({})
      
      loadPriceHistory()
      setNewPrice(product.price || '')
    }
  }, [isOpen, product?.id]) // Use product.id to detect actual product change

  const loadPriceHistory = async () => {
    if (!product?.id) return

    setLoading(true)
    try {
      const [historyRes, trendRes] = await Promise.all([
        priceHistoryService.getProductPriceHistory(product.id, { page: 0, size: 10 }).catch(() => null),
        priceHistoryService.getPriceTrend(product.id).catch(() => null)
      ])

      if (historyRes?.success) {
        setHistory(historyRes.result || [])
      }
      if (trendRes?.success) {
        setTrend(trendRes.result)
        // Use latestChange from trend API
        if (trendRes.result.latestChange) {
          setLatestChange(trendRes.result.latestChange)
        }
      }
    } catch (error) {
      console.error('Error loading price history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
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

  const getTrendIcon = (changePercentage) => {
    if (changePercentage > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (changePercentage < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getTrendColor = (changePercentage) => {
    if (changePercentage > 0) return 'text-green-600'
    if (changePercentage < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const validateForm = () => {
    const errors = {}
    
    if (!newPrice || parseFloat(newPrice) <= 0) {
      errors.newPrice = 'Giá phải lớn hơn 0'
    }
    
    if (parseFloat(newPrice) === parseFloat(product.price)) {
      errors.newPrice = 'Giá mới phải khác giá hiện tại'
    }
    
    if (!priceChangeReason || priceChangeReason.trim().length < 5) {
      errors.priceChangeReason = 'Vui lòng nhập lý do thay đổi giá (tối thiểu 5 ký tự)'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUpdatePrice = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await productService.updateProduct(product.id, {
        price: parseFloat(newPrice),
        priceChangeReason: priceChangeReason.trim()
      })

      if (response.success) {
        showToast('Cập nhật giá thành công!', 'success')
        setShowUpdateForm(false)
        setNewPrice('')
        setPriceChangeReason('')
        setFormErrors({})
        
        // Reload history
        await loadPriceHistory()
        
        // Notify parent to refresh product list
        if (onPriceUpdated) {
          onPriceUpdated()
        }
      }
    } catch (error) {
      console.error('Error updating price:', error)
      showToast('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Lịch Sử Giá - {trend?.productName || product?.name}
                </h3>
                <p className="text-sm text-blue-100 mt-1">
                  Giá hiện tại: <span className="font-bold">{formatPrice(trend?.currentPrice || product?.price)}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* Trend Summary */}
            {trend && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Xu hướng giá</p>
                    <p className={`text-2xl font-bold ${getTrendColor(trend.latestChange?.percentage || 0)}`}>
                      {(trend.trend === 'INCREASING' || trend.trend === 'INCREASED') && '📈 Tăng'}
                      {(trend.trend === 'DECREASING' || trend.trend === 'DECREASED') && '📉 Giảm'}
                      {trend.trend === 'STABLE' && '➡️ Ổn định'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Số lần thay đổi</p>
                    <p className="text-2xl font-bold text-blue-600">{trend.changeCount || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Update Price Button */}
            {!showUpdateForm && (
              <div className="mb-6">
                <button
                  onClick={() => setShowUpdateForm(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <DollarSign className="h-5 w-5" />
                  Cập Nhật Giá Mới
                </button>
              </div>
            )}

            {/* Update Price Form */}
            {showUpdateForm && (
              <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Cập Nhật Giá Sản Phẩm</h4>
                </div>
                
                <form onSubmit={handleUpdatePrice}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá hiện tại
                      </label>
                      <input
                        type="text"
                        value={formatPrice(product.price)}
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá mới <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.newPrice ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nhập giá mới"
                      />
                      {formErrors.newPrice && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.newPrice}</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lý do thay đổi giá <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={priceChangeReason}
                      onChange={(e) => setPriceChangeReason(e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.priceChangeReason ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="VD: Giảm giá khuyến mãi Tết, Tăng giá do chi phí nhập hàng tăng..."
                    />
                    {formErrors.priceChangeReason && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.priceChangeReason}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUpdateForm(false)
                        setNewPrice(product.price)
                        setPriceChangeReason('')
                        setFormErrors({})
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Price History Table */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Lịch Sử Thay Đổi
              </h4>
              
              {loading && history.length === 0 && !latestChange ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : history.length === 0 && !latestChange ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Chưa có lịch sử thay đổi giá</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thời gian
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Giá cũ
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Giá mới
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thay đổi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lý do
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.length > 0 ? (
                        history.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(record.changedAt)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                              {formatPrice(record.oldPrice)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatPrice(record.newPrice)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className={`flex items-center gap-1 font-semibold ${getTrendColor(record.changePercentage)}`}>
                                {getTrendIcon(record.changePercentage)}
                                <span>{priceHistoryService.formatChangePercentage(record.changePercentage)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="max-w-xs truncate" title={record.reason}>
                                {record.reason || '-'}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : latestChange ? (
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(latestChange.date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                            {formatPrice(latestChange.from)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPrice(latestChange.to)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className={`flex items-center gap-1 font-semibold ${getTrendColor(latestChange.percentage)}`}>
                              {getTrendIcon(latestChange.percentage)}
                              <span>{priceHistoryService.formatChangePercentage(latestChange.percentage)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="max-w-xs truncate">
                              -
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceHistoryModal
