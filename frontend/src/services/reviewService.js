import api from './api'

/**
 * Review Service
 * Handles all product review-related API calls
 */

export const reviewService = {
  // Get all reviews for a product
  getProductReviews: async (productId, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        skipCount: 0,
        maxResultCount: 20,
        sortDirection: 'desc',
        ...params
      })
      
      const response = await api.get(`/reviews/products/${productId}?${queryParams}`)
      return response
    } catch (error) {
      console.error('Error fetching product reviews:', error)
      throw error
    }
  },

  // Get review by ID
  getReviewById: async (reviewId) => {
    try {
      const response = await api.get(`/reviews/${reviewId}`)
      return response
    } catch (error) {
      console.error('Error fetching review:', error)
      throw error
    }
  },

  // Create a new review
  createReview: async (reviewData) => {
    try {
      const response = await api.post('/reviews', reviewData)
      return response
    } catch (error) {
      console.error('Error creating review:', error)
      throw error
    }
  },

  // Update a review
  updateReview: async (reviewId, reviewData) => {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData)
      return response
    } catch (error) {
      console.error('Error updating review:', error)
      throw error
    }
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}`)
      return response
    } catch (error) {
      console.error('Error deleting review:', error)
      throw error
    }
  },

  // Get user's reviews
  getUserReviews: async (userId, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        skipCount: 0,
        maxResultCount: 20,
        ...params
      })
      
      const response = await api.get(`/reviews/user/${userId}?${queryParams}`)
      return response
    } catch (error) {
      console.error('Error fetching user reviews:', error)
      throw error
    }
  },

  // Mark review as helpful
  markReviewHelpful: async (reviewId) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/helpful`)
      return response
    } catch (error) {
      console.error('Error marking review as helpful:', error)
      throw error
    }
  },

  // Get average rating for a product
  getProductAverageRating: async (productId) => {
    try {
      const response = await api.get(`/reviews/products/${productId}/average-rating`)
      return response
    } catch (error) {
      console.error('Error fetching average rating:', error)
      throw error
    }
  },

  // Get rating statistics for a product
  getProductRatingStats: async (productId) => {
    try {
      const response = await api.get(`/reviews/products/${productId}/rating-stats`)
      return response
    } catch (error) {
      console.error('Error fetching rating stats:', error)
      throw error
    }
  }
}

export default reviewService
