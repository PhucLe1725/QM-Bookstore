import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store'
import ApiStatus from '../components/ApiStatus'
import HomeLink from '../components/HomeLink'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '', // Tạm thời vẫn dùng email field nhưng sẽ gửi làm username
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  useEffect(() => {
    // Kiểm tra nếu session hết hạn từ URL params
    const params = new URLSearchParams(location.search)
    if (params.get('session_expired') === 'true') {
      setErrors({ 
        submit: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' 
      })
      // Xóa param khỏi URL
      window.history.replaceState({}, document.title, location.pathname)
    }
    
    // Hiển thị thông báo từ register page
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      // Clear state để tránh hiển thị lại khi refresh
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email.trim()) {
      newErrors.email = 'Username/Email là bắt buộc'
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Mật khẩu là bắt buộc'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      await login(formData)
      
      // Reload trang để đảm bảo WebSocket và tất cả context được khởi tạo lại đúng
      // Điều này giúp WebSocket nhận được user info ngay lập tức
      const from = location.state?.from?.pathname || '/'
      window.location.href = from
      
      // Note: Không dùng navigate() vì cần full page reload để WebSocket connect
    } catch (error) {
      console.error('Login error:', error)
      
      let errorMessage = 'Username/Email hoặc mật khẩu không đúng'
      
      // Xử lý các loại lỗi khác nhau
      if (error.message) {
        if (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra lại.'
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Username/Email hoặc mật khẩu không đúng'
        } else if (error.message.includes('403')) {
          errorMessage = 'Tài khoản bị khóa hoặc không có quyền truy cập'
        } else {
          errorMessage = error.message
        }
      }
      
      setErrors({ submit: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* API Status Indicator */}
      <ApiStatus />
      
      {/* Home Link - Top Left */}
      <HomeLink color="indigo" showLogo={true} />
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập vào tài khoản
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hoặc{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              tạo tài khoản mới
            </Link>
          </p>
          
          {/* Demo credentials */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 text-center">
              <strong>Demo:</strong> Username: admin | Password: admin123
            </p>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Username/Email
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                value={formData.email}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors`}
                placeholder="Nhập username hoặc email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors`}
                placeholder="Nhập mật khẩu"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          {successMessage && (
            <div className="rounded-md bg-green-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className={`rounded-md p-4 ${
              errors.submit.includes('hết hạn') ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {errors.submit.includes('hết hạn') ? (
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${
                    errors.submit.includes('hết hạn') ? 'text-yellow-800' : 'text-red-800'
                  }`}>{errors.submit}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Quên mật khẩu?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login