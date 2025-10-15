import axios from 'axios'
import Cookies from 'js-cookie'

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor để thêm token
api.interceptors.request.use(
  (config) => {
    // Ưu tiên lấy token từ cookie, fallback localStorage
    const token = Cookies.get('token') || localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.log('🔍 API Response interceptor caught error:', error)
    
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ - xóa cả cookies và localStorage
      Cookies.remove('token', { path: '/' })
      Cookies.remove('refreshToken', { path: '/' })
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      // Dispatch custom event để AuthContext có thể listen và handle
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    
    // Preserve original error object with response/config details
    // Just add a more user-friendly message
    const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra'
    error.userMessage = errorMessage
    
    console.log('🔍 Preserved error details:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config?.url,
      userMessage: errorMessage
    })
    
    return Promise.reject(error)
  }
)

export default api