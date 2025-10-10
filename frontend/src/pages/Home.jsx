import React from 'react'
import { useMessage, useWebSocket, useAuth } from '../store'

const Home = () => {
  const { showNotification } = useMessage()
  const { isConnected, sendMessage } = useWebSocket()
  const { isAuthenticated, user } = useAuth()

  const handleTestNotification = () => {
    showNotification('success', 'Thông báo thành công', 'Đây là một thông báo test từ hệ thống!')
  }

  const handleTestWebSocket = () => {
    if (isConnected) {
      sendMessage('/app/test', {
        type: 'info',
        title: 'Test WebSocket',
        content: 'Tin nhắn test qua WebSocket',
        timestamp: new Date()
      })
    } else {
      showNotification('error', 'Lỗi kết nối', 'WebSocket chưa được kết nối!')
    }
  }
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-6">
              Chào mừng đến với Nhà sách Quang Minh
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Khám phá thế giới tri thức với hàng ngàn cuốn sách chất lượng cao
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300">
                Khám phá ngay
              </button>
              <button 
                onClick={handleTestNotification}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300"
              >
                Test Thông báo
              </button>
              <button 
                onClick={handleTestWebSocket}
                className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition duration-300"
              >
                Test WebSocket
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                WebSocket: {isConnected ? 'Đã kết nối' : 'Chưa kết nối'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${isAuthenticated ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                Auth: {isAuthenticated ? `Đã đăng nhập (${user?.username || user?.email})` : 'Chưa đăng nhập'}
              </span>
            </div>
          </div>
        </div>
      </section>

        {/* Featured Books Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Sách nổi bật
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((book) => (
                <div key={book} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
                  <img 
                    src={`/src/assets/books/book${book}.jpg`}
                    alt={`Book ${book}`}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h4 className="text-xl font-semibold mb-2">Tên sách {book}</h4>
                    <p className="text-gray-600 mb-4">Mô tả ngắn về cuốn sách này...</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">299,000đ</span>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300">
                        Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    )
  }

export default Home