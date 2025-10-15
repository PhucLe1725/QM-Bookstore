import React from 'react'
import { WebSocketProvider, MessageProvider, ChatProvider, AuthProvider } from './store'
import { AppRoutes } from './routes'
import ChatButton from './components/ChatButton'
import ChatModal from './components/ChatModal'
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
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <MessageProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </MessageProvider>
      </WebSocketProvider>
    </AuthProvider>
  )
}

export default App