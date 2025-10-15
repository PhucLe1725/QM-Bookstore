import React, { useState, useEffect } from 'react'
import { useWebSocket } from '../store/WebSocketContext'
import { useAuth } from '../hooks/useAuth'
import { chatService, userService } from '../services'

const WebSocketTest = () => {
  const { user } = useAuth()
  const { 
    isConnected, 
    messages, 
    adminMessages, 
    privateMessages,
    sendUserMessage,
    sendAdminBroadcast,
    sendPrivateMessage
  } = useWebSocket()

  const [testMessage, setTestMessage] = useState('')
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [apiTest, setApiTest] = useState(null)

  useEffect(() => {
    // Load users for testing
    loadUsers()
    // Test API
    testAPI()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await userService.getAllUsers()
      console.log('Users loaded:', response)
      
      if (response.success && response.result && response.result.data) {
        setUsers(response.result.data)
      } else if (response.data) {
        setUsers(response.data)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const testAPI = async () => {
    try {
      const response = await chatService.getRecentMessages(10)
      console.log('Recent messages:', response)
      setApiTest({ success: true, data: response })
    } catch (error) {
      console.error('API test failed:', error)
      setApiTest({ success: false, error: error.message })
    }
  }

  const handleSendTest = () => {
    if (!testMessage.trim()) return

    if (user?.roleName === 'admin') {
      sendAdminBroadcast(testMessage)
    } else {
      sendUserMessage(testMessage)
    }
    
    setTestMessage('')
  }

  const handleSendPrivate = () => {
    if (!testMessage.trim() || !selectedUserId) return
    
    sendPrivateMessage(selectedUserId, testMessage)
    setTestMessage('')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">WebSocket & API Test</h1>
      
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">WebSocket:</p>
            <p className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">User Role:</p>
            <p className="font-medium">{user?.roleName || 'No role'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">User ID:</p>
            <p className="font-medium text-xs">{user?.id || 'No ID'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">API Test:</p>
            <p className={`font-medium ${apiTest?.success ? 'text-green-600' : 'text-red-600'}`}>
              {apiTest?.success ? '🟢 Working' : '🔴 Failed'}
            </p>
          </div>
        </div>
      </div>

      {/* Message Counts */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Message Counts</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Admin Messages:</p>
            <p className="text-2xl font-bold text-blue-600">{messages.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">User Messages to Admin:</p>
            <p className="text-2xl font-bold text-orange-600">{adminMessages.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Private Messages:</p>
            <p className="text-2xl font-bold text-green-600">{privateMessages.length}</p>
          </div>
        </div>
      </div>

      {/* Send Test Message */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Send Test Message</h2>
        
        {/* Public Message */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {user?.roleName === 'admin' ? 'Admin Broadcast' : 'Message to Admin'}
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={handleSendTest}
              disabled={!isConnected || !testMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>

        {/* Private Message */}
        <div>
          <label className="block text-sm font-medium mb-2">Private Message</label>
          <div className="flex space-x-2 mb-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select user...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.roleName})
                </option>
              ))}
            </select>
            <button
              onClick={handleSendPrivate}
              disabled={!isConnected || !testMessage.trim() || !selectedUserId}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Send Private
            </button>
          </div>
        </div>
      </div>

      {/* Messages Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Messages */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3 text-blue-600">Admin Messages</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-sm">No messages</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="bg-blue-50 p-2 rounded text-sm">
                  <p>{msg.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* User Messages */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3 text-orange-600">User → Admin</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {adminMessages.length === 0 ? (
              <p className="text-gray-500 text-sm">No messages</p>
            ) : (
              adminMessages.map((msg, index) => (
                <div key={index} className="bg-orange-50 p-2 rounded text-sm">
                  <p>{msg.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    From: {msg.senderUsername || msg.senderId}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Private Messages */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3 text-green-600">Private Messages</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {privateMessages.length === 0 ? (
              <p className="text-gray-500 text-sm">No messages</p>
            ) : (
              privateMessages.map((msg, index) => (
                <div key={index} className="bg-green-50 p-2 rounded text-sm">
                  <p>{msg.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {msg.senderId === user?.id ? 'You' : msg.senderUsername || 'Other'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-100 rounded-lg p-4 mt-6">
        <h3 className="font-semibold mb-2">Debug Info</h3>
        <pre className="text-xs text-gray-600 overflow-x-auto">
          {JSON.stringify({
            isConnected,
            userRole: user?.roleName,
            userId: user?.id,
            messageCount: {
              admin: messages.length,
              userToAdmin: adminMessages.length,
              private: privateMessages.length
            },
            usersLoaded: users.length,
            apiTest: apiTest
          }, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default WebSocketTest