import api from './api'
import axios from 'axios'

/**
 * Transaction Service - Banking payment transaction management
 */

const transactionService = {
  /**
   * Fetch transactions from email (Admin only)
   * @param {number} maxEmails - Maximum number of emails to fetch (default: 10)
   * @returns {Promise<Array>} List of parsed transactions
   */
  async fetchFromEmail(maxEmails = 10) {
    // Use custom timeout for this endpoint (30 seconds instead of 10)
    // because fetching emails from IMAP server takes longer
    const response = await api.post(`/transactions/fetch-from-email?maxEmails=${maxEmails}`, {}, {
      timeout: 60000 // 60 seconds
    })
    return response
  },

  /**
   * Verify a transaction against an order
   * @param {Object} data - Verification data
   * @param {number} data.transactionId - Transaction ID
   * @param {number} data.expectedAmount - Expected amount from order
   * @param {string} data.orderCode - Order code (e.g., "QMORD12")
   * @returns {Promise<Object>} Verification result
   */
  async verifyTransaction(data) {
    const response = await api.post('/transactions/verify', data)
    return response
  },

  /**
   * Search transactions by order code
   * @param {string} orderCode - Order code to search
   * @returns {Promise<Array>} Matching transactions
   */
  async searchByOrderCode(orderCode) {
    const response = await api.get(`/transactions/search?orderCode=${orderCode}`)
    return response
  },

  /**
   * Get all transactions (Admin only)
   * @returns {Promise<Array>} All transactions
   */
  async getAllTransactions() {
    const response = await api.get('/transactions')
    return response
  },

  /**
   * Get transaction by ID
   * @param {number} id - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransaction(id) {
    const response = await api.get(`/transactions/${id}`)
    return response
  }
}

export default transactionService
