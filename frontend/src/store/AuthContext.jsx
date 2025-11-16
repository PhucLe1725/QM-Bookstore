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
    const token = authService.getToken() // Sử dụng method mới để lấy token từ cookie/localStorage
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

    // Listen for browser navigation events (back/forward)
    const handlePopState = () => {
      // Re-check authentication state when browser navigation occurs
      const currentToken = authService.getToken()
      const currentUser = authService.getCurrentUser()
      
      if (currentToken && currentUser) {
        setUser(currentUser)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
      
      // Force a small delay to ensure state is updated
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('auth:stateChanged'))
      }, 100)
    }

    // Listen for storage changes (when user data changes in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        const token = authService.getToken()
        const userData = authService.getCurrentUser()
        
        if (token && userData) {
          setUser(userData)
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      }
    }

    window.addEventListener('auth:logout', handleAuthLogout)
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('storage', handleStorageChange)
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

  const updateUser = (updatedUserData) => {
    // Cập nhật user state
    setUser(updatedUserData)
    
    // Cập nhật localStorage
    try {
      localStorage.setItem('user', JSON.stringify(updatedUserData))
    } catch (error) {
      console.error('Error saving updated user to localStorage:', error)
    }
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}