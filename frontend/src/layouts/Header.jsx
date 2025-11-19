import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store'
import { isAdmin } from '../utils'
import NotificationDropdown from '../components/NotificationDropdown'
import { cartService } from '../services'

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [cartItemCount, setCartItemCount] = useState(0)

  useEffect(() => {
    fetchCartCount()
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartCount()
    }
    
    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [isAuthenticated])

  const fetchCartCount = async () => {
    try {
      const cart = await cartService.getCart()
      setCartItemCount(cart.totalItems || 0)
    } catch (error) {
      console.error('Failed to fetch cart count:', error)
      setCartItemCount(0)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <img 
              src="/src/assets/website/logo.png" 
              alt="QM Logo" 
              className="h-8 w-auto"
            />
            <h1 className="ml-3 text-2xl font-bold text-gray-900">Văn phòng phẩm Quang Minh</h1>
          </div>
          <nav className="flex items-center space-x-8">
            <Link to="/" className="text-gray-900 hover:text-blue-600">Trang chủ</Link>
            <Link to="/products" className="text-gray-900 hover:text-blue-600">Sản phẩm</Link>
            <a href="#" className="text-gray-900 hover:text-blue-600">Liên hệ</a>
            {isAuthenticated && (
              <Link to="/dashboard" className="text-gray-900 hover:text-blue-600">Dashboard</Link>
            )}
            
            {/* Cart Icon */}
            <Link to="/cart" className="relative text-gray-900 hover:text-blue-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
            
            {/* Authentication Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Notification Dropdown */}
                <NotificationDropdown />
                
                {/* User Info with Dropdown */}
                <div className="relative group">
                  <div className="flex items-center space-x-3 cursor-pointer">
                    <div className="relative">
                      <img 
                        src="/src/assets/user.png" 
                        alt="User Avatar" 
                        className="h-10 w-10 rounded-full border-2 border-gray-200 hover:border-blue-300 transition-colors"
                      />
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-700">
                        {user?.username || user?.email}
                      </p>
                      <p className="text-xs text-gray-500">Online</p>
                    </div>
                    <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          <span>Dashboard</span>
                        </div>
                      </Link>
                      
                      {/* Admin Management Option - Chỉ hiện cho admin */}
                      {isAdmin(user) && (
                        <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Quản lý</span>
                          </div>
                        </Link>
                      )}
                      
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Hồ sơ</span>
                        </div>
                      </Link>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Cài đặt</span>
                        </div>
                      </a>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Đăng xuất</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-900 hover:text-blue-600 font-medium transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header