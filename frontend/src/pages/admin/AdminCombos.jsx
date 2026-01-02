import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Search, ToggleLeft, ToggleRight, Eye } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';
import { comboService, productService } from '../../services';
import { useToast } from '../../contexts/ToastContext';
import ProductSearchableSelect from '../../components/ProductSearchableSelect';

const AdminCombos = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [availableFilter, setAvailableFilter] = useState(undefined);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    imageUrl: '',
    availability: true,
    items: []
  });

  const { showToast } = useToast();

  useEffect(() => {
    loadCombos();
  }, [currentPage, availableFilter, searchTerm]);

  const loadCombos = async () => {
    setLoading(true);
    try {
      const response = await comboService.getAllCombos({
        page: currentPage,
        size: 10,
        sort: 'createdAt',
        direction: 'DESC',
        available: availableFilter,
        search: searchTerm
      });

      // API returns: { success, result: { content, totalPages, totalElements } }
      setCombos(response.result?.content || []);
      setTotalPages(response.result?.totalPages || 0);
      setTotalElements(response.result?.totalElements || 0);
    } catch (error) {
      showToast('Lỗi khi tải danh sách combo', 'error');
      console.error('Error loading combos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (combo = null) => {
    if (combo) {
      setEditingCombo(combo);
      setFormData({
        name: combo.name,
        price: combo.price,
        imageUrl: combo.imageUrl || '',
        availability: combo.availability,
        items: combo.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          productName: item.productName,
          productPrice: item.productPrice
        }))
      });
    } else {
      setEditingCombo(null);
      setFormData({
        name: '',
        price: '',
        imageUrl: '',
        availability: true,
        items: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCombo(null);
    setFormData({
      name: '',
      price: '',
      imageUrl: '',
      availability: true,
      items: []
    });
  };

  const handleAddProduct = (product) => {
    const exists = formData.items.find(item => item.productId === product.id);
    if (exists) {
      showToast('Sản phẩm đã có trong combo', 'warning');
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: product.id,
          quantity: 1,
          productName: product.name,
          productPrice: product.price
        }
      ]
    }));
  };

  const handleRemoveProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
  };

  const handleQuantityChange = (productId, quantity) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, parseInt(quantity) || 1) }
          : item
      )
    }));
  };

  const calculateTotals = () => {
    const totalOriginalPrice = formData.items.reduce(
      (sum, item) => sum + (item.productPrice * item.quantity),
      0
    );
    const comboPrice = parseFloat(formData.price) || 0;
    const discount = totalOriginalPrice - comboPrice;
    const discountPercentage = totalOriginalPrice > 0
      ? ((discount / totalOriginalPrice) * 100).toFixed(2)
      : 0;

    return {
      totalOriginalPrice,
      discount,
      discountPercentage: discount > 0 ? discountPercentage : 0
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      showToast('Tên combo không được để trống', 'error');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      showToast('Giá combo phải lớn hơn 0', 'error');
      return;
    }

    if (formData.items.length === 0) {
      showToast('Combo phải có ít nhất 1 sản phẩm', 'error');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      imageUrl: formData.imageUrl.trim() || null,
      availability: formData.availability,
      items: formData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    try {
      if (editingCombo) {
        await comboService.updateCombo(editingCombo.id, payload);
        showToast('Cập nhật combo thành công', 'success');
      } else {
        await comboService.createCombo(payload);
        showToast('Tạo combo thành công', 'success');
      }

      handleCloseModal();
      loadCombos();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra';
      showToast(errorMsg, 'error');
      console.error('Error saving combo:', error);
    }
  };

  const handleToggleAvailability = async (comboId) => {
    try {
      await comboService.toggleAvailability(comboId);
      showToast('Cập nhật trạng thái thành công', 'success');
      loadCombos();
    } catch (error) {
      showToast('Lỗi khi cập nhật trạng thái', 'error');
      console.error('Error toggling availability:', error);
    }
  };

  const handleDelete = async (comboId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa combo này?')) {
      return;
    }

    try {
      await comboService.deleteCombo(comboId);
      showToast('Xóa combo thành công', 'success');
      loadCombos();
    } catch (error) {
      showToast('Lỗi khi xóa combo', 'error');
      console.error('Error deleting combo:', error);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Quản lý Combo Sản Phẩm"
        description={`Tổng số combo: ${totalElements || 0}`}
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm combo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={availableFilter === undefined ? 'all' : availableFilter.toString()}
            onChange={(e) => {
              const value = e.target.value;
              setAvailableFilter(value === 'all' ? undefined : value === 'true');
              setCurrentPage(0);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="true">Đang bán</option>
            <option value="false">Ngừng bán</option>
          </select>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tạo Combo Mới
          </button>
        </div>
      </div>

      {/* Combos Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : !combos || combos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Chưa có combo nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Combo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá gốc
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá combo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm giá
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {combos.map((combo) => (
                  <tr key={combo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {combo.imageUrl ? (
                          <img
                            src={combo.imageUrl}
                            alt={combo.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{combo.name}</p>
                          <p className="text-sm text-gray-500">ID: {combo.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {combo.totalProducts} sản phẩm
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {combo.items?.slice(0, 2).map((item, idx) => (
                          <div key={idx}>
                            • {item.productName} x{item.quantity}
                          </div>
                        ))}
                        {combo.items && combo.items.length > 2 && (
                          <div className="text-blue-600">+{combo.items.length - 2} khác</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-gray-500 line-through">
                        {comboService.formatPrice(combo.totalOriginalPrice)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-red-600">
                        {comboService.formatPrice(combo.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        -{combo.discountPercentage}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleAvailability(combo.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          combo.availability
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {combo.availability ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            Đang bán
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            Ngừng bán
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(combo)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(combo.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {currentPage * 10 + 1} - {Math.min((currentPage + 1) * 10, totalElements)} trong tổng số {totalElements} combo
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCombo ? 'Chỉnh sửa Combo' : 'Tạo Combo Mới'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên combo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tên combo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá combo (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL hình ảnh
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Combo đang bán</span>
                  </label>
                </div>
              </div>

              {/* Products Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sản phẩm trong combo <span className="text-red-500">*</span>
                </label>
                
                <ProductSearchableSelect onSelect={handleAddProduct} />

                {formData.items.length > 0 && (
                  <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Sản phẩm
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Số lượng
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Đơn giá
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Thành tiền
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Xóa
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {formData.items.map((item) => (
                          <tr key={item.productId}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.productName}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                min="1"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                              {comboService.formatPrice(item.productPrice)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                              {comboService.formatPrice(item.productPrice * item.quantity)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(item.productId)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Summary */}
              {formData.items.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Thông tin giá</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng số sản phẩm:</span>
                      <span className="font-medium">
                        {formData.items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng giá gốc:</span>
                      <span className="font-medium">
                        {comboService.formatPrice(totals.totalOriginalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá combo:</span>
                      <span className="font-semibold text-red-600">
                        {comboService.formatPrice(parseFloat(formData.price) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-200">
                      <span className="text-gray-900 font-medium">Giảm giá:</span>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {comboService.formatPrice(totals.discount)}
                        </div>
                        {totals.discountPercentage > 0 && (
                          <div className="text-xs text-green-600">
                            ({totals.discountPercentage}% off)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCombo ? 'Cập nhật' : 'Tạo combo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCombos;
