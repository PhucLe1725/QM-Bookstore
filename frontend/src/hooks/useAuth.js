import { useState, useEffect } from 'react'
import { authService } from '../services'

export const useAuth = () => {
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

  return {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  }
}