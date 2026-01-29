import React, { useState, useEffect } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  Save,
  AlertCircle,
  Package,
  Image as ImageIcon,
  DollarSign,
  AlertTriangle,
  PackagePlus,
  TrendingUp
} from 'lucide-react'
import { productService, categoryService } from '../../services'
import inventoryService from '../../services/inventoryService'
import { useToast } from '../../contexts/ToastContext'
import AdminPageHeader from '../../components/AdminPageHeader'
import SearchableSelect from '../../components/SearchableSelect'
import PriceHistoryModal from '../../components/PriceHistoryModal'

const AdminProducts = () => {
  const { showToast } = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [pageSize] = useState(10)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)

  // Price History Modal
  const [showPriceHistoryModal, setShowPriceHistoryModal] = useState(false)
  const [priceHistoryProduct, setPriceHistoryProduct] = useState(null)

  // Low Stock Warning
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [showLowStockAlert, setShowLowStockAlert] = useState(true)

  // Restock Modal
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [productToRestock, setProductToRestock] = useState(null)
  const [restockForm, setRestockForm] = useState({
    quantity: '',
    unitPrice: '',
    note: ''
  })

  // Form data
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    sku: '',
    price: '',
    imageUrl: '',
    shortDescription: '',
    fullDescription: '',
    brand: '',
    availability: true,
    stockQuantity: 0,
    reorderLevel: 10,
    reorderQuantity: 50
  })

  const [formErrors, setFormErrors] = useState({})

  // Categories - fetch from API
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = {
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      }

      if (searchTerm) params.name = searchTerm
      if (selectedCategory) params.categoryId = selectedCategory

      const response = await productService.getAllProducts(params)

      if (response.success) {
        setProducts(response.result.data || [])
        setTotalRecords(response.result.totalRecords || 0)
      }
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch low stock products
  const fetchLowStockProducts = async () => {
    try {
      const response = await productService.getLowStockProducts()
      if (response.success) {
        setLowStockProducts(response.result || [])
      }
    } catch (err) {
      console.error('Error fetching low stock products:', err)
      // Don't show error toast, just log it
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [currentPage, selectedCategory])

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
    fetchLowStockProducts()
  }, [])

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      const response = await categoryService.getCategoryTree()
      // Flatten tree to get all categories with indentation for display
      const flatCategories = flattenCategoryTree(response)
      setCategories(flatCategories)
    } catch (err) {
      console.error('Error fetching categories:', err)
      showToast('Không thể tải danh mục', 'error')
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Helper to flatten category tree with level indication
  const flattenCategoryTree = (tree, level = 0) => {
    let result = []
    for (const node of tree) {
      result.push({
        id: node.id,
        name: node.name,
        level: level,
        displayName: '—'.repeat(level) + (level > 0 ? ' ' : '') + node.name
      })
      if (node.children && node.children.length > 0) {
        result = [...result, ...flattenCategoryTree(node.children, level + 1)]
      }
    }
    return result
  }

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchProducts()
  }

  // Open create modal
  const handleCreate = () => {
    setModalMode('create')
    setFormData({
      categoryId: '',
      name: '',
      sku: '',
      price: '',
      imageUrl: '',
      shortDescription: '',
      fullDescription: '',
      brand: '',
      availability: true,
      stockQuantity: 0,
      reorderLevel: 10,
      reorderQuantity: 50
    })
    setFormErrors({})
    setShowModal(true)
  }

  // Open edit modal
  const handleEdit = (product) => {
    setModalMode('edit')
    setSelectedProduct(product)
    setFormData({
      categoryId: product.categoryId || '',
      name: product.name || '',
      sku: product.sku || '',
      price: product.price || '',
      imageUrl: product.imageUrl || '',
      shortDescription: product.shortDescription || '',
      fullDescription: product.fullDescription || '',
      brand: product.brand || '',
      availability: product.availability !== false,
      stockQuantity: product.stockQuantity || 0,
      reorderLevel: product.reorderLevel || 10,
      reorderQuantity: product.reorderQuantity || 50
    })
    setFormErrors({})
    setShowModal(true)
  }

  // Validate form
  const validateForm = () => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = 'Tên sản phẩm là bắt buộc'
    }

    if (!formData.sku.trim()) {
      errors.sku = 'Mã SKU là bắt buộc'
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = 'Giá phải lớn hơn 0'
    }

    if (formData.stockQuantity < 0) {
      errors.stockQuantity = 'Số lượng không được âm'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const submitData = {
        ...formData,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        reorderLevel: parseInt(formData.reorderLevel),
        reorderQuantity: parseInt(formData.reorderQuantity)
      }

      let response
      if (modalMode === 'create') {
        response = await productService.createProduct(submitData)
      } else {
        response = await productService.updateProduct(selectedProduct.id, submitData)
      }

      if (response.success) {
        setShowModal(false)
        fetchProducts()
        showToast(modalMode === 'create' ? 'Tạo sản phẩm thành công!' : 'Cập nhật sản phẩm thành công!', 'success')
      }
    } catch (err) {
      console.error('Error saving product:', err)
      showToast('Có lỗi xảy ra: ' + (err.response?.data?.message || err.message), 'error')
    }
  }

  // Handle price history
  const handlePriceHistory = (product) => {
    setPriceHistoryProduct(product)
    setShowPriceHistoryModal(true)
  }

  const handlePriceHistoryClose = () => {
    setShowPriceHistoryModal(false)
    setPriceHistoryProduct(null)
  }

  // Handle delete
  const handleDeleteClick = (product) => {
    setProductToDelete(product)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    try {
      const response = await productService.deleteProduct(productToDelete.id)

      if (response.success) {
        setShowDeleteConfirm(false)
        setProductToDelete(null)
        fetchProducts()
        showToast('Xóa sản phẩm thành công!', 'success')
      }
    } catch (err) {
      console.error('Error deleting product:', err)
      showToast('Có lỗi xảy ra khi xóa sản phẩm', 'error')
    }
  }

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  // Get stock status helper
  const getStockStatus = (product) => {
    if (!product.reorderLevel || product.reorderLevel === 0) {
      return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-50', label: 'Tồn kho tốt' }
    }

    if (product.stockQuantity <= product.reorderLevel) {
      return { status: 'low', color: 'text-red-600', bgColor: 'bg-red-50', label: 'Tồn kho thấp', icon: AlertTriangle }
    } else if (product.stockQuantity <= product.reorderLevel * 2) {
      return { status: 'medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Tồn kho trung bình' }
    }
    return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-50', label: 'Tồn kho tốt' }
  }

  // Handle restock
  const handleRestock = (product) => {
    setProductToRestock(product)
    setRestockForm({
      quantity: product.reorderQuantity || 50,
      unitPrice: '',
      note: `Nhập hàng bổ sung cho ${product.name}`
    })
    setShowRestockModal(true)
  }

  const handleRestockSubmit = async (e) => {
    e.preventDefault()

    if (!restockForm.quantity || restockForm.quantity <= 0) {
      showToast('Vui lòng nhập số lượng hợp lệ', 'warning')
      return
    }

    if (!restockForm.unitPrice || parseFloat(restockForm.unitPrice) <= 0) {
      showToast('Vui lòng nhập giá nhập hợp lệ', 'warning')
      return
    }

    try {
      const payload = {
        transactionType: 'IN',
        referenceType: 'MANUAL',
        note: restockForm.note || `Nhập hàng bổ sung cho ${productToRestock.name}`,
        items: [{
          productId: productToRestock.id,
          changeType: 'PLUS',
          quantity: parseInt(restockForm.quantity),
          unitPrice: parseFloat(restockForm.unitPrice)
        }]
      }

      const response = await inventoryService.createTransaction(payload)
      if (response.success) {
        showToast('Tạo phiếu nhập kho thành công!', 'success')
        setShowRestockModal(false)
        setProductToRestock(null)
        setRestockForm({ quantity: '', unitPrice: '', note: '' })
        // Refresh data
        fetchProducts()
        fetchLowStockProducts()
      }
    } catch (err) {
      console.error('Error creating restock transaction:', err)
      showToast('Có lỗi xảy ra khi tạo phiếu nhập kho', 'error')
    }
  }

  // Format currency for restock modal
  const formatCurrency = (amount) => {
    if (!amount) return '0₫'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate total for restock
  const restockTotal = restockForm.quantity && restockForm.unitPrice
    ? parseInt(restockForm.quantity) * parseFloat(restockForm.unitPrice)
    : 0

  // Calculate pagination
  const totalPages = Math.ceil(totalRecords / pageSize)

  // Filter products for display
  // When showing low stock only, use the lowStockProducts array
  // Otherwise use the paginated products array
  const displayProducts = showLowStockOnly ? lowStockProducts : products

  const lowStockCount = lowStockProducts.length

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader
        title="Quản lý sản phẩm"
        description="Thêm, sửa, xóa và quản lý sản phẩm trong hệ thống"
        actions={
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Thêm sản phẩm
          </button>
        }
      />
      <div className="max-w-7xl mx-auto p-6">

        {/* Low Stock Alert Banner */}
        {lowStockCount > 0 && showLowStockAlert && (
          <div className="mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-orange-800">
                    Cảnh báo tồn kho thấp
                  </h3>
                  <p className="mt-1 text-sm text-orange-700">
                    Có <span className="font-semibold">{lowStockCount}</span> sản phẩm đang có tồn kho thấp hơn mức đặt hàng lại.
                  </p>
                  <button
                    onClick={() => setShowLowStockOnly(true)}
                    className="mt-2 text-sm font-medium text-orange-800 hover:text-orange-900 underline"
                  >
                    Xem danh sách sản phẩm →
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowLowStockAlert(false)}
                className="text-orange-400 hover:text-orange-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc mã sản phẩm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Tìm
              </button>
            </form>

            {/* Category Filter */}
            <div className="w-64">
              <SearchableSelect
                options={categories}
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value ? Number(value) : null)}
                placeholder="Tất cả danh mục"
                disabled={categoriesLoading}
              />
            </div>

            {/* Low Stock Filter */}
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium relative ${showLowStockOnly
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              <AlertTriangle className="h-5 w-5" />
              <span>Tồn kho thấp</span>
              {lowStockCount > 0 && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${showLowStockOnly ? 'bg-orange-800 text-white' : 'bg-orange-100 text-orange-800'
                  }`}>
                  {lowStockCount}
                </span>
              )}
            </button>

            {/* Add Button */}
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>Thêm sản phẩm</span>
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchProducts}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Thử lại
              </button>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showLowStockOnly ? 'Không có sản phẩm tồn kho thấp' : 'Chưa có sản phẩm nào'}
              </h3>
              <p className="text-gray-500 mb-4">
                {showLowStockOnly
                  ? 'Tất cả sản phẩm đều có tồn kho đầy đủ'
                  : 'Bắt đầu bằng cách thêm sản phẩm đầu tiên'
                }
              </p>
              {!showLowStockOnly && (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="h-5 w-5" />
                  <span>Thêm sản phẩm</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Danh mục
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tồn kho
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayProducts.map((product) => {
                      const stockStatus = getStockStatus(product)
                      const StockIcon = stockStatus.icon

                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                {product.imageUrl ? (
                                  <img
                                    className="h-10 w-10 rounded object-cover"
                                    src={product.imageUrl}
                                    alt={product.name}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                {product.brand && (
                                  <div className="text-sm text-gray-500">
                                    {product.brand}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{product.sku}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.categoryName || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(product.price)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.stockQuantity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.availability ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Còn hàng
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Hết hàng
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {stockStatus.status === 'low' && (
                              <button
                                onClick={() => handleRestock(product)}
                                className="text-orange-600 hover:text-orange-900 mr-3"
                                title="Nhập hàng"
                              >
                                <PackagePlus className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handlePriceHistory(product)}
                              className="text-green-600 hover:text-green-900 mr-3"
                              title="Lịch sử giá"
                            >
                              <DollarSign className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(product)}
                              className="text-red-600 hover:text-red-900"
                              title="Xóa"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination - hide when showing low stock filter */}
              {!showLowStockOnly && totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> đến{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, totalRecords)}
                      </span>{' '}
                      trong tổng số <span className="font-medium">{totalRecords}</span> sản phẩm
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {modalMode === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Nhập tên sản phẩm"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.sku ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="SKU001"
                  />
                  {formErrors.sku && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.sku}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục
                  </label>
                  <SearchableSelect
                    options={categories}
                    value={formData.categoryId}
                    onChange={(value) => setFormData({ ...formData, categoryId: value })}
                    placeholder={categoriesLoading ? 'Đang tải...' : 'Chọn danh mục'}
                    disabled={categoriesLoading}
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="0.00"
                  />
                  {formErrors.price && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.price}</p>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thương hiệu
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tên thương hiệu"
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng tồn kho
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.stockQuantity ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="0"
                  />
                  {formErrors.stockQuantity && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.stockQuantity}</p>
                  )}
                </div>

                {/* Reorder Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mức đặt hàng lại
                  </label>
                  <input
                    type="number"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>

                {/* Reorder Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng đặt hàng lại
                  </label>
                  <input
                    type="number"
                    value={formData.reorderQuantity}
                    onChange={(e) => setFormData({ ...formData, reorderQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>

                {/* Availability */}
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Sản phẩm có sẵn để bán
                    </span>
                  </label>
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL hình ảnh
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.imageUrl && (
                      <div className="h-10 w-10 rounded border border-gray-300 overflow-hidden flex-shrink-0">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Short Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả ngắn
                  </label>
                  <textarea
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mô tả ngắn gọn về sản phẩm"
                  />
                </div>

                {/* Full Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mô tả chi tiết về sản phẩm"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save className="h-5 w-5" />
                  <span>{modalMode === 'create' ? 'Tạo sản phẩm' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Xác nhận xóa sản phẩm
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Bạn có chắc chắn muốn xóa sản phẩm <span className="font-medium">{productToDelete?.name}</span>?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setProductToDelete(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && productToRestock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <PackagePlus className="h-6 w-6 text-orange-600" />
                Nhập hàng bổ sung
              </h2>
              <button
                onClick={() => {
                  setShowRestockModal(false)
                  setProductToRestock(null)
                  setRestockForm({ quantity: '', unitPrice: '', note: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Product Info */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-4">
                {productToRestock.imageUrl ? (
                  <img
                    src={productToRestock.imageUrl}
                    alt={productToRestock.name}
                    className="w-16 h-16 rounded object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{productToRestock.name}</h3>
                  <p className="text-sm text-gray-600">SKU: {productToRestock.sku}</p>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tồn kho hiện tại:</span>
                      <span className="ml-2 font-semibold text-red-600">{productToRestock.stockQuantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mức đặt lại:</span>
                      <span className="ml-2 font-semibold text-gray-900">{productToRestock.reorderLevel}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">SL đề xuất:</span>
                      <span className="ml-2 font-semibold text-blue-600">{productToRestock.reorderQuantity}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Restock Form */}
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={restockForm.quantity}
                    onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nhập số lượng"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá nhập (₫) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={restockForm.unitPrice}
                    onChange={(e) => setRestockForm({ ...restockForm, unitPrice: e.target.value })}
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nhập giá"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={restockForm.note}
                  onChange={(e) => setRestockForm({ ...restockForm, note: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Nhập ghi chú (tùy chọn)"
                />
              </div>

              {/* Total */}
              {restockTotal > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-700">Tổng giá trị nhập:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(restockTotal)}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowRestockModal(false)
                    setProductToRestock(null)
                    setRestockForm({ quantity: '', unitPrice: '', note: '' })
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>Tạo Phiếu Nhập Kho</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      <PriceHistoryModal
        isOpen={showPriceHistoryModal}
        onClose={handlePriceHistoryClose}
        product={priceHistoryProduct}
        onPriceUpdated={fetchProducts}
      />
    </div>
  )
}

export default AdminProducts
