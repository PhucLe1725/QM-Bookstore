import api from './api';

/**
 * Report Service - Handles all statistics and reports API calls
 * Base URL: /api/reports
 * Required: JWT token with ADMIN or MANAGER role
 */

class ReportService {
  /**
   * Get revenue report for date range
   * @param {Object} params - {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
   * @returns {Promise<Object>} Revenue report data
   */
  async getRevenueReport(params) {
    try {
      const response = await api.get('/reports/revenue', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue report:', error);
      throw error;
    }
  }

  /**
   * Get order statistics for date range
   * @param {Object} params - {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
   * @returns {Promise<Object>} Order statistics data
   */
  async getOrderStatistics(params) {
    try {
      const response = await api.get('/reports/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      throw error;
    }
  }

  /**
   * Get top selling products
   * @param {Object} params - {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', limit: number}
   * @returns {Promise<Array>} Top selling products
   */
  async getTopSellingProducts(params) {
    try {
      const response = await api.get('/reports/products/top-selling', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching top selling products:', error);
      throw error;
    }
  }

  /**
   * Get user statistics for date range
   * @param {Object} params - {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
   * @returns {Promise<Object>} User statistics data
   */
  async getUserStatistics(params) {
    try {
      const response = await api.get('/reports/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw error;
    }
  }

  /**
   * Get voucher usage report
   * @param {Object} params - {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
   * @returns {Promise<Array>} Voucher report data
   */
  async getVoucherReport(params) {
    try {
      const response = await api.get('/reports/vouchers', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching voucher report:', error);
      throw error;
    }
  }

  /**
   * Get dashboard summary (last 30 days by default)
   * @returns {Promise<Object>} Dashboard summary data
   */
  async getDashboardSummary() {
    try {
      const response = await api.get('/reports/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }

  /**
   * Export data to CSV format
   * @param {Array} data - Data to export
   * @param {Array} headers - Column headers
   * @param {string} filename - Output filename
   */
  exportToCSV(data, headers, filename) {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export revenue report to CSV
   * @param {Object} data - Revenue report data
   */
  exportRevenueReport(data) {
    if (!data) return;

    const revenueByDate = data.revenueByDate.map(item => ({
      'Ngày': item.date,
      'Doanh thu': item.revenue,
      'Số đơn': item.orderCount,
      'Giá trị TB': item.averageOrderValue
    }));

    this.exportToCSV(
      revenueByDate,
      ['Ngày', 'Doanh thu', 'Số đơn', 'Giá trị TB'],
      'bao-cao-doanh-thu'
    );
  }

  /**
   * Export top products to CSV
   * @param {Array} products - Top products data
   */
  exportTopProducts(products) {
    if (!products || products.length === 0) return;

    const formattedData = products.map(p => ({
      'ID': p.productId,
      'Tên sản phẩm': p.productName,
      'Danh mục': p.categoryName,
      'Số lượng bán': p.totalQuantitySold,
      'Doanh thu': p.totalRevenue,
      'Số đơn': p.orderCount,
      'Giá TB': p.averagePrice
    }));

    this.exportToCSV(
      formattedData,
      ['ID', 'Tên sản phẩm', 'Danh mục', 'Số lượng bán', 'Doanh thu', 'Số đơn', 'Giá TB'],
      'san-pham-ban-chay'
    );
  }

  /**
   * Export order statistics to CSV
   * @param {Object} data - Order statistics data
   */
  exportOrderStatistics(data) {
    if (!data) return;

    const ordersByDate = data.ordersByDate.map(item => ({
      'Ngày': item.date,
      'Tổng đơn': item.totalOrders,
      'Đã thanh toán': item.paidOrders,
      'Đã giao': item.deliveredOrders,
      'Đã hủy': item.cancelledOrders
    }));

    this.exportToCSV(
      ordersByDate,
      ['Ngày', 'Tổng đơn', 'Đã thanh toán', 'Đã giao', 'Đã hủy'],
      'thong-ke-don-hang'
    );
  }
}

export const reportService = new ReportService();
export default reportService;
