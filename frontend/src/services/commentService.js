import api from './api'

/**
 * Product Comment Service
 * Handles all product comment-related API calls
 */

export const commentService = {
  // Get comment by ID
  getCommentById: async (id) => {
    try {
      const response = await api.get(`/product-comments/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching comment:', error)
      throw error
    }
  },

  // Get all comments for a product (root + replies)
  getAllCommentsByProduct: async (productId) => {
    try {
      const response = await api.get(`/product-comments/product/${productId}`)
      return response
    } catch (error) {
      console.error('Error fetching product comments:', error)
      throw error
    }
  },

  // Get only root comments (for lazy loading replies)
  getRootCommentsByProduct: async (productId) => {
    try {
      const response = await api.get(`/product-comments/product/${productId}/root`)
      return response
    } catch (error) {
      console.error('Error fetching root comments:', error)
      throw error
    }
  },

  // Get replies for a specific comment
  getRepliesByComment: async (commentId) => {
    try {
      const response = await api.get(`/product-comments/${commentId}/replies`)
      return response
    } catch (error) {
      console.error('Error fetching replies:', error)
      throw error
    }
  },

  // Get all comments by user
  getCommentsByUser: async (userId) => {
    try {
      const response = await api.get(`/product-comments/user/${userId}`)
      return response
    } catch (error) {
      console.error('Error fetching user comments:', error)
      throw error
    }
  },

  // Get comment count for a product
  getCommentCount: async (productId) => {
    try {
      const response = await api.get(`/product-comments/product/${productId}/count`)
      return response
    } catch (error) {
      console.error('Error fetching comment count:', error)
      throw error
    }
  },

  // Get reply count for a specific comment
  getReplyCount: async (commentId) => {
    try {
      const response = await api.get(`/product-comments/${commentId}/replies/count`)
      return response
    } catch (error) {
      console.error('Error fetching reply count:', error)
      throw error
    }
  },

  // Create a new comment or reply
  createComment: async (commentData) => {
    try {
      const response = await api.post('/product-comments', commentData)
      return response
    } catch (error) {
      console.error('Error creating comment:', error)
      throw error
    }
  },

  // Update comment content
  updateComment: async (commentId, content) => {
    try {
      const response = await api.put(`/product-comments/${commentId}`, { content })
      return response
    } catch (error) {
      console.error('Error updating comment:', error)
      throw error
    }
  },

  // Delete comment (cascade deletes all replies)
  deleteComment: async (commentId) => {
    try {
      const response = await api.delete(`/product-comments/${commentId}`)
      return response
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw error
    }
  }
}

export default commentService
