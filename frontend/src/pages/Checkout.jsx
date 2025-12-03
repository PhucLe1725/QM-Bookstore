import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { cartService } from '../services/cartService'
import { orderService } from '../services/orderService'
import userService from '../services/userService'
import voucherService from '../services/voucherService'
import { Package, MapPin, Phone, User, Tag, Truck, CreditCard, Store } from 'lucide-react'
import AddressSelector from '../components/AddressSelector'
import { getConfigValue, getStoreLocation, CONFIG_KEYS } from '../utils/systemConfig'

const Checkout = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Store info from system config
  const [storeInfo, setStoreInfo] = useState({
    address: 'Đang tải...',
    phone: '',
    hours: '8:00 - 20:00 (Thứ 2 - Chủ nhật)'
  })
  
  const [formData, setFormData] = useState({
    paymentMethod: 'cod', // prepaid, cod
    fulfillmentMethod: 'pickup', // delivery, pickup - Default: Nhận tại cửa hàng
    voucherCode: '',
    receiverName: user?.fullName || '',
    receiverPhone: user?.phoneNumber || '',
    receiverAddress: '',
    note: ''
  })

  const [voucherState, setVoucherState] = useState({
    valid: null, // null: chưa validate, true: hợp lệ, false: không hợp lệ
    discountValue: 0,
    applyTo: null,
    message: '',
    validating: false
  })

  const [locationData, setLocationData] = useState({
    lat: null,
    lng: null,
    distance: null,
    duration: null
  })

  const [summary, setSummary] = useState({
    subtotal: 0,
    shippingFee: 0,
    discount: 0,
    total: 0
  })

  const handleApplyVoucher = async () => {
    if (!formData.voucherCode.trim()) {
      setError('Vui lòng nhập mã voucher')
      return
    }

    setVoucherState(prev => ({ ...prev, validating: true }))
    setError('')

    try {
      const result = await voucherService.validateVoucher({
        voucherCode: formData.voucherCode.trim().toUpperCase(),
        orderTotal: summary.subtotal,
        shippingFee: summary.shippingFee || 0,
        userId: user?.id // Pass userId for per-user limit check
      })

      if (result.success && result.result.valid) {
        setVoucherState({
          valid: true,
          discountValue: result.result.discountValue,
          applyTo: result.result.applyTo,
          message: result.result.message || 'Áp dụng voucher thành công',
          validating: false
        })
        
        // Update voucher code to uppercase
        setFormData(prev => ({ ...prev, voucherCode: formData.voucherCode.trim().toUpperCase() }))
      } else {
        setVoucherState({
          valid: false,
          discountValue: 0,
          applyTo: null,
          message: result.result?.message || 'Voucher không hợp lệ',
          validating: false
        })
      }
    } catch (err) {
      console.error('Error validating voucher:', err)
      setVoucherState({
        valid: false,
        discountValue: 0,
        applyTo: null,
        message: 'Không thể validate voucher',
        validating: false
      })
    }
  }

  const handleRemoveVoucher = () => {
    setFormData(prev => ({ ...prev, voucherCode: '' }))
    setVoucherState({
      valid: null,
      discountValue: 0,
      applyTo: null,
      message: '',
      validating: false
    })
  }

  useEffect(() => {
    loadCartItems()
    loadUserProfile()
    loadStoreInfo()
    
    // Check for voucher in URL
    const voucherFromUrl = searchParams.get('voucher')
    if (voucherFromUrl) {
      setFormData(prev => ({ ...prev, voucherCode: voucherFromUrl.toUpperCase() }))
      // Auto-validate after cart loads
      setTimeout(() => handleApplyVoucher(), 1000)
    }
  }, [])

  useEffect(() => {
    calculateSummary()
  }, [cartItems, formData.fulfillmentMethod, locationData.distance, voucherState.discountValue])

  // Auto re-validate voucher khi phí ship thay đổi (nếu đã có voucher valid)
  useEffect(() => {
    if (voucherState.valid && formData.voucherCode) {
      // Nếu có voucher đang active, validate lại khi shipping fee thay đổi
      const revalidateVoucher = async () => {
        try {
          const result = await voucherService.validateVoucher({
            voucherCode: formData.voucherCode,
            orderTotal: summary.subtotal,
            shippingFee: summary.shippingFee || 0,
            userId: user?.id // Pass userId for per-user limit check
          })

          if (result.success && result.result.valid) {
            setVoucherState(prev => ({
              ...prev,
              discountValue: result.result.discountValue,
              applyTo: result.result.applyTo,
              message: result.result.message || 'Áp dụng voucher thành công'
            }))
          } else {
            // Voucher không còn hợp lệ với giá trị mới
            setVoucherState({
              valid: false,
              discountValue: 0,
              applyTo: null,
              message: result.result?.message || 'Voucher không còn hợp lệ',
              validating: false
            })
          }
        } catch (err) {
          console.error('Error re-validating voucher:', err)
        }
      }

      revalidateVoucher()
    }
  }, [summary.subtotal, summary.shippingFee])

  // Tối ưu hóa: Chỉ tính toán khoảng cách khi cần thiết
  useEffect(() => {
    // Điều kiện: chọn 'giao hàng', có địa chỉ, và chưa có thông tin khoảng cách
    const shouldCalculateRoute =
      formData.fulfillmentMethod === 'delivery' &&
      formData.receiverAddress &&
      !locationData.distance

    if (shouldCalculateRoute) {
      geocodeAndCalculateRoute(formData.receiverAddress)
    }
  }, [formData.fulfillmentMethod, formData.receiverAddress, locationData.distance])

  const loadStoreInfo = async () => {
    try {
      const [address, phone, hours] = await Promise.all([
        getConfigValue(CONFIG_KEYS.STORE_ADDRESS, 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội'),
        getConfigValue(CONFIG_KEYS.STORE_PHONE, ''),
        getConfigValue('store_hours', '8:00 - 20:00 (Thứ 2 - Chủ nhật)')
      ])

      setStoreInfo({ address, phone, hours })
    } catch (error) {
      console.error('Error loading store info:', error)
      // Giữ giá trị mặc định nếu lỗi
    }
  }

  const loadUserProfile = async () => {
    try {
      const response = await userService.getMyProfile()
      
      if (response.success && response.result) {
        const profile = response.result
        
        setFormData(prev => ({
          ...prev,
          receiverName: profile.fullName || '',
          receiverPhone: profile.phoneNumber || '',
          receiverAddress: profile.address || ''
        }))
      }
    } catch (err) {
      console.error('Error loading user profile:', err)
      // Không hiển thị error, vì user vẫn có thể nhập manual
    }
  }

  const geocodeAndCalculateRoute = async (address) => {
    try {
      const API_KEY = import.meta.env.GOONG_API_KEY || import.meta.env.VITE_GOONG_API_KEY
      
      // Geocode address to get lat/lng
      const geocodeResponse = await fetch(
        `https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=${API_KEY}`
      )
      const geocodeData = await geocodeResponse.json()
      
      if (geocodeData.results && geocodeData.results[0]) {
        const location = geocodeData.results[0].geometry.location
        const lat = location.lat
        const lng = location.lng
        
        // Fetch store location from system config (cached)
        const storeLocation = await getStoreLocation()
        
        // Calculate route from store to destination
        const origin = `${storeLocation.lat},${storeLocation.lng}`
        const destination = `${lat},${lng}`
        
        const routeResponse = await fetch(
          `https://rsapi.goong.io/Direction?origin=${origin}&destination=${destination}&vehicle=car&api_key=${API_KEY}`
        )
        const routeData = await routeResponse.json()
        
        if (routeData.routes && routeData.routes[0]) {
          const leg = routeData.routes[0].legs[0]
          const distanceKm = (leg.distance.value / 1000).toFixed(2)
          const durationMin = Math.round(leg.duration.value / 60)
          
          setLocationData({
            lat,
            lng,
            distance: distanceKm,
            duration: durationMin
          })
        }
      }
    } catch (error) {
      console.error('Error geocoding and calculating route:', error)
    }
  }

  const loadCartItems = async () => {
    try {
      setLoading(true)
      const response = await cartService.getCart()
      
      if (response.success) {
        // Chỉ lấy items được chọn
        const selectedItems = response.result?.items?.filter(item => item.isSelected) || []
        
        if (selectedItems.length === 0) {
          setError('Giỏ hàng trống hoặc chưa chọn sản phẩm nào')
          setTimeout(() => navigate('/cart'), 2000)
          return
        }
        
        setCartItems(selectedItems)
      }
    } catch (err) {
      console.error('Error loading cart:', err)
      setError('Không thể tải giỏ hàng')
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = () => {
    const subtotal = cartItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    )
    let shippingFee = null
    if (formData.fulfillmentMethod === 'delivery') {
      if (locationData.distance) {
        shippingFee = calculateShippingFee(parseFloat(locationData.distance))
      }
      // Nếu delivery nhưng chưa có distance, để null
    } else {
      // Pickup = miễn phí
      shippingFee = 0
    }
    
    // Calculate discount from voucher
    let discount = 0
    if (voucherState.valid && voucherState.discountValue > 0) {
      discount = voucherState.discountValue
    }
    
    const total = subtotal + (shippingFee || 0) - discount
    setSummary({ subtotal, shippingFee, discount, total })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddressChange = (data) => {
    setFormData(prev => ({ ...prev, receiverAddress: data.address }))
    setLocationData({
      lat: data.lat,
      lng: data.lng,
      distance: data.distance,
      duration: data.duration
    })
    
    // Có thể tính phí ship dựa trên khoảng cách
    if (data.distance) {
      const calculatedShippingFee = calculateShippingFee(parseFloat(data.distance))
      setSummary(prev => ({
        ...prev,
        shippingFee: calculatedShippingFee,
        total: prev.subtotal + calculatedShippingFee - prev.discount
      }))
    }
  }

  const calculateShippingFee = (distanceKm) => {
    // Tính phí ship theo km: 15000đ cho 5km đầu, sau đó 3000đ/km
    if (distanceKm <= 5) return 15000
    return 15000 + Math.ceil((distanceKm - 5) * 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Validate common fields for both methods
      if (!formData.receiverName || !formData.receiverPhone) {
        setError('Vui lòng điền họ tên và số điện thoại người nhận')
        setSubmitting(false)
        return
      }

      // Validate delivery-specific fields
      if (formData.fulfillmentMethod === 'delivery') {
        if (!formData.receiverAddress) {
          setError('Vui lòng điền đầy đủ thông tin nhận hàng')
          setSubmitting(false)
          return
        }
      }

      const checkoutData = {
        paymentMethod: formData.paymentMethod,
        fulfillmentMethod: formData.fulfillmentMethod,
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        voucherCode: formData.voucherCode || null,
        note: formData.note || null,
        // Delivery-specific info
        ...(formData.fulfillmentMethod === 'delivery' && {
          receiverAddress: formData.receiverAddress,
          shippingFee: summary.shippingFee
        })
      }

      const result = await orderService.checkout(checkoutData)

      if (result.success) {
        // Nếu prepaid và có paymentUrl → redirect thanh toán
        if (formData.paymentMethod === 'prepaid' && result.result.paymentUrl) {
          window.location.href = result.result.paymentUrl
        } else {
          // COD hoặc không có paymentUrl → redirect order detail
          navigate(`/orders/${result.result.orderId}`)
        }
      } else {
        setError(result.error?.message || 'Đặt hàng thất bại')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError('Có lỗi xảy ra khi đặt hàng')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Thông tin nhận hàng */}
            <div className="lg:col-span-2 space-y-6">
              {/* Thông tin người nhận */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Thông tin người nhận
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      name="receiverName"
                      value={formData.receiverName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      name="receiverPhone"
                      value={formData.receiverPhone}
                      onChange={handleInputChange}
                      pattern="0[0-9]{9,10}"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Phương thức nhận hàng */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-blue-600" />
                  Phương thức nhận hàng
                </h2>
                
                <div className="space-y-3">
                  {/* Delivery Option */}
                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, fulfillmentMethod: 'delivery' }))}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.fulfillmentMethod === 'delivery' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="fulfillmentMethod"
                        value="delivery"
                        checked={formData.fulfillmentMethod === 'delivery'}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">Giao hàng tận nơi</p>
                        <p className="text-sm text-gray-600">Giao hàng trong 2-3 ngày</p>
                      </div>
                    </div>
                  </div>

                  {/* Pickup Option */}
                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, fulfillmentMethod: 'pickup' }))}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.fulfillmentMethod === 'pickup' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="fulfillmentMethod"
                          value="pickup"
                          checked={formData.fulfillmentMethod === 'pickup'}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">Nhận tại cửa hàng</p>
                          <p className="text-sm text-gray-600">Sẵn sàng trong 1-2 giờ</p>
                        </div>
                      </div>
                      <p className="font-semibold text-green-600">Miễn phí</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Địa chỉ giao hàng - Only show for delivery */}
              {formData.fulfillmentMethod === 'delivery' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    Địa chỉ giao hàng
                  </h2>
                  
                  <AddressSelector 
                    onAddressChange={handleAddressChange}
                    initialAddress={formData.receiverAddress}
                  />
                  
                  {/* Hiển thị thông tin khoảng cách nếu có */}
                  {locationData.distance && locationData.duration && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-gray-600">Khoảng cách:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {locationData.distance} km
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pickup Notice - Only show for pickup */}
              {formData.fulfillmentMethod === 'pickup' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-6">
                  <div className="flex items-start">
                    <Store className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Nhận hàng tại cửa hàng</h3>
                      <p className="text-blue-800 text-sm mb-2">
                        Đơn hàng của bạn sẽ sẵn sàng trong vòng 1-2 giờ. Chúng tôi sẽ gửi thông báo khi đơn hàng đã sẵn sàng để nhận.
                      </p>
                      <div className="bg-white rounded p-3 mt-3">
                        <p className="font-medium text-gray-900 mb-1">Địa chỉ cửa hàng:</p>
                        <p className="text-gray-700 text-sm">{storeInfo.address}</p>
                        {storeInfo.phone && (
                          <p className="text-gray-700 text-sm mt-1">
                            <Phone className="inline-block w-3 h-3 mr-1" />
                            {storeInfo.phone}
                          </p>
                        )}
                        <p className="text-gray-600 text-sm mt-1">Giờ mở cửa: {storeInfo.hours}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Phương thức thanh toán */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                  Phương thức thanh toán
                </h2>
                
                <div className="space-y-3">
                  {/* COD Option */}
                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod' }))}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.paymentMethod === 'cod' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</p>
                        <p className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</p>
                      </div>
                    </div>
                  </div>

                  {/* Prepaid Option */}
                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'prepaid' }))}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.paymentMethod === 'prepaid' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="prepaid"
                        checked={formData.paymentMethod === 'prepaid'}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">Thanh toán online</p>
                        <p className="text-sm text-gray-600">VNPay, MoMo, ZaloPay, Thẻ ATM/Visa/Mastercard</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mã giảm giá */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-blue-600" />
                  Mã giảm giá
                </h2>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="voucherCode"
                    value={formData.voucherCode}
                    onChange={handleInputChange}
                    placeholder="Nhập mã giảm giá"
                    disabled={voucherState.valid}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {voucherState.valid ? (
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Xóa
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      disabled={voucherState.validating || !formData.voucherCode.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {voucherState.validating ? 'Đang kiểm tra...' : 'Áp dụng'}
                    </button>
                  )}
                </div>
                
                {/* Voucher validation message */}
                {voucherState.valid === true && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm font-medium">
                      ✓ {voucherState.message}
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      Giảm {formatPrice(voucherState.discountValue)} 
                      {voucherState.applyTo === 'ORDER' ? ' cho đơn hàng' : ' cho phí ship'}
                    </p>
                  </div>
                )}
                
                {voucherState.valid === false && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">
                      ✗ {voucherState.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Ghi chú đơn hàng */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Ghi chú đơn hàng
                </h2>
                
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Ghi chú cho người bán (ví dụ: Giao hàng giờ hành chính, gọi trước khi giao...)"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Danh sách sản phẩm */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-blue-600" />
                  Sản phẩm ({cartItems.length})
                </h2>
                
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 py-4 border-b last:border-b-0">
                      <img
                        src={item.thumbnail || '/placeholder.png'}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.productName}</h3>
                        <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">{formatPrice(item.price)}</p>
                        <p className="text-sm text-gray-600">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Tổng kết đơn hàng */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Tổng kết đơn hàng</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span>{formatPrice(summary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span>
                      {formData.fulfillmentMethod === 'delivery' && (summary.shippingFee === null || summary.shippingFee === 0)
                        ? 'Chọn địa chỉ để tính phí'
                        : formatPrice(summary.shippingFee || 0)}
                    </span>
                  </div>
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá</span>
                      <span>-{formatPrice(summary.discount)}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Tổng cộng</span>
                    <span className="text-blue-600">{formatPrice(summary.total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || cartItems.length === 0}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Đặt hàng
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Bằng cách đặt hàng, bạn đồng ý với Điều khoản sử dụng của chúng tôi
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Checkout
