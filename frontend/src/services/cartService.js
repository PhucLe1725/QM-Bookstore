import api from './api'

/**
 * Cart Service
 * Handles all cart-related API calls
 */

// Generate session ID for guest users
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Get or create session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('cart_session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem('cart_session_id', sessionId)
  }
  return sessionId
}

// Get headers with auth token or session ID
const getCartHeaders = () => {
  const token = localStorage.getItem('token')
  const headers = {}
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  } else {
    const sessionId = getSessionId()
    headers['X-Session-ID'] = sessionId
  }
  
  return headers
}

export const cartService = {
  // Add product to cart
  addToCart: async (productId, quantity = 1) => {
    try {
      const headers = getCartHeaders()
      
      const response = await api.post(
        '/cart/add',
        { productId, quantity },
        { headers }
      )
      return response
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  },

  // Add combo to cart
  addComboToCart: async (comboId, quantity = 1) => {
    try {
      const headers = getCartHeaders()
      
      const response = await api.post(
        '/cart/combo',
        { comboId, quantity },
        { headers }
      )
      return response
    } catch (error) {
      console.error('Error adding combo to cart:', error)
      throw error
    }
  },

  // Get cart
  getCart: async () => {
    try {
      const response = await api.get('/cart', {
        headers: getCartHeaders()
      })
      return response
    } catch (error) {
      console.error('Error fetching cart:', error)
      throw error
    }
  },

  // Update cart item quantity
  updateQuantity: async (itemId, quantity) => {
    try {
      const response = await api.put(
        `/cart/items/${itemId}`,
        { quantity },
        { headers: getCartHeaders() }
      )
      return response
    } catch (error) {
      console.error('Error updating quantity:', error)
      throw error
    }
  },

  // Toggle item selection
  toggleSelection: async (itemId, selected) => {
    try {
      const response = await api.put(
        `/cart/items/${itemId}/select`,
        { selected },
        { headers: getCartHeaders() }
      )
      return response
    } catch (error) {
      console.error('Error toggling selection:', error)
      throw error
    }
  },

  // Select/deselect all items
  selectAll: async (selected) => {
    try {
      const response = await api.put(
        '/cart/select-all',
        { selected },
        { headers: getCartHeaders() }
      )
      return response
    } catch (error) {
      console.error('Error selecting all:', error)
      throw error
    }
  },

  // Remove item from cart
  removeItem: async (itemId) => {
    try {
      const response = await api.delete(`/cart/items/${itemId}`, {
        headers: getCartHeaders()
      })
      return response
    } catch (error) {
      console.error('Error removing item:', error)
      throw error
    }
  },

  // Clear cart
  clearCart: async () => {
    try {
      const response = await api.delete('/cart/clear', {
        headers: getCartHeaders()
      })
      return response
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    }
  }
}
