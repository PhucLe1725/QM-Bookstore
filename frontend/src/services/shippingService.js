import api from './api'

/**
 * Shipping Service
 * Handles shipping fee calculation and route information
 * 
 * Backend implementation required: See /backend/SHIPPING-AND-GOONG-API-SPEC.md
 */

const shippingService = {
  /**
   * Calculate shipping fee based on delivery address
   * @param {Object} data
   * @param {string} data.receiverAddress - Full delivery address
   * @param {number} data.subtotal - Order subtotal amount
   * @returns {Promise} Response with shipping fee, distance, duration
   */
  calculateShippingFee: async (data) => {
    try {
      const response = await api.post('/shipping/calculate', data)
      return response
    } catch (error) {
      console.error('Error calculating shipping fee:', error)
      throw error
    }
  }
}

export default shippingService
