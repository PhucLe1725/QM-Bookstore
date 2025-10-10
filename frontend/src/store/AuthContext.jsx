import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Kiểm tra authentication khi component mount
    const token = localStorage.getItem('token')
    const userData = authService.getCurrentUser()
    
    if (token && userData) {
      setUser(userData)
      setIsAuthenticated(true)
    }
    
    setLoading(false)

    // Listen for logout events từ API interceptor
    const handleAuthLogout = () => {
      setUser(null)
      setIsAuthenticated(false)
      // Redirect về trang chủ khi token hết hạn
      window.location.href = '/'
    }

    window.addEventListener('auth:logout', handleAuthLogout)

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout)
    }
  }, [])

  const login = async (credentials) => {
    try {
      setLoading(true)
      const response = await authService.login(credentials)
      
      // Lấy user data từ localStorage sau khi login thành công
      const userData = authService.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
      return response
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await authService.register(userData)
      return response
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}