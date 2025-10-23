import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMessage, useAuth } from '../store'
import { isAdmin } from '../utils'

const Header = () => {
  const { 
    notifications, 
    showPopup, 
    removeNotification, 
    clearAllNotifications, 
    togglePopup 
  } = useMessage()
  
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-green-500 bg-green-50'
      case 'error':
        return 'border-red-500 bg-red-50'
      case 'warning':
        return 'border-yellow-500 bg-yellow-50'
      case 'info':
      default:
        return 'border-blue-500 bg-blue-50'
    }
  }
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <img 
              src="/src/assets/website/logo.png" 
              alt="Books Store Logo" 
              className="h-8 w-auto"
            />
            <h1 className="ml-3 text-2xl font-bold text-gray-900">Books Store</h1>
          </div>
          <nav className="flex items-center space-x-8">
            <Link to="/" className="text-gray-900 hover:text-blue-600">Trang chủ</Link>
            <a href="#" className="text-gray-900 hover:text-blue-600">Sách</a>
            <a href="#" className="text-gray-900 hover:text-blue-600">Liên hệ</a>
            {isAuthenticated && (
              <Link to="/dashboard" className="text-gray-900 hover:text-blue-600">Dashboard</Link>
            )}
            
            {/* Authentication Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
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
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={togglePopup}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="Thông báo"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showPopup && (
                <div className="absolute top-full right-0 mt-2 w-80 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                  {/* Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Thông báo ({notifications.length})
                    </h3>
                    <div className="flex space-x-2">
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-sm text-gray-500 hover:text-gray-700"
                          title="Xóa tất cả"
                        >
                          Xóa tất cả
                        </button>
                      )}
                      <button
                        onClick={togglePopup}
                        className="text-gray-400 hover:text-gray-600"
                        title="Đóng"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Messages List */}
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-l-4 ${getTypeColor(notification.type)} border-b border-gray-100 last:border-b-0`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <span className="text-lg mr-2">
                                {getTypeIcon(notification.type)}
                              </span>
                              <h4 className="text-sm font-semibold text-gray-900">
                                {notification.title}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              {notification.message}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600 ml-2"
                            title="Xóa thông báo"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {notifications.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p>Không có thông báo nào</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header