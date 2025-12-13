import api from './api'

// User service cho admin
const userService = {
  // Lấy danh sách tất cả users (admin only)
  getAllUsers: async () => {
    try {
      const response = await api.get('/users/getAll')
      return response
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  // Lấy danh sách users với phân trang và sắp xếp (admin only)
  getAllUsersPaginated: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()
      if (params.skipCount !== undefined) queryParams.append('skipCount', params.skipCount)
      if (params.maxResultCount !== undefined) queryParams.append('maxResultCount', params.maxResultCount)
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection)
      
      const response = await api.get(`/users/getAllPaginated?${queryParams.toString()}`)
      return response
    } catch (error) {
      console.error('Error fetching paginated users:', error)
      throw error
    }
  },

  // Lấy thông tin user theo ID
  getUserById: async (userId) => {
    console.log('🔍 userService.getUserById called with userId:', userId)
    
    try {
      const response = await api.get(`/users/getById/${userId}`)
      console.log('✅ userService.getUserById success:', response)
      return response
    } catch (error) {
      console.error('❌ userService.getUserById error for userId:', userId, error)
      throw error
    }
  },

  // Lấy thông tin user theo username (admin only)
  getUserByUsername: async (username) => {
    try {
      const response = await api.get(`/users/getByUsername/${username}`)
      return response
    } catch (error) {
      console.error('Error fetching user by username:', error)
      throw error
    }
  },

  // Lấy thông tin profile của user hiện tại (authenticated user)
  getMyProfile: async () => {
    try {
      const response = await api.get('/users/profile/me')
      return response
    } catch (error) {
      console.error('Error fetching my profile:', error)
      throw error
    }
  },

  // Cập nhật thông tin profile của user hiện tại
  updateMyProfile: async (profileData) => {
    try {
      // Backend sẽ tự lấy user từ authentication context
      const response = await api.put('/users/profile/update', profileData)
      
      // Cập nhật lại user trong localStorage nếu update thành công
      if (response.success && response.result) {
        localStorage.setItem('user', JSON.stringify(response.result))
      }
      
      return response
    } catch (error) {
      console.error('Error updating my profile:', error)
      throw error
    }
  },

  // Cập nhật thông tin user (admin only)
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/update/${userId}`, userData)
      return response
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  },

  // Tạo user mới (admin only)
  createUser: async (userData) => {
    try {
      const response = await api.post('/users/create', userData)
      return response
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  // Xóa user (admin only)
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/delete/${userId}`)
      return response
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  },

  // Lấy danh sách roles (admin only)
  getAllRoles: async () => {
    try {
      const response = await api.get('/users/roles')
      return response
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  },

  // Thay đổi role user (admin only)
  updateUserRole: async (userId, newRole) => {
    try {
      const response = await api.put(`/users/${userId}/role`, { role: newRole })
      return response
    } catch (error) {
      console.error('Error updating user role:', error)
      throw error
    }
  },

  // Lấy danh sách users với filter
  getUsersWithFilter: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      
      if (filters.role) params.append('role', filters.role)
      if (filters.search) params.append('search', filters.search)
      if (filters.page) params.append('page', filters.page)
      if (filters.size) params.append('size', filters.size)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortDir) params.append('sortDir', filters.sortDir)
      
      const response = await api.get(`/users?${params.toString()}`)
      return response
    } catch (error) {
      console.error('Error fetching filtered users:', error)
      throw error
    }
  },

  // Kích hoạt/vô hiệu hóa user (admin only)
  toggleUserStatus: async (userId, isActive) => {
    try {
      const response = await api.put(`/users/${userId}/status`, { active: isActive })
      return response
    } catch (error) {
      console.error('Error toggling user status:', error)
      throw error
    }
  }
}

export default userService