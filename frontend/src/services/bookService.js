import api from './api'

export const bookService = {
  // Lấy danh sách tất cả sách
  getAllBooks: async (params = {}) => {
    try {
      const response = await api.get('/books', { params })
      return response
    } catch (error) {
      throw error
    }
  },

  // Lấy thông tin chi tiết sách
  getBookById: async (id) => {
    try {
      const response = await api.get(`/books/${id}`)
      return response
    } catch (error) {
      throw error
    }
  },

  // Tìm kiếm sách
  searchBooks: async (query, filters = {}) => {
    try {
      const response = await api.get('/books/search', {
        params: { q: query, ...filters }
      })
      return response
    } catch (error) {
      throw error
    }
  },

  // Lấy sách theo thể loại
  getBooksByCategory: async (categoryId, params = {}) => {
    try {
      const response = await api.get(`/books/category/${categoryId}`, { params })
      return response
    } catch (error) {
      throw error
    }
  },

  // Lấy sách nổi bật
  getFeaturedBooks: async () => {
    try {
      const response = await api.get('/books/featured')
      return response
    } catch (error) {
      throw error
    }
  },

  // Lấy sách mới nhất
  getLatestBooks: async (limit = 10) => {
    try {
      const response = await api.get('/books/latest', {
        params: { limit }
      })
      return response
    } catch (error) {
      throw error
    }
  },

  // Thêm đánh giá sách
  addReview: async (bookId, reviewData) => {
    try {
      const response = await api.post(`/books/${bookId}/reviews`, reviewData)
      return response
    } catch (error) {
      throw error
    }
  },

  // Lấy đánh giá của sách
  getBookReviews: async (bookId, params = {}) => {
    try {
      const response = await api.get(`/books/${bookId}/reviews`, { params })
      return response
    } catch (error) {
      throw error
    }
  }
}