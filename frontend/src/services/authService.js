import { json } from 'react-router-dom'
import Cookies from 'js-cookie'
import api from './api'
import { cartService } from './cartService'

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

      // Xử lý response với cấu trúc mới
      if (response.success && response.result) {
        const { accessToken, refreshToken, userResponse } = response.result

        if (accessToken) {
          // Lưu accessToken vào secure cookie (7 ngày)
          Cookies.set('token', accessToken, {
            expires: 7,
            secure: window.location.protocol === 'https:',
            sameSite: 'strict',
            path: '/'
          })

          // Backup trong localStorage cho compatibility
          localStorage.setItem('token', accessToken)

          // Lưu refreshToken vào secure cookie (30 ngày)
          if (refreshToken) {
            Cookies.set('refreshToken', refreshToken, {
              expires: 30,
              secure: window.location.protocol === 'https:',
              sameSite: 'strict',
              path: '/'
            })
            localStorage.setItem('refreshToken', refreshToken)
          }

          // Lưu thông tin user đầy đủ trong localStorage (không sensitive)
          if (userResponse) {
            // Đảm bảo lưu tất cả thông tin từ UserResponse
            const userInfo = {
              id: userResponse.id,
              username: userResponse.username,
              fullName: userResponse.fullName,
              email: userResponse.email,
              phoneNumber: userResponse.phoneNumber,
              address: userResponse.address,
              roleId: userResponse.roleId,
              roleName: userResponse.roleName,
              status: userResponse.status,
              points: userResponse.points,
              totalPurchase: userResponse.totalPurchase,
              membershipLevel: userResponse.membershipLevel,
              createdAt: userResponse.createdAt,
              updatedAt: userResponse.updatedAt
            }
            localStorage.setItem('user', JSON.stringify(userInfo))
          }

          // Merge guest cart to user cart after successful login
          try {
            const sessionId = cartService.getSessionId()
            if (sessionId) {
              await api.post('/cart/merge', {}, {
                headers: {
                  'X-Session-ID': sessionId
                }
              })
              // Clear session ID after merge
              localStorage.removeItem('cart_session_id')

              // Trigger cart update
              window.dispatchEvent(new Event('cartUpdated'))
            }
          } catch (error) {
            console.error('Failed to merge cart:', error)
            // Don't fail login if cart merge fails
          }
        }
      }

      return response
    } catch (error) {
      console.error('Login service error:', error)
      // Throw the original error to preserve response data (including error codes)
      throw error
    }
  },

  // Đăng ký
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', {
        email: userData.email,
        username: userData.username,
        phoneNumber: userData.phoneNumber,
        password: userData.password
      })
      return response
    } catch (error) {
      throw error
    }
  },

  // Xác thực OTP
  verifyOtp: async (email, otpCode) => {
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otpCode
      })
      return response
    } catch (error) {
      throw error
    }
  },

  // Gửi lại OTP
  resendOtp: async (email) => {
    try {
      const response = await api.post('/auth/resend-otp', { email })
      return response
    } catch (error) {
      throw error
    }
  },

  // Đăng xuất
  logout: () => {
    // Xóa cookies
    Cookies.remove('token', { path: '/' })
    Cookies.remove('refreshToken', { path: '/' })

    // Xóa localStorage backup
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    // Bỏ auto redirect - để component tự handle
  },

  // Lấy token (ưu tiên cookie, fallback localStorage)
  getToken: () => {
    return Cookies.get('token') || localStorage.getItem('token')
  },

  // Lấy refresh token
  getRefreshToken: () => {
    return Cookies.get('refreshToken') || localStorage.getItem('refreshToken')
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  // Kiểm tra xem user đã đăng nhập chưa
  isAuthenticated: () => {
    return !!(Cookies.get('token') || localStorage.getItem('token'))
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh')
      if (response.token) {
        // Cập nhật token mới vào cookie và localStorage
        Cookies.set('token', response.token, {
          expires: 7,
          secure: window.location.protocol === 'https:',
          sameSite: 'strict',
          path: '/'
        })
        localStorage.setItem('token', response.token)
      }
      return response
    } catch (error) {
      throw error
    }
  }
}