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
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate(`/products/${product.id}`)}
              className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                viewMode === 'list' ? 'flex' : ''
              }`}
            >
              <img
                src={product.imageUrl || '/placeholder-book.png'}
                alt={product.name}
                className={viewMode === 'list' ? 'w-32 h-32 object-cover rounded-l-lg' : 'w-full h-48 object-cover rounded-t-lg'}
              />
              <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-blue-600 font-bold text-lg mb-2">
                  {product.price?.toLocaleString('vi-VN')}đ
                </p>
                {product.stockQuantity > 0 ? (
                  <button
                    onClick={(e) => handleAddToCart(product.id, e)}
                    disabled={addingToCartId === product.id}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{addingToCartId === product.id ? 'Đang thêm...' : 'Thêm vào giỏ'}</span>
                  </button>
                ) : (
                  <button disabled className="w-full bg-gray-300 text-gray-600 py-2 rounded-lg cursor-not-allowed">
                    Hết hàng
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Trước
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}

export default CategoryPage
