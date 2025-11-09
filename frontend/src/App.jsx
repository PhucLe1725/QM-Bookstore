import React from 'react'
import { WebSocketProvider, MessageProvider, ChatProvider, AuthProvider } from './store'
import NotificationProvider from './store/NotificationContext'
import { AppRoutes } from './routes'
import ChatButton from './components/ChatButton'
import ChatModal from './components/ChatModal'
import { NotificationToastContainer } from './components/NotificationToast'
import NotificationTestPanel from './components/NotificationTestPanel'
import { useChatVisibility } from './hooks'

const AppContent = () => {
  const { shouldShowChat } = useChatVisibility()
  
  return (
    <div className="App">
      <AppRoutes />
      
      {/* Chat System - Được quản lý bởi useChatVisibility hook */}
      {shouldShowChat && (
        <>
          <ChatButton />
          <ChatModal />
        </>
      )}
      
      {/* Notification Toast Container */}
      <NotificationToastContainer />
      
      {/* Development Test Panel */}
      <NotificationTestPanel />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <NotificationProvider>
          <MessageProvider>
            <ChatProvider>
              <AppContent />
            </ChatProvider>
          </MessageProvider>
        </NotificationProvider>
      </WebSocketProvider>
    </AuthProvider>
  )
}

export default App