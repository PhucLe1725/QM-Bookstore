import api from './api'

export const orderService = {
  // Checkout - Tạo đơn hàng từ giỏ hàng
  checkout: async (checkoutData) => {
    try {
      const response = await api.post('/orders/checkout', checkoutData)
      return { success: true, result: response.result || response }
    } catch (error) {
      console.error('Checkout error:', error)
      return { 
        success: false, 
        error: error.response?.data || { message: 'Checkout failed' }
      }
    }
  },

  // Get my orders with filter support
  getMyOrders: async (filters = {}) => {
    try {
      const params = {
        page: filters.page || 0,
        size: filters.size || 10
      }
      
      // Add status filters from documentation
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus
      if (filters.fulfillmentStatus) params.fulfillmentStatus = filters.fulfillmentStatus
      if (filters.orderStatus) params.orderStatus = filters.orderStatus
      
      const response = await api.get('/orders/my-orders', { params })
      return { success: true, result: response.result || response }
    } catch (error) {
      console.error('Get my orders error:', error)
      return { success: false, error: error.response?.data }
    }
  },

  // Get order detail
  getOrderDetail: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`)
      return { success: true, result: response.result || response }
    } catch (error) {
      console.error('Get order detail error:', error)
      return { success: false, error: error.response?.data }
    }
  },

  // Cancel order
  cancelOrder: async (orderId, reason) => {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`, { reason })
      return { success: true, result: response.result || response }
    } catch (error) {
      console.error('Cancel order error:', error)
      return { success: false, error: error.response?.data }
    }
  },

  // Reorder
  reorder: async (orderId) => {
    try {
      const response = await api.post(`/orders/${orderId}/reorder`)
      return { success: true, result: response.result || response }
    } catch (error) {
      console.error('Reorder error:', error)
      return { success: false, error: error.response?.data }
    }
  },

  // Admin: Get all orders with 3-axis status filters
  getAllOrders: async (filters = {}) => {
    try {
      const params = {
        page: filters.page || 0,
        size: filters.size || 20
      }
      
      // 3-axis status system from documentation
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus
      if (filters.fulfillmentStatus) params.fulfillmentStatus = filters.fulfillmentStatus
      if (filters.orderStatus) params.orderStatus = filters.orderStatus
      
      const response = await api.get('/orders/manage', { params })
      return { success: true, result: response.result || response }
    } catch (error) {
      console.error('Get all orders error:', error)
      return { success: false, error: error.response?.data }
    }
  },

  // Admin: Update order status
  updateOrderStatus: async (orderId, statusData) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, statusData)
      return { success: true, result: response.result || response }
    } catch (error) {
      console.error('Update order status error:', error)
      return { success: false, error: error.response?.data }
    }
  },

  // Get order by ID (alias for getOrderDetail)
  getOrderById: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`)
      return { success: true, result: response.result || response }
    } catch (error) {
      console.error('Get order by ID error:', error)
      return { success: false, error: error.response?.data }
    }
  },

  // Validate payment - Kiểm tra xem đơn hàng đã được thanh toán chưa
  validatePayment: async (orderId) => {
    try {
      const response = await api.post(`/orders/${orderId}/validate-payment`)
      return { success: true, result: response.result || response }
    } catch (error) {
      console.error('Validate payment error:', error)
      return { success: false, error: error.response?.data }
    }
  }
}

export default orderService
