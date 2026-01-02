import React, { useState, useEffect } from 'react'
import SearchableSelect from './SearchableSelect'
import { productService } from '../services'

/**
 * ProductSearchableSelect - Searchable select specifically for products
 * Includes product image, name, price, and stock quantity
 * 
 * @param {string|number} value - Selected product ID
 * @param {function} onChange - Callback when selection changes (receives product ID)
 * @param {function} onSelect - Callback when selection changes (receives full product object)
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Disabled state
 * @param {string} className - Additional CSS classes
 * @param {boolean} showStock - Show stock quantity in display
 * @param {boolean} showPrice - Show price in display
 */
const ProductSearchableSelect = ({ 
  value, 
  onChange,
  onSelect,
  placeholder = 'Tìm và chọn sản phẩm...', 
  disabled = false,
  className = '',
  showStock = true,
  showPrice = true
}) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Debounce search API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(searchTerm)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadProducts = async (search = '') => {
    try {
      setLoading(true)
      // Load products with search term - using correct backend params
      const response = await productService.getAllProducts({ 
        skipCount: 0, 
        maxResultCount: 50,
        sortBy: 'name',
        sortDirection: 'asc',
        name: search || undefined
      })
      
      // api.js interceptor returns response.data directly
      // Backend returns: { success, code, message, result: { data: [], totalRecords } }
      if (response?.success && response.result?.data) {
        const productsData = response.result.data
        setProducts(productsData)
      } else {
        setProducts([])
      }
    } catch (error) {
      console.error('[ProductSearchableSelect] Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Transform products to SearchableSelect format
  const options = products.map(product => {
    // Create display JSX
    const displayJSX = (
      <div className="flex items-center gap-3 py-1">
        {product.imageUrl && (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-10 h-10 object-cover rounded flex-shrink-0"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {product.name}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            {showStock && (
              <>
                <span>Tồn: {product.stockQuantity || 0}</span>
                {showPrice && <span className="text-gray-400">•</span>}
              </>
            )}
            {showPrice && (
              <span>
                {product.price?.toLocaleString('vi-VN')}₫
              </span>
            )}
          </div>
        </div>
      </div>
    )

    return {
      id: product.id,
      name: product.name, // Keep as string for search filtering
      displayName: displayJSX // JSX for display
    }
  })

  // Find selected product for preview
  const selectedProduct = products.find(p => p.id === parseInt(value))

  // Handle selection
  const handleChange = (productId) => {
    if (onChange) {
      onChange(productId)
    }
    
    if (onSelect) {
      const product = products.find(p => p.id === parseInt(productId))
      if (product) {
        onSelect(product)
      }
    }
  }

  return (
    <div className={className}>
      <SearchableSelect
        options={options}
        value={value}
        onChange={handleChange}
        onSearchChange={setSearchTerm}
        placeholder={loading ? 'Đang tải sản phẩm...' : placeholder}
        disabled={disabled || loading}
      />
      
      {/* Selected product preview */}
      {selectedProduct && !disabled && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
          {selectedProduct.imageUrl && (
            <img 
              src={selectedProduct.imageUrl} 
              alt={selectedProduct.name}
              className="w-8 h-8 object-cover rounded"
            />
          )}
          <div className="flex-1">
            <span className="font-medium">{selectedProduct.name}</span>
            <div className="text-gray-500 flex gap-2">
              {showStock && <span>Tồn: {selectedProduct.stockQuantity || 0}</span>}
              {showPrice && (
                <>
                  {showStock && <span>•</span>}
                  <span>{selectedProduct.price?.toLocaleString('vi-VN')}₫</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductSearchableSelect
