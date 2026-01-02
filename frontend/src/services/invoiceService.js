import api from './api'

/**
 * Invoice Service
 * Handles all invoice-related API calls
 * Updated: 2026-01-02 - Removed XML download (backend breaking change)
 */

export const invoiceService = {
  /**
   * Generate invoice for an order
   * @param {Object} invoiceData - { orderId, buyerTaxCode?, buyerCompanyName?, buyerCompanyAddress? }
   * @returns {Promise<Object>} Invoice response
   */
  generateInvoice: async (invoiceData) => {
    try {
      const response = await api.post('/invoices/generate', invoiceData)
      return response
    } catch (error) {
      console.error('❌ Generate invoice error:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Get invoice by order ID
   * @param {number} orderId - Order ID
   * @returns {Promise<Object>} Invoice response
   */
  getInvoiceByOrderId: async (orderId) => {
    try {
      const response = await api.get(`/invoices/order/${orderId}`)
      return response
    } catch (error) {
      // Don't log 400/404 errors - they just mean invoice doesn't exist yet
      if (error.response?.status !== 400 && error.response?.status !== 404) {
        console.error('Error fetching invoice:', error)
      }
      throw error
    }
  },

  /**
   * Get all invoices for current user
   * @returns {Promise<Array>} List of user invoices
   */
  getMyInvoices: async () => {
    try {
      const response = await api.get('/invoices/my-invoices')
      return response
    } catch (error) {
      console.error('Error fetching my invoices:', error)
      throw error
    }
  },

  /**
   * Download invoice PDF
   * @param {number} invoiceId - Invoice ID
   * @returns {Promise<Object>} Success response
   */
  downloadInvoicePdf: async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/download/pdf`, {
        responseType: 'blob'
      })
      
      // Create download link
      const blob = new Blob([response], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      return { success: true }
    } catch (error) {
      console.error('Error downloading invoice PDF:', error)
      throw error
    }
  },

  /**
   * Check if order has invoice
   * @param {number} orderId - Order ID
   * @returns {Promise<boolean>} True if invoice exists
   */
  checkInvoiceExists: async (orderId) => {
    try {
      const response = await invoiceService.getInvoiceByOrderId(orderId)
      return response.success && response.result
    } catch (error) {
      // If 404 or 400, invoice doesn't exist
      if (error.response?.status === 404 || error.response?.status === 400) {
        return false
      }
      // For other errors, still return false but log it
      console.warn(`Error checking invoice for order ${orderId}:`, error.response?.status)
      return false
    }
  }
}

export default invoiceService
