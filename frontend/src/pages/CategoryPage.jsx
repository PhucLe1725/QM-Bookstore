import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Search, Filter, ShoppingCart, Grid, List, ChevronRight } from 'lucide-react'
import { categoryService, productService, cartService } from '../services'
import { useToast } from '../contexts/ToastContext'

/**
 * CategoryPage - Hiển thị sản phẩm theo category
 * URL: /categories/:slug
 * 
 * Features:
 * - Lấy category info từ slug
 * - Hiển thị breadcrumb navigation
 * - Fetch products theo categoryId
 * - Pagination, sort, filter
 * - Add to cart
 */
const CategoryPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  // Category state
  const [category, setCategory] = useState(null)
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [categoryLoading, setCategoryLoading] = useState(true)

  // Products state
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addingToCartId, setAddingToCartId] = useState(null)

  // Pagination & filters
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [pageSize] = useState(12)
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const [viewMode, setViewMode] = useState('grid')

  // Load category info
  useEffect(() => {
    loadCategoryInfo()
  }, [slug])

  // Load products when category changes
  useEffect(() => {
    if (category) {
      fetchProducts()
    }
  }, [category, currentPage, sortBy, sortDirection, searchTerm, priceRange])

  const loadCategoryInfo = async () => {
    setCategoryLoading(true)
    try {

      // Lấy category từ slug
      const response = await categoryService.getCategoryBySlug(slug)

      // Xử lý response từ API (api.js đã unwrap response.data)
      // Backend trả về: { success: true, result: {...}, code: 200 }
      let categoryData = null
      if (response && typeof response === 'object') {
        if (response.result) {
          categoryData = response.result
        } else if (response.data) {
          categoryData = response.data
        } else if (response.id) {
          // Response trực tiếp là category object
          categoryData = response
        }
      }


      if (!categoryData || !categoryData.id) {
        throw new Error('Không tìm thấy thông tin danh mục')
      }

      setCategory(categoryData)

      // Lấy breadcrumb path
      const tree = await categoryService.getCategoryTree()
      const path = categoryService.findCategoryPath(tree, categoryData.id)
      setBreadcrumbs(path || [categoryData])

      setCategoryLoading(false)
    } catch (err) {
      console.error('Failed to load category:', err)
      setCategoryLoading(false)
      toast?.error?.('Không tìm thấy danh mục')
      navigate('/products')
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      // Lấy category tree để tìm descendants
      const tree = await categoryService.getCategoryTree()
      const categoryNode = categoryService.findCategoryNode(tree, category.id)

      // Lấy tất cả descendant IDs
      const descendantIds = categoryNode ? categoryService.getAllDescendantIds(categoryNode) : []
      const allCategoryIds = [category.id, ...descendantIds]


      // Gọi API cho tất cả categories (parallel requests)
      const productPromises = allCategoryIds.map(catId =>
        productService.getProductsByCategory(catId)
          .catch(err => {
            console.error(`Error fetching products for category ${catId}:`, err)
            return { success: false, result: [] }
          })
      )

      const responses = await Promise.all(productPromises)

      // Merge và deduplicate products
      const allProducts = []
      const productIds = new Set()

      responses.forEach(response => {
        if (response.success && response.result) {
          const products = Array.isArray(response.result) ? response.result : []
          products.forEach(product => {
            if (!productIds.has(product.id)) {
              productIds.add(product.id)
              allProducts.push(product)
            }
          })
        }
      })


      // Apply filters
      let filteredProducts = allProducts

      // Filter by search term
      if (searchTerm) {
        filteredProducts = filteredProducts.filter(p =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Filter by price range
      if (priceRange.min) {
        filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(priceRange.min))
      }
      if (priceRange.max) {
        filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(priceRange.max))
      }

      // Sort products
      filteredProducts.sort((a, b) => {
        let comparison = 0
        if (sortBy === 'price') {
          comparison = (a.price || 0) - (b.price || 0)
        } else if (sortBy === 'name') {
          comparison = (a.name || '').localeCompare(b.name || '')
        } else if (sortBy === 'createdAt') {
          comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        }
        return sortDirection === 'asc' ? comparison : -comparison
      })

      // Pagination
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

      setProducts(paginatedProducts)
      setTotalRecords(filteredProducts.length)
      setError(null)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Đã xảy ra lỗi khi tải sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId, e) => {
    e.stopPropagation()
    if (addingToCartId) return

    setAddingToCartId(productId)
    try {
      await cartService.addToCart(productId, 1)
      toast.success('Đã thêm sản phẩm vào giỏ hàng!')
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng')
    } finally {
      setAddingToCartId(null)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchProducts()
  }

  const handlePriceFilter = () => {
    setCurrentPage(1)
    fetchProducts()
  }

  const totalPages = Math.ceil(totalRecords / pageSize)

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  if (categoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/products" className="hover:text-blue-600">Sản phẩm</Link>
        {breadcrumbs.map((item, idx) => (
          <React.Fragment key={item.id}>
            <ChevronRight className="w-4 h-4" />
            {idx === breadcrumbs.length - 1 ? (
              <span className="font-medium text-blue-600">{item.name}</span>
            ) : (
              <Link to={`/categories/${item.slug}`} className="hover:text-blue-600">
                {item.name}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{category?.name}</h1>
        {category?.description && (
          <p className="text-gray-600">{category.description}</p>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </form>

          {/* Price Range */}
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Giá min"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Giá max"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split('-')
              setSortBy(field)
              setSortDirection(dir)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="createdAt-desc">Mới nhất</option>
            <option value="createdAt-asc">Cũ nhất</option>
            <option value="price-asc">Giá tăng dần</option>
            <option value="price-desc">Giá giảm dần</option>
            <option value="name-asc">Tên A-Z</option>
            <option value="name-desc">Tên Z-A</option>
          </select>
        </div>

        {/* View Mode & Results Count */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Tìm thấy <span className="font-semibold">{totalRecords}</span> sản phẩm
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Không có sản phẩm nào trong danh mục này</p>
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
                    <img
                      src={product.imageUrl || '/placeholder-book.png'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
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
                      <img
                        src={product.imageUrl || '/placeholder-book.png'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
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
        </>
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
    </div>
  )
}

export default CategoryPage
