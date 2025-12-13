import api from './api'

// Role service cho admin
const roleService = {
  // Lấy tất cả roles
  getAllRoles: async () => {
    try {
      const response = await api.get('/roles')
      return response
    } catch (error) {
      console.error('Error fetching roles:', error)
      console.error('Response data:', error.response?.data)
      console.error('Response status:', error.response?.status)
      console.error('Response headers:', error.response?.headers)
      throw error
    }
  },

  // Lấy role theo ID
  getRoleById: async (roleId) => {
    try {
      const response = await api.get(`/roles/${roleId}`)
      return response
    } catch (error) {
      console.error('Error fetching role by ID:', error)
      throw error
    }
  },

  // Lấy role theo name
  getRoleByName: async (roleName) => {
    try {
      const response = await api.get(`/roles/name/${roleName}`)
      return response
    } catch (error) {
      console.error('Error fetching role by name:', error)
      throw error
    }
  },

  // Tạo role mới
  createRole: async (roleData) => {
    try {
      const response = await api.post('/roles', roleData)
      return response
    } catch (error) {
      console.error('Error creating role:', error)
      throw error
    }
  },

  // Cập nhật role
  updateRole: async (roleId, roleData) => {
    try {
      const response = await api.put(`/roles/${roleId}`, roleData)
      return response
    } catch (error) {
      console.error('Error updating role:', error)
      throw error
    }
  },

  // Xóa role
  deleteRole: async (roleId) => {
    try {
      const response = await api.delete(`/roles/${roleId}`)
      return response
    } catch (error) {
      console.error('Error deleting role:', error)
      throw error
    }
  },

  // Validate role name
  validateRoleName: (name) => {
    if (!name || name.trim() === '') {
      return { valid: false, error: 'Tên role không được để trống' }
    }

    if (name.length > 50) {
      return { valid: false, error: 'Tên role không được vượt quá 50 ký tự' }
    }

    const pattern = /^[a-z_]+$/
    if (!pattern.test(name)) {
      return {
        valid: false,
        error: 'Tên role chỉ được chứa chữ thường và dấu gạch dưới'
      }
    }

    return { valid: true }
  }
}

export default roleService
