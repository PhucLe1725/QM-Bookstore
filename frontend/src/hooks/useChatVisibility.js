import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { isAdmin } from '../utils'

/**
 * Custom hook để quản lý visibility của chat system
 * Chat chỉ hiển thị cho user thường (không phải admin)
 */
export const useChatVisibility = () => {
  const { isAuthenticated, user, loading } = useAuth()
  const [shouldShowChat, setShouldShowChat] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)

  useEffect(() => {
    if (loading) {
      setShouldShowChat(false)
      return
    }

    // Logic: Chat hiển thị khi user đã đăng nhập và KHÔNG phải admin
    const showChat = isAuthenticated && user && !isAdmin(user)
    setShouldShowChat(showChat)

  }, [isAuthenticated, user, loading, forceUpdate])

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthStateChange = () => {
      setForceUpdate(prev => prev + 1)
    }

    window.addEventListener('auth:stateChanged', handleAuthStateChange)
    
    return () => {
      window.removeEventListener('auth:stateChanged', handleAuthStateChange)
    }
  }, [])

  return {
    shouldShowChat,
    isAdmin: isAdmin(user),
    user,
    isAuthenticated
  }
}