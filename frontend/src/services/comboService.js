import api from './api';

/**
 * Product Combo Service - Handles combo product API calls
 * Base URL: /api/product-combos
 * Required: JWT token for admin operations
 */

class ComboService {
  /**
   * Get all combos with pagination
   * @param {Object} params - {page: 0, size: 20, sort: 'createdAt', direction: 'DESC', available: true/false, search: ''}
   * @returns {Promise<Object>} Paginated combos
   */
  async getAllCombos(params = {}) {
    try {
      const { page = 0, size = 20, sort = 'createdAt', direction = 'DESC', available, search } = params;
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sort,
        direction
      });
      
      if (available !== undefined) queryParams.append('available', available.toString());
      if (search) queryParams.append('search', search);
      
      const response = await api.get(`/product-combos?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching combos:', error);
      throw error;
    }
  }

  /**
   * Get combo by ID
   * @param {number} comboId - Combo ID
   * @returns {Promise<Object>} Combo details with items
   */
  async getComboById(comboId) {
    try {
      const response = await api.get(`/product-combos/${comboId}`);
      return response;
    } catch (error) {
      console.error('Error fetching combo:', error);
      throw error;
    }
  }

  /**
   * Create new combo
   * @param {Object} comboData - {name, price, imageUrl, availability, items: [{productId, quantity}]}
   * @returns {Promise<Object>} Created combo
   */
  async createCombo(comboData) {
    try {
      const response = await api.post('/product-combos', comboData);
      return response;
    } catch (error) {
      console.error('Error creating combo:', error);
      throw error;
    }
  }

  /**
   * Update combo
   * @param {number} comboId - Combo ID
   * @param {Object} comboData - {name, price, imageUrl, availability, items}
   * @returns {Promise<Object>} Updated combo
   */
  async updateCombo(comboId, comboData) {
    try {
      const response = await api.put(`/product-combos/${comboId}`, comboData);
      return response;
    } catch (error) {
      console.error('Error updating combo:', error);
      throw error;
    }
  }

  /**
   * Delete combo
   * @param {number} comboId - Combo ID
   * @returns {Promise<Object>} Success message
   */
  async deleteCombo(comboId) {
    try {
      const response = await api.delete(`/product-combos/${comboId}`);
      return response;
    } catch (error) {
      console.error('Error deleting combo:', error);
      throw error;
    }
  }

  /**
   * Toggle combo availability
   * @param {number} comboId - Combo ID
   * @returns {Promise<Object>} Updated combo
   */
  async toggleAvailability(comboId) {
    try {
      const response = await api.patch(`/product-combos/${comboId}/toggle-availability`);
      return response;
    } catch (error) {
      console.error('Error toggling availability:', error);
      throw error;
    }
  }

  /**
   * Get combos containing a product
   * @param {number} productId - Product ID
   * @returns {Promise<Array>} Combos containing the product
   */
  async getCombosByProduct(productId) {
    try {
      const response = await api.get(`/product-combos/by-product/${productId}`);
      return response;
    } catch (error) {
      console.error('Error fetching combos by product:', error);
      throw error;
    }
  }

  /**
   * Count combos
   * @param {boolean|undefined} available - Filter by availability
   * @returns {Promise<number>} Count
   */
  async countCombos(available) {
    try {
      const queryParams = new URLSearchParams();
      if (available !== undefined) queryParams.append('available', available.toString());
      
      const response = await api.get(`/product-combos/count?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error counting combos:', error);
      throw error;
    }
  }

  /**
   * Format price
   * @param {number} price - Price value
   * @returns {string} Formatted price
   */
  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }
}

export const comboService = new ComboService();
export default comboService;
