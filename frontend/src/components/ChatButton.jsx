import React from 'react'
import { useChat } from '../store/ChatContext'

const ChatButton = () => {
  const { openChat, isOpen } = useChat()

  if (isOpen) return null // Hide button when chat is open

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={openChat}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 group"
        title="Mở chat hỗ trợ"
      >
        <div className="relative">
          {/* Chat Icon */}
          <svg
            className="w-6 h-6 transition-transform duration-300 group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          
          {/* Pulse animation */}
          <div className="absolute -inset-1 bg-blue-400 rounded-full opacity-30 animate-ping"></div>
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Hỗ trợ trực tuyến
          <div className="absolute top-full right-3 -mt-1 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </button>
      
      {/* Welcome message (shows briefly when page loads) */}
    <div className="absolute bottom-full right-0 mb-4 bg-white rounded-lg shadow-lg p-4 w-[120px] opacity-0 animate-fade-in-up" style={{animationDelay: '2s', animationFillMode: 'forwards'}}>
        <div className="flex items-start space-x-3">
          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900 text-center">
              Chào mừng đến Books Store!
            </p>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Cần hỗ trợ? Chat với chúng tôi ngay!
            </p>
            <button 
              className="mt-4 text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation()
                e.target.closest('.absolute').style.display = 'none'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Arrow pointing to button */}
        <div className="absolute top-full right-8 -mt-1 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

export default ChatButton