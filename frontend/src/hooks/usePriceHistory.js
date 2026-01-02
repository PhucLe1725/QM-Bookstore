import { useState, useEffect } from 'react';
import priceHistoryService from '../services/priceHistoryService';

/**
 * Custom hook for managing product price history
 * @param {number} productId - Product ID to track
 * @returns {Object} Price history data and utilities
 */
export const usePriceHistory = (productId) => {
  const [history, setHistory] = useState([]);
  const [latest, setLatest] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    
    loadPriceData();
  }, [productId]);
  
  const loadPriceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all data in parallel
      const [historyData, latestData, trendData] = await Promise.all([
        priceHistoryService.getProductPriceHistory(productId, { size: 10 }),
        priceHistoryService.getLatestPriceChange(productId).catch(() => null), // Allow failure
        priceHistoryService.getPriceTrend(productId).catch(() => null) // Allow failure
      ]);
      
      setHistory(historyData || []);
      setLatest(latestData);
      setTrend(trendData);
    } catch (err) {
      setError(err);
      console.error('Load price history failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Load more history records with pagination
   * @param {number} page - Page number
   * @param {number} size - Page size
   */
  const loadMore = async (page = 1, size = 10) => {
    try {
      const moreData = await priceHistoryService.getProductPriceHistory(productId, { page, size });
      setHistory(prev => [...prev, ...moreData]);
    } catch (err) {
      console.error('Load more price history failed:', err);
    }
  };
  
  /**
   * Filter history by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  const filterByDateRange = async (startDate, endDate) => {
    try {
      setLoading(true);
      const filteredData = await priceHistoryService.getProductPriceHistory(productId, { 
        startDate, 
        endDate,
        size: 50 
      });
      setHistory(filteredData);
    } catch (err) {
      setError(err);
      console.error('Filter price history failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return { 
    history, 
    latest, 
    trend, 
    loading, 
    error, 
    reload: loadPriceData,
    loadMore,
    filterByDateRange
  };
};

export default usePriceHistory;
