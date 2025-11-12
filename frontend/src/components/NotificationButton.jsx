import React, { useState, useEffect } from 'react'
import { useNotificationContext } from '../store/NotificationContext'
import NotificationPanel from './NotificationPanel'

/**
 * Component nút thông báo với counter
 * Hiển thị số lượng thông báo chưa đọc và mở panel khi click
 */
const NotificationButton = ({ className = '' }) => {
  const { 
    unreadCount, 
    requestNotificationPermission,
    refresh 
  } = useNotificationContext()
  
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(false)

  // Animation effect when new notification arrives
  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotification(true)
      const timer = setTimeout(() => setHasNewNotification(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [unreadCount])

  // Request notification permission on first interaction
  const handleClick = () => {
    if (!isOpen) {
      requestNotificationPermission()
      refresh() // Refresh notifications when opening
    }
    setIsOpen(!isOpen)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900 transition-colors ${
          hasNewNotification ? 'animate-pulse' : ''
        } ${className}`}
        title={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
      >
        {/* Bell Icon */}
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* New notification indicator */}
        {hasNewNotification && (
          <div className="absolute -top-1 -right-1 w-3 h-3">
            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></div>
            <div className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></div>
          </div>
        )}
      </button>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  )
}

export default NotificationButton