import React, { useEffect } from 'react'
import { useChat } from '../store/ChatContext'
import { useAuth } from '../hooks/useAuth'
import useChatReadStatus from '../hooks/useChatReadStatus'
import AdminChat from './AdminChat'
import Chatbot from './Chatbot'

const ChatModal = () => {
  const { 
    isOpen, 
    chatMode, 
    displayMode, 
    closeChat, 
    toggleDisplayMode, 
    selectChatMode 
  } = useChat()
  
  const { user } = useAuth()
  const { markAsReadByUserFromAdmin } = useChatReadStatus()

  // Mark admin messages as read when opening admin chat
  useEffect(() => {
    if (isOpen && chatMode === 'admin' && user?.id) {
      const markMessages = async () => {
        try {
          await markAsReadByUserFromAdmin(user.id)
        } catch (error) {
          console.error('Error marking admin messages as read:', error)
        }
      }
      markMessages()
    }
  }, [isOpen, chatMode, user?.id]) // Removed function dependency

  if (!isOpen) return null

  const modalClasses = displayMode === 'fullscreen' 
    ? 'fixed inset-x-0 top-16 bottom-0 z-50' // Full screen minus header
    : 'fixed bottom-4 right-4 w-96 h-[600px] z-50' // Popup mode

  const renderChatModeSelection = () => (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Chọn loại hỗ trợ
        </h2>
        <p className="text-gray-600">
          Bạn muốn được hỗ trợ bằng cách nào?
        </p>
      </div>
      
      <div className="space-y-4 w-full max-w-sm">
        <button
          onClick={() => selectChatMode('admin')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center justify-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-semibold">Chat với Admin</span>
          </div>
          <p className="text-sm text-blue-100 mt-2">
            Kết nối trực tiếp với nhân viên hỗ trợ
          </p>
        </button>
        
        <button
          onClick={() => selectChatMode('chatbot')}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center justify-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold">Hỏi Chatbot</span>
          </div>
          <p className="text-sm text-green-100 mt-2">
            Trả lời tự động bằng AI thông minh
          </p>
        </button>
      </div>
    </div>
  )

  const renderChatContent = () => {
    switch (chatMode) {
      case 'admin':
        return <AdminChat />
      case 'chatbot':
        return <Chatbot />
      default:
        return renderChatModeSelection()
    }
  }

  return (
    <div className={modalClasses}>
      <div className="bg-white rounded-lg shadow-2xl h-full flex flex-col border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {chatMode !== 'select' && (
              <button
                onClick={() => selectChatMode('select')}
                className="text-white hover:text-blue-200 transition-colors"
                title="Quay lại"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h3 className="font-semibold text-lg">
                {chatMode === 'admin' && 'Chat với Admin'}
                {chatMode === 'chatbot' && 'Chatbot Hỗ trợ'}
                {chatMode === 'select' && 'Hỗ trợ khách hàng'}
              </h3>
              {chatMode === 'admin' && (
                <p className="text-blue-100 text-sm">Kết nối trực tiếp với nhân viên</p>
              )}
              {chatMode === 'chatbot' && (
                <p className="text-blue-100 text-sm">AI hỗ trợ 24/7</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Toggle display mode */}
            <button
              onClick={toggleDisplayMode}
              className="text-white hover:text-blue-200 transition-colors p-1"
              title={displayMode === 'popup' ? 'Phóng to toàn màn hình' : 'Thu nhỏ'}
            >
              {displayMode === 'popup' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9l5.5-5.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5m0 0l5.5 5.5" />
                </svg>
              )}
            </button>
            
            {/* Close button */}
            <button
              onClick={closeChat}
              className="text-white hover:text-red-200 transition-colors p-1"
              title="Đóng"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderChatContent()}
        </div>
      </div>
    </div>
  )
}

export default ChatModal