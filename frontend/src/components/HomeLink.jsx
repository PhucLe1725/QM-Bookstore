import React from 'react'
import { Link } from 'react-router-dom'

const HomeLink = ({ className = '', color = 'indigo', showLogo = false }) => {
  const colorClasses = {
    indigo: 'text-indigo-600 hover:text-indigo-800',
    emerald: 'text-emerald-600 hover:text-emerald-800',
    blue: 'text-blue-600 hover:text-blue-800',
    gray: 'text-gray-600 hover:text-gray-800'
  }

  return (
    <Link 
      to="/"
      className={`absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center space-x-2 sm:space-x-3 ${colorClasses[color]} transition-colors group ${className}`}
    >
      {showLogo ? (
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-lg shadow-sm p-1">
            <img 
              src="/src/assets/website/logo.png" 
              alt="QM Bookstore Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <div className="font-semibold text-sm">QM Bookstore</div>
            <div className="text-xs opacity-75">Về trang chủ</div>
          </div>
        </div>
      ) : (
        <>
          <svg 
            className="h-4 w-4 sm:h-5 sm:w-5 group-hover:transform group-hover:-translate-x-1 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
          <span className="font-medium text-sm sm:text-base">Về trang chủ</span>
        </>
      )}
    </Link>
  )
}

export default HomeLink