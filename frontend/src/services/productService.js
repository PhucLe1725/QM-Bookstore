import api from './api'

/**
 * Product Service
 * Handles all product-related API calls
 */

export const productService = {
  /**
   * Lấy sản phẩm theo category ID
   * @param {number} categoryId - Category ID
   */
  getProductsByCategory: async (categoryId) => {
    try {
      const response = await api.get(`/products/category/${categoryId}`)
      return response // api.js đã unwrap response.data
    } catch (error) {
      console.error('Error fetching products by category:', error)
      throw error
    }
  },

  // Get all products with pagination and filters
  getAllProducts: async (params = {}) => {
    const queryParams = new URLSearchParams({
      skipCount: 0,
      maxResultCount: 12,
      sortDirection: 'desc',
      ...params
    })

    try {
      const response = await api.get(`/products?${queryParams}`)
      return response
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  },

  // Get products by category
  getProductsByCategory: async (categoryId) => {
    try {
      const response = await api.get(`/products/category/${categoryId}`)
      return response
    } catch (error) {
      console.error('Error fetching products by category:', error)
      throw error
    }
  },

  // Search products by name
  searchProducts: async (searchTerm) => {
    try {
      const response = await api.get(`/products/search?name=${encodeURIComponent(searchTerm)}`)
      return response
    } catch (error) {
      console.error('Error searching products:', error)
      throw error
    }
  },

  // Search products by SKU
  searchProductsBySku: async (sku) => {
    try {
      const response = await api.get(`/products/search/sku?sku=${encodeURIComponent(sku)}`)
      return response
    } catch (error) {
      console.error('Error searching products by SKU:', error)
      throw error
    }
  },

  // Search products by brand
  searchProductsByBrand: async (brand) => {
    try {
      const response = await api.get(`/products/search/brand?brand=${encodeURIComponent(brand)}`)
      return response
    } catch (error) {
      console.error('Error searching products by brand:', error)
      throw error
    }
  },

  // Get available products
  getAvailableProducts: async () => {
    try {
      const response = await api.get('/products/available')
      return response
    } catch (error) {
      console.error('Error fetching available products:', error)
      throw error
    }
  },

  // Get low stock products (stockQuantity <= reorderLevel)
  getLowStockProducts: async () => {
    try {
      const response = await api.get('/products/low-stock')
      return response
    } catch (error) {
      console.error('Error fetching low stock products:', error)
      throw error
    }
  },

  // Create new product (Admin/Manager only)
  createProduct: async (productData) => {
    try {
      const response = await api.post('/products', productData)
      return response
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  },

  // Update product (Admin/Manager only)
  updateProduct: async (id, productData) => {
    try {
      const response = await api.put(`/products/${id}`, productData)
      return response
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  },

  // Delete product (Admin/Manager only)
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`)
      return response
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  },

  // Update product stock quantity (Admin/Manager only)
  updateProductStock: async (id, stockQuantity) => {
    try {
      const response = await api.patch(`/products/${id}/stock`, { stockQuantity })
      return response
    } catch (error) {
      console.error('Error updating product stock:', error)
      throw error
    }
  },

  // Update product availability (Admin/Manager only)
  updateProductAvailability: async (id, availability) => {
    try {
      const response = await api.patch(`/products/${id}/availability`, { availability })
      return response
    } catch (error) {
      console.error('Error updating product availability:', error)
      throw error
    }
  }
}

export default productService
