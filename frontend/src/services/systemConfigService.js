import api from './api'

const systemConfigService = {
  // Lấy tất cả system configs với pagination
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      if (params.page !== undefined) queryParams.append('page', params.page)
      if (params.size !== undefined) queryParams.append('size', params.size)
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)

      const response = await api.get(`/system-config?${queryParams.toString()}`)
      return response
    } catch (error) {
      console.error('Error fetching system configs:', error)
      throw error
    }
  },

  // Lấy config theo ID
  getById: async (id) => {
    try {
      const response = await api.get(`/system-config/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching config by id:', error)
      throw error
    }
  },

  // Lấy config theo key
  getByKey: async (configKey) => {
    try {
      const response = await api.get(`/system-config/key/${configKey}`)
      return response
    } catch (error) {
      console.error('Error fetching config by key:', error)
      throw error
    }
  },

  // Tạo config mới
  create: async (data) => {
    try {
      const response = await api.post('/system-config', data)
      return response
    } catch (error) {
      console.error('Error creating config:', error)
      throw error
    }
  },

  // Cập nhật config
  update: async (id, data) => {
    try {
      const response = await api.put(`/system-config/${id}`, data)
      return response
    } catch (error) {
      console.error('Error updating config:', error)
      throw error
    }
  },

  // Xóa config
  delete: async (id) => {
    try {
      const response = await api.delete(`/system-config/${id}`)
      return response
    } catch (error) {
      console.error('Error deleting config:', error)
      throw error
    }
  }
}

export default systemConfigService
