import api from './api'

/**
 * Product Review Service
 * Handles all product review-related API calls
 */

export const reviewService = {
  // Get all reviews for a product
  getProductReviews: async (productId) => {
    try {
      const response = await api.get(`/product-reviews/product/${productId}`)
      // API interceptor đã return response.data rồi, nên response chính là { success: true, result: [...] }
      return response.result || []
    } catch (error) {
      console.error('Error fetching product reviews:', error)
      return []
    }
  },

  // Get review by ID
  getReviewById: async (reviewId) => {
    try {
      const response = await api.get(`/product-reviews/${reviewId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching review:', error)
      throw error
    }
  },

  // Create a new review
  createReview: async (reviewData) => {
    try {
      const response = await api.post('/product-reviews', reviewData)
      return response
    } catch (error) {
      console.error('Error creating review:', error)
      throw error
    }
  },

  // Update a review
  updateReview: async (reviewId, reviewData) => {
    try {
      const response = await api.put(`/product-reviews/${reviewId}`, reviewData)
      return response.data
    } catch (error) {
      console.error('Error updating review:', error)
      throw error
    }
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/product-reviews/${reviewId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting review:', error)
      throw error
    }
  },

  // Get user's reviews
  getUserReviews: async (userId) => {
    try {
      const response = await api.get(`/product-reviews/user/${userId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching user reviews:', error)
      throw error
    }
  },

  // Get my reviews
  getMyReviews: async () => {
    try {
      const response = await api.get('/product-reviews/my-reviews')
      return response.data
    } catch (error) {
      console.error('Error fetching my reviews:', error)
      throw error
    }
  },

  // Get review statistics for a product
  getReviewStats: async (productId) => {
    try {
      const response = await api.get(`/product-reviews/stats/product/${productId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching review stats:', error)
      throw error
    }
  },

  // Get my review for a product
  getMyReviewForProduct: async (productId) => {
    try {
      const response = await api.get(`/product-reviews/product/${productId}/my-review`)
      return response.data
    } catch (error) {
      console.error('Error fetching my review for product:', error)
      throw error
    }
  },

  // Check if user has purchased the product
  checkUserPurchased: async (productId) => {
    try {
      const response = await api.get(`/product-reviews/product/${productId}/check-purchase`)
      return response.result
    } catch (error) {
      console.error('Error checking user purchase:', error)
      return false
    }
  },

  // Get all reviews with pagination (Admin only)
  getAllReviews: async ({ page = 0, size = 10, rating = null, sortDirection = 'DESC' } = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortDirection
      })
      
      if (rating) {
        params.append('rating', rating.toString())
      }

      const response = await api.get(`/product-reviews?${params.toString()}`)
      // Response structure: { success: true, result: Page<ReviewDTO> }
      return response.result
    } catch (error) {
      console.error('Error fetching all reviews:', error)
      throw error
    }
  }
}

export default reviewService
