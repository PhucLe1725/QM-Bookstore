import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { comboService } from '../services';
import { Package, ShoppingCart, ArrowRight } from 'lucide-react';

const Combos = () => {
  const navigate = useNavigate();
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchCombos();
  }, [currentPage]);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const response = await comboService.getAllCombos({
        page: currentPage,
        size: 12,
        sort: 'createdAt',
        direction: 'DESC',
        available: true
      });

      setCombos(response.result?.content || []);
      setTotalPages(response.result?.totalPages || 0);
    } catch (error) {
      console.error('Error fetching combos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleAddToCart = (combo) => {
    // TODO: Implement add combo to cart
    console.log('Add combo to cart:', combo);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang tải combo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Combo Sản Phẩm</h1>
        <p className="text-gray-600">Mua combo giá ưu đãi, tiết kiệm hơn khi mua lẻ</p>
      </div>

      {/* Combos Grid */}
      {combos.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-24 h-24 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có combo nào</h3>
          <p className="text-gray-600 mb-6">Hiện tại chưa có combo sản phẩm nào</p>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Xem tất cả sản phẩm
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {combos.map((combo) => (
              <div
                key={combo.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {combo.imageUrl ? (
                    <img
                      src={combo.imageUrl}
                      alt={combo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-20 h-20 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Discount Badge */}
                  {combo.discountPercentage > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      -{combo.discountPercentage}%
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                    {combo.name}
                  </h3>

                  {/* Products in combo */}
                  <div className="mb-3 text-xs text-gray-600">
                    <div className="font-medium mb-1">{combo.totalProducts} sản phẩm:</div>
                    {combo.items?.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="truncate">
                        • {item.productName} x{item.quantity}
                      </div>
                    ))}
                    {combo.items?.length > 2 && (
                      <div className="text-blue-600 font-medium">
                        +{combo.items.length - 2} sản phẩm khác
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrency(combo.totalOriginalPrice)}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-red-600">
                        {formatCurrency(combo.price)}
                      </span>
                      <span className="text-sm text-green-600 font-medium">
                        Tiết kiệm {formatCurrency(combo.discountAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleAddToCart(combo)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              
              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`w-10 h-10 rounded-lg ${
                      currentPage === idx
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Combos;
