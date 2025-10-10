import React from 'react'
import { WebSocketProvider, MessageProvider, ChatProvider, AuthProvider, useAuth } from './store'
import { AppRoutes } from './routes'
import ChatButton from './components/ChatButton'
import ChatModal from './components/ChatModal'

const AppContent = () => {
  const { isAuthenticated } = useAuth()
  
  return (
    <div className="App">
      <AppRoutes />
      
      {/* Chat System - Only show when authenticated */}
      {isAuthenticated && (
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