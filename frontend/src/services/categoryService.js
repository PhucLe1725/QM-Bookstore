import api from './api'

/**
 * Category Service
 * Handles all category-related API calls
 * 
 * API Endpoints từ backend:
 * - GET /api/categories/tree - Lấy cây phân cấp hoàn chỉnh (cho mega-menu)
 * - GET /api/categories?parent_id={id} - Lấy danh sách con trực tiếp
 * - GET /api/categories/{id} - Lấy thông tin chi tiết 1 category
 * - GET /api/categories/slug/{slug} - Lấy category qua slug
 * - GET /api/categories/all - Lấy tất cả categories (flat list)
 */

export const categoryService = {
  /**
   * Lấy cây phân cấp hoàn chỉnh cho mega-menu
   * Response: Array của categories với children nested
   */
  getCategoryTree: async () => {
    try {
      const response = await api.get('/categories/tree')

      // Check if response is wrapped in an object
      if (response && typeof response === 'object') {
        // Try common response patterns
        if (Array.isArray(response)) {
          return response
        } else if (response.data && Array.isArray(response.data)) {
          return response.data
        } else if (response.result && Array.isArray(response.result)) {
          return response.result
        }
      }

      // Fallback: if not an array, return empty array to prevent map errors
      console.warn('Unexpected response format from category tree API:', response)
      return []
    } catch (error) {
      console.error('Error fetching category tree:', error)
      // Return empty array instead of throwing to prevent app crash
      return []
    }
  },

  /**
   * Lấy danh sách categories theo parent_id
   * @param {number} parentId - ID của category cha (null = root categories)
   */
  getCategoriesByParent: async (parentId = null) => {
    try {
      const url = parentId
        ? `/categories?parent_id=${parentId}`
        : '/categories'
      const response = await api.get(url)
      return response // api.js interceptor đã unwrap thành response.data
    } catch (error) {
      console.error('Error fetching categories by parent:', error)
      throw error
    }
  },

  /**
   * Lấy thông tin chi tiết của 1 category
   * @param {number} id - Category ID
   */
  getCategoryById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`)
      return response // api.js interceptor đã unwrap thành response.data
    } catch (error) {
      console.error('Error fetching category by id:', error)
      throw error
    }
  },

  /**
   * Lấy category qua slug (cho URL routing)
   * @param {string} slug - Category slug
   */
  getCategoryBySlug: async (slug) => {
    try {
      const response = await api.get(`/categories/slug/${slug}`)
      return response // api.js interceptor đã unwrap thành response.data
    } catch (error) {
      console.error('Error fetching category by slug:', error)
      throw error
    }
  },

  /**
   * Lấy tất cả categories dạng flat list (cho admin)
   */
  getAllCategories: async () => {
    try {
      const response = await api.get('/categories/all')
      return response // api.js interceptor đã unwrap thành response.data
    } catch (error) {
      console.error('Error fetching all categories:', error)
      throw error
    }
  },

  /**
   * Tìm path từ root đến category hiện tại (cho breadcrumb)
   * @param {Array} tree - Category tree từ getCategoryTree()
   * @param {number} targetId - ID của category cần tìm
   * @param {Array} path - Đường đi hiện tại (để đệ quy)
   * @returns {Array|null} - Mảng các categories từ root → target
   */
  findCategoryPath: (tree, targetId, path = []) => {
    for (const node of tree) {
      const currentPath = [...path, node]
      if (node.id === targetId) return currentPath
      if (node.children?.length) {
        const result = categoryService.findCategoryPath(node.children, targetId, currentPath)
        if (result) return result
      }
    }
    return null
  },

  /**
   * Tìm category node trong tree theo ID
   * @param {Array} tree - Category tree
   * @param {number} targetId - ID cần tìm
   * @returns {Object|null} - Category node hoặc null
   */
  findCategoryNode: (tree, targetId) => {
    for (const node of tree) {
      if (node.id === targetId) return node
      if (node.children?.length) {
        const result = categoryService.findCategoryNode(node.children, targetId)
        if (result) return result
      }
    }
    return null
  },

  /**
   * Lấy tất cả descendant IDs của một category (đệ quy)
   * @param {Object} categoryNode - Category node từ tree
   * @returns {Array<number>} - Mảng các descendant IDs
   */
  getAllDescendantIds: (categoryNode) => {
    if (!categoryNode || !categoryNode.children || categoryNode.children.length === 0) {
      return []
    }

    let descendantIds = []
    for (const child of categoryNode.children) {
      descendantIds.push(child.id)
      // Đệ quy lấy descendants của child
      const childDescendants = categoryService.getAllDescendantIds(child)
      descendantIds = [...descendantIds, ...childDescendants]
    }

    return descendantIds
  },

  // ==================== ADMIN APIs ====================

  /**
   * Lấy cây phân cấp hoàn chỉnh cho admin (bao gồm cả inactive)
   * Response: Array của categories với children nested
   */
  getAdminCategoryTree: async () => {
    try {
      const response = await api.get('/admin/categories/tree')

      // Check if response is wrapped in an object
      if (response && typeof response === 'object') {
        // Try common response patterns
        if (Array.isArray(response)) {
          return response
        } else if (response.data && Array.isArray(response.data)) {
          return response.data
        } else if (response.result && Array.isArray(response.result)) {
          return response.result
        }
      }

      // Fallback: if not an array, return empty array to prevent map errors
      console.warn('Unexpected response format from admin category tree API:', response)
      return []
    } catch (error) {
      console.error('Error fetching admin category tree:', error)
      // Return empty array instead of throwing to prevent app crash
      return []
    }
  },

  /**
   * Tạo category mới (Admin only)
   * @param {Object} data - { name, slug?, description?, parentId?, status? }
   */
  createCategory: async (data) => {
    try {
      const response = await api.post('/admin/categories', data)
      return response
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  },

  /**
   * Cập nhật category (Admin only)
   * @param {number} id - Category ID
   * @param {Object} data - { name?, slug?, description?, parentId?, status? }
   */
  updateCategory: async (id, data) => {
    try {
      const response = await api.put(`/admin/categories/${id}`, data)
      return response
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  },

  /**
   * Xóa category (Admin only)
   * @param {number} id - Category ID
   * @param {boolean} force - true = xóa cả children
   */
  deleteCategory: async (id, force = false) => {
    try {
      const url = `/admin/categories/${id}${force ? '?force=true' : ''}`
      const response = await api.delete(url)
      return response
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  },

  /**
   * Bật/tắt status category (Admin only)
   * @param {number} id - Category ID
   */
  toggleCategoryStatus: async (id) => {
    try {
      const response = await api.patch(`/admin/categories/${id}/toggle-status`)
      return response
    } catch (error) {
      console.error('Error toggling category status:', error)
      throw error
    }
  },

  /**
   * Di chuyển category sang parent mới (Admin only)
   * @param {number} id - Category ID
   * @param {number|null} newParentId - ID của parent mới (null = move to root)
   */
  moveCategory: async (id, newParentId) => {
    try {
      const response = await api.patch(`/admin/categories/${id}/move`, {
        newParentId
      })
      return response
    } catch (error) {
      console.error('Error moving category:', error)
      throw error
    }
  },

  /**
   * Xóa nhiều categories (Admin only)
   * @param {Array<number>} categoryIds - Mảng các category IDs
   * @param {boolean} force - true = xóa cả children
   */
  bulkDeleteCategories: async (categoryIds, force = false) => {
    try {
      const response = await api.post('/admin/categories/bulk-delete', {
        categoryIds,
        force
      })
      return response
    } catch (error) {
      console.error('Error bulk deleting categories:', error)
      throw error
    }
  }
}

export default categoryService
