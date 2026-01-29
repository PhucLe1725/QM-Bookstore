import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, Plus, Minus, X, Package, ArrowRight } from 'lucide-react'
import { cartService } from '../services/cartService'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../contexts/ToastContext'

const Cart = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const toast = useToast()

  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Track updating items for individual loading states
  const [updatingItems, setUpdatingItems] = useState(new Set())

  // Debounce timers for quantity updates
  const [updateTimers, setUpdateTimers] = useState({})

  // Checkout form
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [checkoutData, setCheckoutData] = useState({
    shippingAddress: '',
    phoneNumber: '',
    note: '',
    paymentMethod: 'COD'
  })

  // Add CSS to hide number input spinners
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      input[type="number"]::-webkit-inner-spin-button,
      input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type="number"] {
        -moz-appearance: textfield;
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  // Fetch cart
  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await cartService.getCart()
      if (response.success) {
        setCart(response.result)
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error)
      setCart({ items: [], summary: { totalItems: 0, selectedItems: 0, totalAmount: 0, selectedAmount: 0 } })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()

    // Cleanup timers on unmount
    return () => {
      Object.values(updateTimers).forEach(timer => clearTimeout(timer))
    }
  }, [])

  // Update quantity with optimistic UI and debounced API call
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return

    // Optimistic update - update local state immediately
    setCart(prevCart => {
      const updatedItems = prevCart.items.map(item => {
        if (item.id === itemId) {
          let amount;
          if (item.itemType === 'COMBO') {
            amount = item.combo.price * newQuantity;
          } else {
            amount = item.price * newQuantity;
          }
          return { ...item, quantity: newQuantity, amount, subtotal: amount }
        }
        return item
      })

      const totalAmount = updatedItems.reduce((sum, item) => sum + (item.amount || item.subtotal || 0), 0)
      const selectedAmount = updatedItems.reduce((sum, item) =>
        item.isSelected ? sum + (item.amount || item.subtotal || 0) : sum, 0)
      const totalQuantity = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      const selectedQuantity = updatedItems.reduce((sum, item) =>
        item.isSelected ? sum + item.quantity : sum, 0)

      return {
        ...prevCart,
        items: updatedItems,
        summary: {
          ...prevCart.summary,
          totalAmount,
          selectedAmount,
          totalQuantity,
          selectedQuantity
        }
      }
    })

    // Add item to updating set
    setUpdatingItems(prev => new Set(prev).add(itemId))

    // Clear existing timer for this item
    if (updateTimers[itemId]) {
      clearTimeout(updateTimers[itemId])
    }

    // Debounce API call (wait 500ms after last change)
    const timer = setTimeout(async () => {
      try {
        await cartService.updateQuantity(itemId, newQuantity)
        window.dispatchEvent(new Event('cartUpdated'))

        // Remove item from updating set
        setUpdatingItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
      } catch (error) {
        toast.error('Không thể cập nhật số lượng')
        // Revert on error
        await fetchCart()
        setUpdatingItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
      }
    }, 500)

    setUpdateTimers(prev => ({ ...prev, [itemId]: timer }))
  }

  // Handle direct input change - only update local display
  const handleQuantityInputChange = (e, itemId) => {
    const value = e.target.value

    // Block all non-digit characters immediately (including +, -, e, E, ., etc.)
    // Only allow empty string or digits 0-9
    if (value !== '' && !/^[0-9]+$/.test(value)) {
      e.preventDefault()
      return // Completely ignore invalid input
    }

    setCart(prevCart => {
      const updatedItems = prevCart.items.map(item => {
        if (item.id === itemId) {
          const numValue = value === '' ? '' : parseInt(value)
          let amount;
          if (value === '') {
            amount = 0;
          } else if (item.itemType === 'COMBO') {
            amount = item.combo.price * numValue;
          } else {
            amount = item.price * numValue;
          }
          return { ...item, quantity: numValue, amount, subtotal: amount }
        }
        return item
      })

      // Calculate new summary
      const totalAmount = updatedItems.reduce((sum, item) => sum + (item.amount || item.subtotal || 0), 0)
      const selectedAmount = updatedItems.reduce((sum, item) =>
        item.isSelected ? sum + (item.amount || item.subtotal || 0) : sum, 0)
      const totalQuantity = updatedItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
      const selectedQuantity = updatedItems.reduce((sum, item) =>
        item.isSelected ? sum + (item.quantity || 0) : sum, 0)

      return {
        ...prevCart,
        items: updatedItems,
        summary: {
          ...prevCart.summary,
          totalAmount,
          selectedAmount,
          totalQuantity,
          selectedQuantity
        }
      }
    })
  }

  // Handle Enter key press - commit the change
  const handleQuantityKeyPress = (e, itemId, currentQuantity) => {
    if (e.key === 'Enter') {
      e.target.blur() // Trigger blur event
      if (currentQuantity === '' || currentQuantity < 1) {
        handleUpdateQuantity(itemId, 1)
      } else {
        handleUpdateQuantity(itemId, parseInt(currentQuantity))
      }
    }
  }

  // Prevent paste of non-numeric content
  const handleQuantityPaste = (e) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    // Only allow paste if it's purely numeric (no +, -, e, E, ., spaces, etc.)
    if (/^[0-9]+$/.test(pastedText)) {
      const itemId = parseInt(e.target.dataset.itemId)
      const syntheticEvent = { target: { value: pastedText }, preventDefault: () => { } }
      handleQuantityInputChange(syntheticEvent, itemId)
    }
  }

  // Handle input blur - ensure valid quantity and commit
  const handleQuantityInputBlur = (itemId, currentQuantity) => {
    if (currentQuantity === '' || currentQuantity < 1) {
      // Revert to minimum 1
      handleUpdateQuantity(itemId, 1)
    } else {
      // Commit the change
      handleUpdateQuantity(itemId, parseInt(currentQuantity))
    }
  }

  // Toggle item selection
  const handleToggleSelection = async (itemId, selected) => {
    // Optimistic update
    setCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.map(item =>
        item.id === itemId ? { ...item, isSelected: selected } : item
      ),
      summary: {
        ...prevCart.summary,
        selectedItems: selected
          ? prevCart.summary.selectedItems + 1
          : prevCart.summary.selectedItems - 1,
        selectedAmount: prevCart.items.reduce((sum, item) =>
          (item.id === itemId ? selected : item.isSelected)
            ? sum + (item.subtotal || item.amount || 0)
            : sum, 0),
        selectedQuantity: prevCart.items.reduce((sum, item) =>
          (item.id === itemId ? selected : item.isSelected)
            ? sum + item.quantity
            : sum, 0)
      }
    }))

    try {
      await cartService.toggleSelection(itemId, selected)
    } catch (error) {
      toast.error('Không thể cập nhật lựa chọn')
      // Revert on error
      await fetchCart()
    }
  }

  // Select all
  const handleSelectAll = async (selected) => {
    // Optimistic update
    setCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.map(item => ({ ...item, isSelected: selected })),
      summary: {
        ...prevCart.summary,
        selectedItems: selected ? prevCart.summary.totalItems : 0,
        selectedAmount: selected ? prevCart.summary.totalAmount : 0,
        selectedQuantity: selected ? prevCart.summary.totalQuantity : 0
      }
    }))

    try {
      await cartService.selectAll(selected)
    } catch (error) {
      toast.error('Không thể cập nhật tất cả')
      // Revert on error
      await fetchCart()
    }
  }

  // Remove item
  const handleRemoveItem = async (itemId) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return

    try {
      const response = await cartService.removeItem(itemId)
      if (response.success) {
        toast.success('Đã xóa sản phẩm')
        await fetchCart()
        window.dispatchEvent(new Event('cartUpdated'))
      }
    } catch (error) {
      toast.error('Không thể xóa sản phẩm')
    }
  }

  // Clear cart
  const handleClearCart = async () => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) return

    try {
      const response = await cartService.clearCart()
      if (response.success) {
        toast.success('Đã xóa giỏ hàng')
        await fetchCart()
        window.dispatchEvent(new Event('cartUpdated'))
      }
    } catch (error) {
      toast.error('Không thể xóa giỏ hàng')
    }
  }

  // Checkout
  const handleCheckout = async (e) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để thanh toán')
      navigate('/login')
      return
    }

    if (cart?.summary?.selectedItems === 0) {
      toast.warning('Vui lòng chọn sản phẩm để thanh toán')
      return
    }

    try {
      setCheckoutLoading(true)
      const response = await cartService.checkout(checkoutData)

      if (response.success) {
        toast.success('Đặt hàng thành công!')
        navigate(`/orders/${response.result.orderId}`)
      }
    } catch (error) {
      toast.error('Thanh toán thất bại. Vui lòng thử lại!')
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-6">
              Bạn chưa có sản phẩm nào trong giỏ hàng
            </p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Giỏ hàng ({cart.summary.totalItems} sản phẩm)
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cart.summary.selectedItems === cart.summary.totalItems}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Chọn tất cả ({cart.summary.totalItems})
                </span>
              </label>

              <button
                onClick={handleClearCart}
                className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>Xóa tất cả</span>
              </button>
            </div>

            {/* Cart Items List */}
            {cart.items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
                {item.itemType === 'COMBO' ? (
                  // Render Combo Item
                  <div className="flex space-x-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 flex items-start pt-1">
                      <input
                        type="checkbox"
                        checked={item.isSelected}
                        onChange={(e) => handleToggleSelection(item.id, e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    {/* Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.combo?.imageUrl || '/placeholder.png'}
                        alt={item.combo?.name}
                        className="h-24 w-24 object-cover rounded-lg"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          <Package className="w-3 h-3 mr-1" />
                          Combo
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.combo?.name}
                      </h3>

                      {/* Combo items */}
                      {item.combo?.items && item.combo.items.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-600 font-medium mb-1">Bao gồm:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {item.combo.items.map((product, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="mr-1">•</span>
                                <span>{product.quantity}x {product.productName}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Pricing */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xl font-bold text-blue-600">
                          {formatPrice(item.combo?.price)}
                        </p>
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(item.combo?.originalPrice)}
                        </span>
                        <span className="text-sm font-medium px-2 py-1 bg-red-100 text-red-700 rounded">
                          -{item.combo?.discountPercentage?.toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Tiết kiệm: {formatPrice(item.combo?.discountAmount)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex-shrink-0 flex flex-col items-end space-y-3">
                      <div className="flex items-center space-x-2 border border-gray-300 rounded-lg">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                          className="p-2 hover:bg-gray-100 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={item.quantity}
                          data-item-id={item.id}
                          onChange={(e) => handleQuantityInputChange(e, item.id)}
                          onKeyPress={(e) => handleQuantityKeyPress(e, item.id, item.quantity)}
                          onPaste={handleQuantityPaste}
                          onBlur={(e) => handleQuantityInputBlur(item.id, e.target.value)}
                          disabled={updatingItems.has(item.id)}
                          className="w-16 px-2 py-2 text-center font-medium border-0 focus:ring-0 focus:outline-none disabled:bg-gray-50"
                        />
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={updatingItems.has(item.id)}
                          className="p-2 hover:bg-gray-100 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {updatingItems.has(item.id) && (
                        <span className="text-xs text-gray-500 italic">Đang cập nhật...</span>
                      )}

                      <div className="text-right">
                        <p className="text-sm text-gray-500">Thành tiền:</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
                      >
                        <X className="h-4 w-4" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Render Product Item
                  <div className="flex space-x-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 flex items-start pt-1">
                      <input
                        type="checkbox"
                        checked={item.isSelected}
                        onChange={(e) => handleToggleSelection(item.id, e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    {/* Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.productImage || '/placeholder.png'}
                        alt={item.productName}
                        className="h-24 w-24 object-cover rounded-lg"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.productName}
                      </h3>
                      <p className="text-xl font-bold text-blue-600">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex-shrink-0 flex flex-col items-end space-y-3">
                      <div className="flex items-center space-x-2 border border-gray-300 rounded-lg">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                          className="p-2 hover:bg-gray-100 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={item.quantity}
                          data-item-id={item.id}
                          onChange={(e) => handleQuantityInputChange(e, item.id)}
                          onKeyPress={(e) => handleQuantityKeyPress(e, item.id, item.quantity)}
                          onPaste={handleQuantityPaste}
                          onBlur={(e) => handleQuantityInputBlur(item.id, e.target.value)}
                          disabled={updatingItems.has(item.id)}
                          className="w-16 px-2 py-2 text-center font-medium border-0 focus:ring-0 focus:outline-none disabled:bg-gray-50"
                        />
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={updatingItems.has(item.id)}
                          className="p-2 hover:bg-gray-100 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {updatingItems.has(item.id) && (
                        <span className="text-xs text-gray-500 italic">Đang cập nhật...</span>
                      )}

                      <div className="text-right">
                        <p className="text-sm text-gray-500">Thành tiền:</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(item.subtotal || item.amount)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
                      >
                        <X className="h-4 w-4" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary & Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Thông tin đơn hàng
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(cart.summary.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sản phẩm đã chọn:</span>
                  <span className="font-medium text-gray-900">
                    {cart.summary.selectedItems} / {cart.summary.totalItems}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Số lượng đã chọn:</span>
                  <span className="font-medium text-gray-900">
                    {cart.summary.selectedQuantity}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Tổng tiền:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(cart.summary.selectedAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {!showCheckoutForm ? (
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.warning('Vui lòng đăng nhập để thanh toán')
                      navigate('/login')
                      return
                    }
                    if (cart.summary.selectedItems === 0) {
                      toast.warning('Vui lòng chọn sản phẩm để thanh toán')
                      return
                    }
                    // Chuyển đến trang checkout
                    navigate('/checkout')
                  }}
                  disabled={cart.summary.selectedItems === 0}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <span>Tiến hành thanh toán</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              ) : (
                <form onSubmit={handleCheckout} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ giao hàng <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={checkoutData.shippingAddress}
                      onChange={(e) => setCheckoutData({ ...checkoutData, shippingAddress: e.target.value })}
                      rows={3}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập địa chỉ giao hàng"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={checkoutData.phoneNumber}
                      onChange={(e) => setCheckoutData({ ...checkoutData, phoneNumber: e.target.value })}
                      pattern="[0-9]{10,15}"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú
                    </label>
                    <textarea
                      value={checkoutData.note}
                      onChange={(e) => setCheckoutData({ ...checkoutData, note: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ghi chú thêm (không bắt buộc)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phương thức thanh toán
                    </label>
                    <select
                      value={checkoutData.paymentMethod}
                      onChange={(e) => setCheckoutData({ ...checkoutData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                      <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                      <option value="MOMO">Ví MoMo</option>
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCheckoutForm(false)}
                      className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={checkoutLoading}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                      {checkoutLoading ? 'Đang xử lý...' : 'Đặt hàng'}
                    </button>
                  </div>
                </form>
              )}

              <button
                onClick={() => navigate('/products')}
                className="w-full mt-4 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Tiếp tục mua sắm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
