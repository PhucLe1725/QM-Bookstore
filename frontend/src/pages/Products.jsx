import React, { useState, useEffect } from 'react'
import { Search, Filter, ShoppingCart, X, ChevronDown, Grid, List } from 'lucide-react'
import { productService, cartService } from '../services'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import CategoryMenu from '../components/CategoryMenu'

const Products = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add to cart state
  const [addingToCartId, setAddingToCartId] = useState(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [pageSize] = useState(12)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedCategoryName, setSelectedCategoryName] = useState('Tất cả')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  // Handle add to cart
  const handleAddToCart = async (productId, e) => {
    e.stopPropagation() // Prevent navigating to product detail
    if (addingToCartId) return

    setAddingToCartId(productId)
    try {
      await cartService.addToCart(productId, 1) // Always add 1 quantity from this page
      toast.success('Đã thêm sản phẩm vào giỏ hàng!')
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng')
    } finally {
      setAddingToCartId(null)
    }
  }

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = {
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sortBy,
        sortDirection
      }

      // Add filters if set
      if (searchTerm) params.name = searchTerm
      if (selectedCategory) params.categoryId = selectedCategory
      if (priceRange.min) params.minPrice = priceRange.min
      if (priceRange.max) params.maxPrice = priceRange.max

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

  useEffect(() => {
    fetchProducts()
  }, [currentPage, sortBy, sortDirection, selectedCategory])

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category.id)
    setSelectedCategoryName(category.name)
    setCurrentPage(1)
  }

  const handleClearCategory = () => {
    setSelectedCategory(null)
    setSelectedCategoryName('Tất cả')
    setCurrentPage(1)
  }

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchProducts()
  }

  // Handle filter reset
  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCategory(null)
    setPriceRange({ min: '', max: '' })
    setSortBy('createdAt')
    setSortDirection('desc')
    setCurrentPage(1)
  }

  // Calculate pagination
  const totalPages = Math.ceil(totalRecords / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalRecords)

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Sản phẩm</h1>
          <p className="text-blue-100 text-lg">Khám phá bộ sưu tập văn phòng phẩm đa dạng của chúng tôi</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              {/* Categories */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Danh mục</h3>
                  {selectedCategory && (
                    <button
                      onClick={handleClearCategory}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>

                {/* Selected Category Display */}
                {selectedCategory && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700 font-medium">
                        📁 {selectedCategoryName}
                      </span>
                      <button
                        onClick={handleClearCategory}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Category Tree Menu */}
                <div className="border border-gray-200 rounded-lg p-2 max-h-96 overflow-y-auto">
                  <CategoryMenu
                    onCategorySelect={handleCategorySelect}
                    compact
                  />
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Khoảng giá</h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Từ"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Đến"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={fetchProducts}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Sắp xếp</h3>
                <select
                  value={`${sortBy}-${sortDirection}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('-')
                    setSortBy(field)
                    setSortDirection(direction)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="createdAt-desc">Mới nhất</option>
                  <option value="createdAt-asc">Cũ nhất</option>
                  <option value="name-asc">Tên A-Z</option>
                  <option value="name-desc">Tên Z-A</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Mobile Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Tìm
                  </button>
                </form>

                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="h-5 w-5" />
                  <span>Bộ lọc</span>
                </button>

                {/* View Mode Toggle */}
                <div className="hidden md:flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Mobile Filters Dropdown */}
              {showFilters && (
                <div className="lg:hidden mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-4">
                    {/* Categories */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Danh mục</h3>
                      <select
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Tất cả</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Sắp xếp</h3>
                      <select
                        value={`${sortBy}-${sortDirection}`}
                        onChange={(e) => {
                          const [field, direction] = e.target.value.split('-')
                          setSortBy(field)
                          setSortDirection(direction)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="createdAt-desc">Mới nhất</option>
                        <option value="createdAt-asc">Cũ nhất</option>
                        <option value="name-asc">Tên A-Z</option>
                        <option value="name-desc">Tên Z-A</option>
                        <option value="price-asc">Giá tăng dần</option>
                        <option value="price-desc">Giá giảm dần</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Hiển thị <span className="font-medium">{startItem}-{endItem}</span> trong tổng số <span className="font-medium">{totalRecords}</span> sản phẩm
              </p>
            </div>

            {/* Products Grid/List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium"
                >
                  Thử lại
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-500 mb-4">Thử điều chỉnh bộ lọc hoặc tìm kiếm khác</p>
                <button
                  onClick={resetFilters}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <div className="relative aspect-square overflow-hidden bg-gray-100">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart className="h-20 w-20 text-gray-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 z-10"></div>
                          {(!product.availability || product.stockQuantity === 0) && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
                              <span className="bg-red-500 text-white px-4 py-2 rounded-full font-medium">
                                Hết hàng
                              </span>
                            </div>
                          )}
                          {product.availability && product.stockQuantity > 0 && (
                            <button
                              onClick={(e) => handleAddToCart(product.id, e)}
                              disabled={addingToCartId === product.id}
                              className="absolute bottom-3 right-3 bg-blue-600 text-white p-2 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed z-20"
                              aria-label="Thêm vào giỏ hàng"
                            >
                              {addingToCartId === product.id ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                              ) : (
                                <ShoppingCart className="h-6 w-6" />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </h3>
                          {product.shortDescription && (
                            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                              {product.shortDescription}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-blue-600">
                              {formatPrice(product.price)}
                            </span>
                            {product.availability && product.stockQuantity > 0 && (
                              <span className="text-xs text-green-600 font-medium">
                                Còn hàng
                              </span>
                            )}
                          </div>
                          {product.brand && (
                            <p className="text-xs text-gray-400 mt-2">
                              Thương hiệu: {product.brand}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <div className="flex flex-col sm:flex-row">
                          <div className="relative w-full sm:w-48 h-48 flex-shrink-0 overflow-hidden bg-gray-100">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingCart className="h-16 w-16 text-gray-300" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 z-10"></div>
                            {(!product.availability || product.stockQuantity === 0) && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
                                <span className="bg-red-500 text-white px-4 py-2 rounded-full font-medium text-sm">
                                  Hết hàng
                                </span>
                              </div>
                            )}
                            {product.availability && product.stockQuantity > 0 && (
                              <button
                                onClick={(e) => handleAddToCart(product.id, e)}
                                disabled={addingToCartId === product.id}
                                className="absolute bottom-3 right-3 bg-blue-600 text-white p-2 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed z-20"
                                aria-label="Thêm vào giỏ hàng"
                              >
                                {addingToCartId === product.id ? (
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                ) : (
                                  <ShoppingCart className="h-6 w-6" />
                                )}
                              </button>
                            )}
                          </div>
                          <div className="flex-1 p-6">
                            <div className="flex flex-col h-full">
                              <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {product.name}
                              </h3>
                              {product.shortDescription && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                  {product.shortDescription}
                                </p>
                              )}
                              <div className="mt-auto flex items-end justify-between">
                                <div>
                                  <span className="text-2xl font-bold text-blue-600">
                                    {formatPrice(product.price)}
                                  </span>
                                  {product.brand && (
                                    <p className="text-sm text-gray-400 mt-1">
                                      Thương hiệu: {product.brand}
                                    </p>
                                  )}
                                </div>
                                {product.availability && product.stockQuantity > 0 && (
                                  <span className="text-sm text-green-600 font-medium">
                                    Còn hàng: {product.stockQuantity}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>

                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-4 py-2 rounded-lg ${currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products
