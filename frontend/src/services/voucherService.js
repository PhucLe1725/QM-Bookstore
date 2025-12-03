import api from './api'

class VoucherService {
  /**
   * Validate voucher trước khi checkout
   * @param {Object} data - { voucherCode, orderTotal, shippingFee }
   * @returns {Promise<Object>} Validation result
   */
  async validateVoucher(data) {
    try {
      const response = await api.post('/vouchers/validate', data)
      // api interceptor already returns response.data, so response = { success, code, message, result }
      return response
    } catch (error) {
      console.error('Error validating voucher:', error)
      throw error
    }
  }

  /**
   * Lấy danh sách voucher khả dụng (public)
   * @param {Object} params - { page, size }
   * @returns {Promise<Object>} Page of available vouchers
   */
  async getAvailableVouchers(params = { page: 0, size: 20 }) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        size: params.size.toString()
      })
      
      const response = await api.get(`/vouchers/available?${queryParams}`)
      return response
    } catch (error) {
      console.error('Error getting available vouchers:', error)
      throw error
    }
  }

  /**
   * Lấy thông tin voucher theo ID
   * @param {number} id - Voucher ID
   * @returns {Promise<Object>} Voucher details
   */
  async getVoucher(id) {
    try {
      const response = await api.get(`/vouchers/${id}`)
      return response
    } catch (error) {
      console.error('Error getting voucher:', error)
      throw error
    }
  }

  /**
   * [ADMIN] Tạo voucher mới
   * @param {Object} data - Voucher data
   * @returns {Promise<Object>} Created voucher
   */
  async createVoucher(data) {
    try {
      const response = await api.post('/vouchers', data)
      return response
    } catch (error) {
      console.error('Error creating voucher:', error)
      throw error
    }
  }

  /**
   * [ADMIN] Cập nhật voucher
   * @param {number} id - Voucher ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated voucher
   */
  async updateVoucher(id, data) {
    try {
      const response = await api.put(`/vouchers/${id}`, data)
      return response
    } catch (error) {
      console.error('Error updating voucher:', error)
      throw error
    }
  }

  /**
   * [ADMIN] Xóa voucher
   * @param {number} id - Voucher ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteVoucher(id) {
    try {
      const response = await api.delete(`/vouchers/${id}`)
      return response
    } catch (error) {
      console.error('Error deleting voucher:', error)
      throw error
    }
  }

  /**
   * [ADMIN] Lấy danh sách tất cả voucher với filter
   * @param {Object} params - { page, size, status, applyTo, sortBy, sortDirection }
   * @returns {Promise<Object>} Page of vouchers
   */
  async getAllVouchers(params = {}) {
    try {
      const {
        page = 0,
        size = 10,
        status,
        applyTo,
        sortBy = 'createdAt',
        sortDirection = 'DESC'
      } = params

      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDirection
      })

      if (status !== undefined && status !== null) {
        queryParams.append('status', status)
      }
      if (applyTo) {
        queryParams.append('applyTo', applyTo)
      }

      const response = await api.get(`/vouchers/admin/all?${queryParams}`)
      return response
    } catch (error) {
      console.error('Error getting all vouchers:', error)
      throw error
    }
  }
}

export default new VoucherService()
