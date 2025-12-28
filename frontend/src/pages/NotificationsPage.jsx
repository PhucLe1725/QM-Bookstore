import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Filter,
  Search,
  MessageSquare,
  UserCog,
  MessageCircle,
  CheckCheck,
  Calendar,
  X
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNotificationContext } from '../store/NotificationContext'
import { isAdminOrManager } from '../utils/adminUtils'

const NotificationsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    clearError
  } = useNotificationContext()

  const [filter, setFilter] = useState('all') // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all') // all, NEW_MESSAGE, NEW_CUSTOMER_COMMENT, etc.
  const [searchTerm, setSearchTerm] = useState('')

  // Determine if user is admin or manager
  const isAdminUser = isAdminOrManager(user)

  useEffect(() => {
    // Load notifications with current filters
    const params = {}

    if (filter === 'unread') params.status = 'UNREAD'
    else if (filter === 'read') params.status = 'READ'

    // For management filter, fetch all notifications and filter client-side
    // For other filters, send type to backend
    if (typeFilter !== 'all' && typeFilter !== 'management') {
      params.type = typeFilter
    }

    fetchNotifications(params)
  }, [filter, typeFilter, fetchNotifications])

  // Filter notifications based on search term and type category
  const filteredNotifications = notifications.filter(notification => {
    // First check search match
    const matchesSearch = notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.username?.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    // Then check type filter
    if (typeFilter === 'all') {
      return true
    }

    if (typeFilter === 'management') {
      // Management: only NEW_CUSTOMER_COMMENT and NEW_REVIEW
      return notification.type === 'NEW_CUSTOMER_COMMENT' || notification.type === 'NEW_REVIEW'
    }

    if (typeFilter === 'NEW_MESSAGE') {
      // Messages: only NEW_MESSAGE
      return notification.type === 'NEW_MESSAGE'
    }

    if (typeFilter === 'COMMENT_REPLY') {
      // Comments: only COMMENT_REPLY
      return notification.type === 'COMMENT_REPLY'
    }

    // For any other type filter, match exactly
    return notification.type === typeFilter
  })

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_MESSAGE':
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'NEW_CUSTOMER_COMMENT':
      case 'NEW_REVIEW':
        return <UserCog className="h-5 w-5 text-green-500" />
      case 'COMMENT_REPLY':
        return <MessageCircle className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleNotificationClick = (notification) => {
    if (notification.status === 'UNREAD') {
      markAsRead(notification.id)
    }

    if (notification.anchor) {
      let targetUrl = notification.anchor

      if (notification.type === 'NEW_MESSAGE') {
        targetUrl = '/admin/messages'
      }

      navigate(targetUrl)
    }
  }

  const getFilterCount = (filterType) => {
    switch (filterType) {
      case 'unread':
        return notifications.filter(n => n.status === 'UNREAD').length
      case 'read':
        return notifications.filter(n => n.status === 'READ').length
      default:
        return notifications.length
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(isAdminUser ? '/admin' : '/home')}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Quay lại
                </button>
                <div className="h-6 border-l border-gray-300"></div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <Bell className="h-8 w-8 mr-3 text-blue-600" />
                    Thông báo
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Quản lý tất cả thông báo của bạn
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Status Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Lọc:</span>
              </div>
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'unread', label: 'Chưa đọc' },
                  { key: 'read', label: 'Đã đọc' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filter === key
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {label} ({getFilterCount(key)})
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm thông báo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Loại thông báo:</span>
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${typeFilter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setTypeFilter('NEW_MESSAGE')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${typeFilter === 'NEW_MESSAGE'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Tin nhắn
              </button>
              {isAdminUser && (
                <button
                  onClick={() => setTypeFilter('management')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${typeFilter === 'management'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Quản lý
                </button>
              )}
              {!isAdminUser && (
                <button
                  onClick={() => setTypeFilter('COMMENT_REPLY')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${typeFilter === 'COMMENT_REPLY'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Bình luận
                </button>
              )}

            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 text-sm">{error}</div>
              <button
                onClick={clearError}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Đang tải thông báo...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không có thông báo
              </h3>
              <p className="text-gray-500">
                {searchTerm ? 'Không tìm thấy thông báo phù hợp' : 'Bạn chưa có thông báo nào'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${notification.status === 'UNREAD' ? 'bg-blue-50' : ''
                    }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="relative">
                        {getNotificationIcon(notification.type)}
                        {/* Global notification indicator */}
                        {notification.userId === null && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">🌐</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm ${notification.status === 'UNREAD'
                              ? 'text-gray-900 font-medium'
                              : 'text-gray-700'
                            }`}>
                            {notification.message}
                          </p>

                          <div className="flex items-center mt-2 text-xs text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatTime(notification.createdAt)}
                            </div>
                            {notification.username && (
                              <div>Từ: {notification.username}</div>
                            )}
                            <div className="flex items-center space-x-2">
                              <span className="capitalize">
                                {notification.type.replace('_', ' ').toLowerCase()}
                              </span>
                              {notification.userId === null && (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                                  Global
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {notification.status === 'UNREAD' && (
                          <div className="flex-shrink-0 ml-4">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage