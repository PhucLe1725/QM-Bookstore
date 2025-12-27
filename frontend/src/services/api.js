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

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    const originalRequest = error.config
    
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorMessage = error.response?.data?.message || ''
      
      // Nếu đang refresh token, thêm request vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = Cookies.get('refreshToken') || localStorage.getItem('refreshToken')
      
      // Nếu không có refresh token, logout ngay
      if (!refreshToken) {
        handleTokenExpiration('no_refresh_token')
        isRefreshing = false
        return Promise.reject(error)
      }

      try {
        // Gọi API refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        })
        
        if (response.data?.success && response.data?.result?.accessToken) {
          const newToken = response.data.result.accessToken
          
          // Lưu token mới
          Cookies.set('token', newToken, { 
            expires: 7,
            secure: window.location.protocol === 'https:',
            sameSite: 'strict',
            path: '/'
          })
          localStorage.setItem('token', newToken)
          
          // Cập nhật header cho request ban đầu
          originalRequest.headers.Authorization = `Bearer ${newToken}`
                    
          // Process queued requests
          processQueue(null, newToken)
          isRefreshing = false
          
          // Retry request ban đầu
          return api(originalRequest)
        } else {
          throw new Error('Invalid refresh response')
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshing = false
        handleTokenExpiration('refresh_failed')
        return Promise.reject(refreshError)
      }
    }
    
    // Handle 403 Forbidden (có thể do token hết hạn nhưng backend trả về 403)
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message || ''
      if (errorMessage.includes('token') || errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        handleTokenExpiration('forbidden')
        return Promise.reject(error)
      }
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra'
    error.userMessage = errorMessage
    
    return Promise.reject(error)
  }
)

// Helper function to handle token expiration
function handleTokenExpiration(reason = 'expired') {  
  // Clear all auth data
  Cookies.remove('token', { path: '/' })
  Cookies.remove('refreshToken', { path: '/' })
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  
  // Dispatch custom event với thông tin lý do
  window.dispatchEvent(new CustomEvent('auth:logout', {
    detail: { reason }
  }))
}

export default api