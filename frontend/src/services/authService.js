import { json } from 'react-router-dom'
import api from './api'

export const authService = {
  // Đăng nhập
  login: async (credentials) => {
    try {
      // Chuyển đổi email thành username để phù hợp với API backend
      const loginData = {
        username: credentials.email, // Tạm thời dùng email làm username
        password: credentials.password
      }
      
      const response = await api.post('/auth/login', loginData)
      console.log('Login response:', JSON.stringify(response))
      
      // Xử lý response với cấu trúc mới
      if (response.success && response.result) {
        const { accessToken, refreshToken, userResponse } = response.result
        
        if (accessToken) {
          localStorage.setItem('token', accessToken)
          
          // Lưu refreshToken nếu có
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken)
          }
          
          // Lưu thông tin user
          if (userResponse) {
            localStorage.setItem('user', JSON.stringify(userResponse))
          }
        }
      }
      
      return response
    } catch (error) {
      console.error('Login service error:', error)
      throw new Error(error.message || 'Đăng nhập thất bại')
    }
  },

  // Đăng ký
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      return response
    } catch (error) {
      throw error
    }
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    // Bỏ auto redirect - để component tự handle
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  // Kiểm tra xem user đã đăng nhập chưa
  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh')
      if (response.token) {
        localStorage.setItem('token', response.token)
      }
      return response
    } catch (error) {
      throw error
    }
  }
}