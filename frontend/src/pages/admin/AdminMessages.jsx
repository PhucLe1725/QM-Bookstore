import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowLeft,
  Users,
  MessageSquare,
  Search,
  Mail,
  MailOpen,
  Clock,
  User,
  Send
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { userService, chatService } from '../../services'
import { useWebSocket } from '../../store/WebSocketContext'
import ChatUnreadCounter from '../../components/ChatUnreadCounter'
import useChatReadStatus from '../../hooks/useChatReadStatus'

const AdminMessages = () => {
  const { user } = useAuth()
  const { 
    isConnected, 
    adminMessages, 
    privateMessages,
    adminNotifications,
    sendPrivateMessage,
    sendTypingIndicator,
    loadConversationWithUser,
    subscribeToConversation,
    unsubscribeFromConversation
  } = useWebSocket()
  
  const {
    getTotalUnreadCount,
    getAdminUnreadFromUserCount,
    markAsReadByAdminForUser,
    fetchTotalAdminUnread,
    fetchAdminUnreadFromUser,
    fetchUsersWithUnreadMessages
  } = useChatReadStatus()
  
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [allUserMessages, setAllUserMessages] = useState([])
  const messagesEndRef = useRef(null)
  const conversationSubscriptionRef = useRef(null)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef(null)
  const lastLoadedUserRef = useRef(null) // Track last loaded user to prevent unnecessary reloads
  const [usersWithUnread, setUsersWithUnread] = useState([]) // Track users with unread messages

  // Fetch all users from API
  useEffect(() => {
    fetchUsers()
    loadAllUserMessages() // Load user messages on component mount
    loadUsersWithUnreadMessages() // Load users with unread messages
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Gọi API lấy danh sách users qua userService
      const response = await userService.getAllUsers()
      
      console.log('Users API Response:', response)
      
      // Xử lý response dựa trên cấu trúc API thực tế
      let userData = []
      if (response.success && response.result && response.result.data) {
        // Cấu trúc: { success: true, result: { data: [...] } }
        userData = response.result.data
      } else if (response.success && response.data) {
        // Cấu trúc: { success: true, data: [...] }
        userData = response.data
      } else if (Array.isArray(response)) {
        // Cấu trúc: [...]
        userData = response
      } else if (response.result && Array.isArray(response.result)) {
        // Cấu trúc: { result: [...] }
        userData = response.result
      }
      
      console.log('Processed userData:', userData)
      setUsers(userData)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.message || 'Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  // Load users with unread messages
  const loadUsersWithUnreadMessages = async () => {
    try {
      const userIds = await fetchUsersWithUnreadMessages()
      setUsersWithUnread(userIds)
    } catch (error) {
      console.error('Error loading users with unread messages:', error)
    }
  }

  // Load tất cả user messages (receiverId = null)
  const loadAllUserMessages = async () => {
    try {
      // Kiểm tra quyền admin/manager
      if (!user || (user.roleName !== 'admin' && user.roleName !== 'manager')) {
        console.log('User does not have permission to view user messages')
        return
      }

      const response = await chatService.getAllUserMessages()
      console.log('All user messages:', response)
      
      if (response.success && response.result && response.result.content) {
        setAllUserMessages(Array.isArray(response.result.content) ? response.result.content : [])
      } else if (response.success && response.result) {
        setAllUserMessages(Array.isArray(response.result) ? response.result : [])
      } else {
        setAllUserMessages([])
      }
    } catch (error) {
      console.error('Error loading user messages:', error)
      setAllUserMessages([])
    }
  }

  // Filter users based on search term and exclude admin/staff
  const filteredUsers = users.filter(user => {
    // Only show regular users (not admin, manager, or staff)
    const isRegularUser = !user.roleName || 
                         (user.roleName !== 'admin' && 
                          user.roleName !== 'manager' && 
                          user.roleName !== 'staff')
    
    // Search filter
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return isRegularUser && matchesSearch
  })

  // Update chat messages when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      console.log('🏗️ Setting up conversation for user:', selectedUser.username)
      loadConversation()
      
      // Subscribe to conversation updates for this user
      if (subscribeToConversation) {
        conversationSubscriptionRef.current = subscribeToConversation(selectedUser.id)
      }
    }
    
    // Cleanup: unsubscribe from previous user's conversation
    return () => {
      if (conversationSubscriptionRef.current && unsubscribeFromConversation) {
        unsubscribeFromConversation(conversationSubscriptionRef.current)
        conversationSubscriptionRef.current = null
      }
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      
      // Send stop typing if was typing
      if (isTyping && selectedUser && sendTypingIndicator) {
        sendTypingIndicator(selectedUser.id, false)
        setIsTyping(false)
      }
    }
  }, [selectedUser?.id]) // Only depend on selectedUser.id to avoid unnecessary re-runs

  // Single effect to handle all real-time message updates
  useEffect(() => {
    console.log('🔄 WebSocket messages updated:', {
      adminMessages: adminMessages.length,
      privateMessages: privateMessages.length,
      selectedUser: selectedUser?.username
    })

    // Only reload all user messages when admin messages change (and not on initial load)
    if (adminMessages.length > 0) {
      // Use a ref to prevent infinite loops
      const timeoutId = setTimeout(() => {
        loadAllUserMessages()
      }, 500)
      
      return () => clearTimeout(timeoutId)
    }
  }, [adminMessages]) // Only depend on adminMessages

  // Separate effect for handling conversation updates for selected user
  useEffect(() => {
    if (!selectedUser) return

    const relevantMessages = [
      // Messages from user to admin (new ones only)
      ...(Array.isArray(adminMessages) ? adminMessages : []).filter(msg => 
        msg.senderId === selectedUser.id
      ),
      // Private messages involving this user (new ones only)
      ...(Array.isArray(privateMessages) ? privateMessages : []).filter(msg => 
        msg.senderId === selectedUser.id || msg.receiverId === selectedUser.id
      )
    ]

    console.log('📨 Relevant messages for selected user:', {
      userId: selectedUser.id,
      messageCount: relevantMessages.length,
      messages: relevantMessages
    })

    // Only reload if there are actually new relevant messages
    if (relevantMessages.length > 0) {
      // Debounce to avoid too many API calls
      const timeoutId = setTimeout(async () => {
        try {
          console.log('🔄 Reloading conversation for user:', selectedUser.id)
          const conversation = await chatService.getAdminConversationWithUser(selectedUser.id)
          if (conversation.success && conversation.result && conversation.result.content) {
            const newMessages = Array.isArray(conversation.result.content) ? conversation.result.content : []
            console.log('✅ Conversation reloaded:', newMessages.length, 'messages')
            setChatMessages(newMessages)
          }
        } catch (error) {
          console.error('❌ Error reloading conversation:', error)
        }
      }, 500) // Increased debounce time
      
      return () => clearTimeout(timeoutId)
    }
  }, [selectedUser?.id, privateMessages]) // Only depend on selectedUser.id and privateMessages

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && chatMessages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  const loadConversation = async () => {
    if (!selectedUser || !user) return
    
    // Avoid loading the same conversation repeatedly
    if (lastLoadedUserRef.current === selectedUser.id) {
      console.log('📋 Conversation already loaded for user:', selectedUser.username)
      return
    }
    
    try {
      setLoadingConversation(true)
      console.log('🔄 Loading conversation for user:', selectedUser.username)
      
      // Kiểm tra quyền admin/manager
      if (user.roleName !== 'admin' && user.roleName !== 'manager') {
        console.log('User does not have permission to view conversations')
        setChatMessages([])
        return
      }
      
      // Load conversation from new REST API for admin/manager
      const conversation = await chatService.getAdminConversationWithUser(selectedUser.id)
      if (conversation.success && conversation.result && conversation.result.content) {
        const messages = Array.isArray(conversation.result.content) ? conversation.result.content : []
        setChatMessages(messages)
        lastLoadedUserRef.current = selectedUser.id // Mark as loaded
        console.log('✅ Conversation loaded:', messages.length, 'messages')
      } else if (conversation.success && conversation.result) {
        const messages = Array.isArray(conversation.result) ? conversation.result : []
        setChatMessages(messages)
        lastLoadedUserRef.current = selectedUser.id
      } else if (conversation.data) {
        const messages = Array.isArray(conversation.data) ? conversation.data : []
        setChatMessages(messages)
        lastLoadedUserRef.current = selectedUser.id
      } else if (Array.isArray(conversation)) {
        setChatMessages(conversation)
        lastLoadedUserRef.current = selectedUser.id
      } else {
        setChatMessages([])
        lastLoadedUserRef.current = selectedUser.id
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
      setChatMessages([])
    } finally {
      setLoadingConversation(false)
    }
  }

  const handleUserSelect = async (selectedUserData) => {
    // Không clear messages nếu chọn lại cùng user
    if (selectedUser && selectedUser.id === selectedUserData.id) {
      console.log('📋 Same user selected, keeping current conversation')
      return
    }
    
    console.log('👤 Selecting new user:', selectedUserData.username)
    setSelectedUser(selectedUserData)
    setChatMessages([]) // Clear previous conversation only when selecting different user
    lastLoadedUserRef.current = null // Reset loaded state for new user
    
    // Mark all messages from this user as read by admin
    try {
      await markAsReadByAdminForUser(selectedUserData.id)
      // Refresh users with unread messages
      loadUsersWithUnreadMessages()
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return

    const messageText = newMessage.trim()
    console.log('📤 Admin sending message:', {
      to: selectedUser.username,
      message: messageText
    })

    // Clear input immediately
    setNewMessage('')

    // Create message object for immediate UI update
    const tempMessage = {
      id: Date.now(), // temporary ID
      senderId: user.id,
      receiverId: selectedUser.id,
      message: messageText,
      senderType: 'admin',
      createdAt: new Date().toISOString(),
      senderUsername: user.username || 'admin',
      receiverUsername: selectedUser.username
    }

    // Add message to UI immediately for better UX
    setChatMessages(prev => {
      const prevArray = Array.isArray(prev) ? prev : []
      return [...prevArray, tempMessage]
    })

    try {
      // Send private message to selected user via WebSocket
      await sendPrivateMessage(selectedUser.id, messageText)
      console.log('✅ Message sent via WebSocket')
      
      // Reload conversation after a short delay to get fresh data
      setTimeout(async () => {
        try {
          const conversation = await chatService.getAdminConversationWithUser(selectedUser.id)
          if (conversation.success && conversation.result && conversation.result.content) {
            const freshMessages = Array.isArray(conversation.result.content) ? conversation.result.content : []
            console.log('🔄 Conversation reloaded after send:', freshMessages.length, 'messages')
            setChatMessages(freshMessages)
          }
        } catch (error) {
          console.error('❌ Error reloading conversation after send:', error)
        }
      }, 1000) // Wait 1 second for message to be saved
      
    } catch (error) {
      console.error('❌ Error sending message:', error)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa xác định'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleDisplay = (user) => {
    if (user.roleName) return user.roleName
    if (user.role) return user.role
    return 'User'
  }

  const getRoleBadgeColor = (user) => {
    const role = getRoleDisplay(user).toLowerCase()
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'staff': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Đếm số tin nhắn từ user cụ thể
  const getMessageCountFromUser = (userId) => {
    return allUserMessages.filter(msg => msg.senderId === userId).length
  }

  // Kiểm tra quyền admin/manager
  const isAdminOrManager = () => {
    return user && (user.roleName === 'admin' || user.roleName === 'manager')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  to="/admin" 
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Quay lại Dashboard
                </Link>
                <div className="h-6 border-l border-gray-300"></div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <MessageSquare className="h-8 w-8 mr-3 text-blue-600" />
                    Tin nhắn hỗ trợ
                    {/* Total Unread Counter */}
                    <div className="ml-4">
                      <ChatUnreadCounter 
                        isAdminView={true}
                        showMarkAllRead={false}
                        size="default"
                        className="bg-white rounded-lg shadow-sm border px-3 py-1"
                      />
                    </div>
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Quản lý tin nhắn và hỗ trợ khách hàng
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Admin</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.fullName || user?.username}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* User List Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              
              {/* Search Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Danh sách khách hàng
                  </h2>
                  <span className="text-sm text-gray-500">
                    {filteredUsers.length} khách hàng
                  </span>
                </div>
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm khách hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Users List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
                  </div>
                ) : error ? (
                  <div className="p-4 text-center text-red-600">
                    <p className="text-sm">{error}</p>
                    <button 
                      onClick={fetchUsers}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm underline"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">
                      {searchTerm ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng nào'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredUsers.map((userData) => (
                      <div
                        key={userData.id || userData.userId}
                        onClick={() => handleUserSelect(userData)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedUser?.id === userData.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-gray-900">
                                {userData.fullName || userData.username || 'Không có tên'}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(userData)}`}>
                                {getRoleDisplay(userData)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{userData.email}</p>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              Tham gia: {formatDate(userData.createdAt || userData.joinDate)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            {/* Unread Counter */}
                            <ChatUnreadCounter 
                              userId={userData.id}
                              isAdminView={true}
                              showMarkAllRead={false}
                              size="small"
                            />
                            
                            {getMessageCountFromUser(userData.id) > 0 && (
                              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                {getMessageCountFromUser(userData.id)} tin nhắn
                              </div>
                            )}
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Online"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {selectedUser.fullName || selectedUser.username}
                        </h3>
                        <p className="text-sm text-gray-500">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-sm rounded-full ${getRoleBadgeColor(selectedUser)}`}>
                        {getRoleDisplay(selectedUser)}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                           title={isConnected ? 'Đã kết nối WebSocket' : 'Mất kết nối WebSocket'}>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  {loadingConversation ? (
                    <div className="text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm">Đang tải cuộc trò chuyện...</p>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Chưa có tin nhắn nào</p>
                      <p className="text-sm mt-1">Bắt đầu cuộc trò chuyện với {selectedUser.fullName || selectedUser.username}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(chatMessages) && chatMessages.map((message, index) => {
                        const isFromUser = message.senderId === selectedUser.id
                        const isFromAdmin = message.senderType === 'admin' || message.senderId === user.id
                        
                        return (
                          <div key={message.id || index} className={`flex ${isFromUser ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isFromUser 
                                ? 'bg-gray-200 text-gray-900 rounded-bl-none' 
                                : 'bg-blue-600 text-white rounded-br-none'
                            }`}>
                              <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                              <div className={`text-xs mt-1 flex items-center justify-between ${
                                isFromUser ? 'text-gray-500' : 'text-blue-100'
                              }`}>
                                <span>{formatDate(message.createdAt)}</span>
                                {message.senderUsername && (
                                  <span className="ml-2 opacity-75">
                                    {isFromAdmin ? 'Admin' : message.senderUsername}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      }) || null}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t bg-white">
                  <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                    <textarea
                      placeholder={isConnected ? "Nhập tin nhắn..." : "Chưa kết nối WebSocket..."}
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        
                        // Typing indicator logic
                        if (selectedUser && sendTypingIndicator) {
                          if (!isTyping) {
                            setIsTyping(true)
                            sendTypingIndicator(selectedUser.id, true)
                          }
                          
                          // Clear existing timeout
                          if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current)
                          }
                          
                          // Set new timeout to stop typing
                          typingTimeoutRef.current = setTimeout(() => {
                            setIsTyping(false)
                            sendTypingIndicator(selectedUser.id, false)
                          }, 2000) // Stop typing after 2 seconds of inactivity
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage(e)
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none min-h-[40px] max-h-[120px] overflow-y-auto"
                      disabled={!isConnected}
                      rows={1}
                      style={{
                        height: 'auto',
                        minHeight: '40px'
                      }}
                      onInput={(e) => {
                        e.target.style.height = 'auto'
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                      }}
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 whitespace-nowrap self-end"
                      disabled={!isConnected || !newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                      <span>Gửi</span>
                    </button>
                  </form>
                  {!isConnected && (
                    <p className="text-xs text-red-500 mt-1">
                      ⚠️ Mất kết nối WebSocket. Đang thử kết nối lại...
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Chọn người dùng để bắt đầu chat
                  </h3>
                  <p className="text-sm">
                    Chọn một người dùng từ danh sách bên trái để xem tin nhắn và trò chuyện
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tin nhắn từ users</p>
                <p className="text-2xl font-bold text-gray-900">{allUserMessages.length}</p>
              </div>
              <Mail className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tin nhắn real-time</p>
                <p className="text-2xl font-bold text-gray-900">{Array.isArray(adminMessages) ? adminMessages.length : 0}</p>
              </div>
              <MailOpen className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trạng thái WebSocket</p>
                <p className="text-2xl font-bold text-gray-900">{isConnected ? '🟢' : '🔴'}</p>
                <p className="text-xs text-gray-500">{isConnected ? 'Đã kết nối' : 'Mất kết nối'}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminMessages