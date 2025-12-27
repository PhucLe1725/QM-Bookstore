import api from './api'

/**
 * Inventory Service - Quản lý kho hàng
 * Chỉ dành cho admin/manager
 */

const inventoryService = {
  /**
   * Lấy danh sách giao dịch kho có filter và phân trang
   * @param {Object} params - Filter parameters
   * @param {number} params.skipCount - Số bản ghi bỏ qua
   * @param {number} params.maxResultCount - Số bản ghi/trang
   * @param {string} params.transactionType - IN | OUT | DAMAGED | STOCKTAKE
   * @param {string} params.referenceType - ORDER | MANUAL | STOCKTAKE
   * @param {number} params.referenceId - ID tham chiếu
   * @param {number} params.productId - ID sản phẩm
   * @returns {Promise} Response with transaction list
   */
  getTransactions: async (params = {}) => {
    try {
      // api.js interceptor already returns response.data
      const response = await api.get('/inventory/transactions', { params })
      return response
    } catch (error) {
      throw error
    }
  },

  /**
   * Lấy chi tiết giao dịch kho
   * @param {number} id - Transaction ID
   * @returns {Promise} Response with transaction detail
   */
  getTransactionById: async (id) => {
    try {
      const response = await api.get(`/inventory/transactions/${id}`)
      return response
    } catch (error) {
      throw error
    }
  },

  /**
   * Tạo giao dịch kho mới (IN/DAMAGED/STOCKTAKE)
   * @param {Object} data - Transaction data
   * @param {string} data.transactionType - IN | DAMAGED | STOCKTAKE
   * @param {string} data.referenceType - MANUAL | STOCKTAKE
   * @param {number} data.referenceId - ID tham chiếu (optional)
   * @param {string} data.note - Ghi chú (optional)
   * @param {Array} data.items - Danh sách sản phẩm
   * @param {number} data.items[].productId - ID sản phẩm
   * @param {string} data.items[].changeType - PLUS | MINUS
   * @param {number} data.items[].quantity - Số lượng
   * @returns {Promise} Response with created transaction
   */
  createTransaction: async (data) => {
    try {
      const response = await api.post('/inventory/transactions', data)
      return response
    } catch (error) {
      throw error
    }
  },

  /**
   * Xuất kho từ đơn hàng (OUT transaction)
   * @param {Object} data - Export data
   * @param {number} data.orderId - Order ID
   * @param {string} data.note - Ghi chú (optional)
   * @returns {Promise} Response with created OUT transaction
   */
  exportFromOrder: async (data) => {
    try {
      const response = await api.post('/inventory/transactions/out-from-order', data)
      return response
    } catch (error) {
      throw error
    }
  },

  /**
   * Kiểm tra đơn hàng đã xuất kho chưa
   * @param {number} orderId - Order ID
   * @returns {Promise<boolean>} True nếu đã xuất kho
   */
  checkOrderExported: async (orderId) => {
    try {
      // api.js interceptor already returns response.data
      // So response = {success, code, message, result}
      const response = await api.get('/inventory/transactions', {
        params: {
          referenceType: 'ORDER',
          referenceId: orderId,
          transactionType: 'OUT',
          maxResultCount: 1
        }
      })
      
      // Check if transactions exist in result.data array
      return response?.success && response.result?.data?.length > 0
    } catch (error) {
      // Return false instead of throwing to prevent UI errors
      return false
    }
  }
}

export default inventoryService
