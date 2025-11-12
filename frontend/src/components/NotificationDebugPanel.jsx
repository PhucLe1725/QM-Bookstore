import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { notificationService } from '../services/notificationService'

const NotificationDebugPanel = () => {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const testUserNotifications = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const response = await notificationService.getUserNotifications(user.id, {
        skipCount: 0,
        maxResultCount: 10
      })
      
      setDebugInfo(prev => prev + `\n\n=== User Notifications Test ===\n` + 
        `User ID: ${user.id}\n` +
        `Role: ${user.roleName || JSON.stringify(user.roles)}\n` +
        `Response: ${JSON.stringify(response, null, 2)}`)
    } catch (error) {
      setDebugInfo(prev => prev + `\n\nERROR: ${error.message}`)
    }
    setLoading(false)
  }

  const testGlobalNotifications = async () => {
    setLoading(true)
    try {
      const response = await notificationService.getGlobalNotifications()
      
      setDebugInfo(prev => prev + `\n\n=== Global Notifications Test ===\n` + 
        `Response: ${JSON.stringify(response, null, 2)}`)
    } catch (error) {
      setDebugInfo(prev => prev + `\n\nGLOBAL ERROR: ${error.message}`)
    }
    setLoading(false)
  }

  const testUnreadCount = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const response = await notificationService.getUnreadCount(user.id)
      
      setDebugInfo(prev => prev + `\n\n=== Unread Count Test ===\n` + 
        `User ID: ${user.id}\n` +
        `Response: ${JSON.stringify(response, null, 2)}`)
    } catch (error) {
      setDebugInfo(prev => prev + `\n\nUNREAD COUNT ERROR: ${error.message}`)
    }
    setLoading(false)
  }

  const clearDebug = () => {
    setDebugInfo('')
  }

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p>Please login to test notifications</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🔍 Notification Debug Panel</h3>
      
      <div className="mb-4">
        <p><strong>Current User:</strong> {user.username || user.email}</p>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Role:</strong> {user.roleName || JSON.stringify(user.roles)}</p>
      </div>

      <div className="space-x-2 mb-4">
        <button 
          onClick={testUserNotifications}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Test User Notifications
        </button>
        
        <button 
          onClick={testGlobalNotifications}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          Test Global Notifications
        </button>
        
        <button 
          onClick={testUnreadCount}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
        >
          Test Unread Count
        </button>
        
        <button 
          onClick={clearDebug}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Clear
        </button>
      </div>

      {loading && <p className="text-blue-600">Testing...</p>}

      <div className="mt-4">
        <h4 className="font-medium mb-2">Debug Output:</h4>
        <pre className="bg-white p-4 border border-gray-300 rounded text-xs overflow-auto h-64">
          {debugInfo || 'No debug info yet. Click buttons above to test APIs.'}
        </pre>
      </div>
    </div>
  )
}

export default NotificationDebugPanel