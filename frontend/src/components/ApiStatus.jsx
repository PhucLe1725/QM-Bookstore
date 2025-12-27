import React, { useState, useEffect } from 'react'
import api from '../services/api'

const ApiStatus = () => {
  const [status, setStatus] = useState('checking') // checking, online, offline
  const [lastCheck, setLastCheck] = useState(null)

  const checkApiStatus = async () => {
    try {
      setStatus('checking')
      // Thử gọi một endpoint đơn giản để kiểm tra API
      await api.get('/auth/test') // hoặc bất kỳ endpoint nào có sẵn
      setStatus('online')
    } catch (error) {
      // console.log('API Status check:', error.message)
      setStatus('offline')
    }
    setLastCheck(new Date())
  }

  useEffect(() => {
    checkApiStatus()
    // Kiểm tra mỗi 30 giây
    const interval = setInterval(checkApiStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'text-green-600'
      case 'offline': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'online': return 'API Online'
      case 'offline': return 'API Offline'
      default: return 'Đang kiểm tra...'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-3 z-50">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          status === 'online' ? 'bg-green-500' : 
          status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
        } ${status === 'checking' ? 'animate-pulse' : ''}`}></div>
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        <button
          onClick={checkApiStatus}
          className="text-xs text-gray-500 hover:text-gray-700 ml-2"
          title="Kiểm tra lại"
        >
          ↻
        </button>
      </div>
      {lastCheck && (
        <div className="text-xs text-gray-400 mt-1">
          {lastCheck.toLocaleTimeString('vi-VN')}
        </div>
      )}
    </div>
  )
}

export default ApiStatus