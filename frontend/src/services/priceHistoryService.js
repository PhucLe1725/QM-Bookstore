import api from './api';

/**
 * Price History Service - Handles price history tracking API calls
 * Base URL: /api/price-history
 * Required: JWT token
 * 
 * ⚠️ IMPORTANT: Page index starts from 0 (Spring Boot pagination)
 * See: backend/PRICE_HISTORY_FRONTEND_INTEGRATION.md for full API documentation
 */

class PriceHistoryService {
  /**
   * Get price history for a product
   * @param {number} productId - Product ID
   * @param {Object} params - {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', page: 0, size: 20}
   * @returns {Promise<Object>} Response with history array and productName in each item
   */
  async getProductPriceHistory(productId, params = {}) {
    try {
      const { startDate, endDate, page = 0, size = 20 } = params;
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await api.get(
        `/price-history/product/${productId}?${queryParams.toString()}`
      );
      return response; // api.get already returns response.data via interceptor
    } catch (error) {
      console.error('Error fetching product price history:', error);
      throw error;
    }
  }

  /**
   * Get latest price change for a product
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Latest price change record
   */
  async getLatestPriceChange(productId) {
    try {
      const response = await api.get(`/price-history/product/${productId}/latest`);
      return response; // api.get already returns response.data via interceptor
    } catch (error) {
      console.error('Error fetching latest price change:', error);
      throw error;
    }
  }

  /**
   * Get price trend for a product
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Price trend data
   * Response: {
   *   productId: number,
   *   productName: string,
   *   currentPrice: number,
   *   trend: 'INCREASED' | 'DECREASED' | 'UNCHANGED' | 'NO_HISTORY',
   *   latestChange: { from: number, to: number, percentage: number, date: string },
   *   changeCount: number
   * }
   */
  async getPriceTrend(productId) {
    try {
      const response = await api.get(`/price-history/product/${productId}/trend`);
      return response; // api.get already returns response.data via interceptor
    } catch (error) {
      console.error('Error fetching price trend:', error);
      throw error;
    }
  }

  /**
   * Get price statistics (admin only)
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Price statistics
   * Response: {
   *   totalChanges: number,
   *   increasedCount: number,
   *   decreasedCount: number,
   *   averageChangePercentage: number,
   *   topIncreases: Array,
   *   topDecreases: Array
   * }
   */
  async getPriceStatistics(startDate, endDate) {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await api.get(
        `/price-history/statistics?${queryParams.toString()}`
      );
      return response; // api.get already returns response.data via interceptor
    } catch (error) {
      console.error('Error fetching price statistics:', error);
      throw error;
    }
  }

  /**
   * Format price change percentage for display
   * @param {number} percentage - Change percentage
   * @returns {string} Formatted string (e.g., "+5.50%" or "-3.25%")
   */
  formatChangePercentage(percentage) {
    if (percentage === null || percentage === undefined) {
      return '0.00%';
    }
    const sign = percentage > 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  }

  /**
   * Get trend icon based on trend type
   * @param {string} trend - Trend type
   * @returns {string} Icon emoji
   */
  getTrendIcon(trend) {
    const icons = {
      INCREASED: '📈',
      DECREASED: '📉',
      UNCHANGED: '➖',
      NO_HISTORY: '❓'
    };
    return icons[trend] || '❓';
  }

  /**
   * Get trend label in Vietnamese
   * @param {string} trend - Trend type
   * @returns {string} Label in Vietnamese
   */
  getTrendLabel(trend) {
    const labels = {
      INCREASED: 'Tăng',
      DECREASED: 'Giảm',
      UNCHANGED: 'Không đổi',
      NO_HISTORY: 'Chưa có lịch sử'
    };
    return labels[trend] || 'Không xác định';
  }
}

export const priceHistoryService = new PriceHistoryService();
export default priceHistoryService;
