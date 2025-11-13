import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  ChevronLeft, 
  Minus, 
  Plus,
  Share2,
  AlertCircle,
  Check,
  Package,
  Truck,
  Shield
} from 'lucide-react'
import { productService } from '../services'
import { useAuth } from '../hooks/useAuth'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isInWishlist, setIsInWishlist] = useState(false)
  
  // Reviews state
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  })

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await productService.getProductById(id)
        
        if (response.success) {
          setProduct(response.result)
          // TODO: Fetch reviews khi có API
          // fetchReviews(id)
        } else {
          setError('Không thể tải thông tin sản phẩm')
        }
      } catch (err) {
        setError('Đã xảy ra lỗi khi tải sản phẩm')
        console.error('Error fetching product:', err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProduct()
    }
  }, [id])

  // Mock reviews data (replace with API call)
  useEffect(() => {
    // Mock data - replace with actual API
    setReviews([
      {
        id: 1,
        userId: 1,
        userName: 'Nguyễn Văn A',
        rating: 5,
        comment: 'Sản phẩm rất tốt, chất lượng cao',
        createdAt: '2024-01-15T10:30:00',
        helpful: 12
      },
      {
        id: 2,
        userId: 2,
        userName: 'Trần Thị B',
        rating: 4,
        comment: 'Giao hàng nhanh, đóng gói cẩn thận',
        createdAt: '2024-01-10T14:20:00',
        helpful: 8
      }
    ])
  }, [id])

  // Handle quantity change
  const handleQuantityChange = (type) => {
    if (type === 'increase' && quantity < (product?.stockQuantity || 1)) {
      setQuantity(prev => prev + 1)
    } else if (type === 'decrease' && quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  // Handle add to cart
  const handleAddToCart = () => {
    // TODO: Implement add to cart API
    console.log('Add to cart:', { productId: id, quantity })
    alert('Đã thêm vào giỏ hàng!')
  }

  // Handle wishlist toggle
  const handleWishlistToggle = () => {
    // TODO: Implement wishlist API
    setIsInWishlist(!isInWishlist)
  }

  // Handle submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để đánh giá sản phẩm')
      navigate('/login')
      return
    }

    // TODO: Implement review API
    console.log('Submit review:', {
      productId: id,
      userId: user?.id,
      rating: newReview.rating,
      comment: newReview.comment
    })

    // Reset form
    setNewReview({ rating: 5, comment: '' })
    setShowReviewForm(false)
    alert('Cảm ơn bạn đã đánh giá!')
  }

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/products')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Quay lại danh sách sản phẩm
          </button>
        </div>
      </div>
    )
  }

  // Mock images (replace with actual product images)
  const productImages = product.imageUrl 
    ? [product.imageUrl]
    : ['/src/assets/placeholder-product.jpg']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => navigate('/products')}
              className="flex items-center text-gray-600 hover:text-blue-600"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sản phẩm</span>
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Main Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/src/assets/placeholder-product.jpg'
                  }}
                />
                {!product.availability && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-6 py-3 rounded-full font-medium text-lg">
                      Hết hàng
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                {product.brand && (
                  <p className="text-gray-600">
                    Thương hiệu: <span className="font-medium text-gray-900">{product.brand}</span>
                  </p>
                )}
                {product.sku && (
                  <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {averageRating} ({reviews.length} đánh giá)
                </span>
              </div>

              {/* Price */}
              <div className="border-t border-b py-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-bold text-blue-600">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <p className="text-gray-600">{product.shortDescription}</p>
              )}

              {/* Stock Status */}
              <div>
                {product.availability && product.stockQuantity > 0 ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Còn hàng: {product.stockQuantity} sản phẩm</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Hết hàng</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              {product.availability && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượng
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange('decrease')}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1
                          setQuantity(Math.max(1, Math.min(val, product.stockQuantity)))
                        }}
                        className="w-20 text-center border border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleQuantityChange('increase')}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        disabled={quantity >= product.stockQuantity}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span>Thêm vào giỏ hàng</span>
                    </button>
                    <button
                      onClick={handleWishlistToggle}
                      className={`p-3 border rounded-lg transition-colors ${
                        isInWishlist
                          ? 'bg-red-50 border-red-300 text-red-600'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`h-6 w-6 ${isInWishlist ? 'fill-red-600' : ''}`} />
                    </button>
                    <button className="p-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                      <Share2 className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
                <div className="flex items-start space-x-3">
                  <Package className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Đóng gói cẩn thận</p>
                    <p className="text-sm text-gray-600">Bảo vệ sản phẩm tốt nhất</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Truck className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Giao hàng nhanh</p>
                    <p className="text-sm text-gray-600">2-3 ngày trong nội thành</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Đổi trả dễ dàng</p>
                    <p className="text-sm text-gray-600">Trong vòng 7 ngày</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details & Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Description */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mô tả sản phẩm</h2>
              <div className="prose max-w-none text-gray-600">
                {product.fullDescription ? (
                  <p className="whitespace-pre-wrap">{product.fullDescription}</p>
                ) : (
                  <p>{product.shortDescription || 'Chưa có mô tả chi tiết cho sản phẩm này.'}</p>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Đánh giá ({reviews.length})
                </h2>
                {isAuthenticated && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Viết đánh giá
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-4">Đánh giá của bạn</h3>
                  
                  {/* Rating Stars */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đánh giá sao
                    </label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= newReview.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhận xét của bạn
                    </label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Gửi đánh giá
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{review.userName}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{review.comment}</p>
                      <button className="text-sm text-gray-500 hover:text-gray-700">
                        Hữu ích ({review.helpful})
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Product Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin sản phẩm</h3>
              <div className="space-y-3 text-sm">
                {product.categoryName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Danh mục:</span>
                    <span className="font-medium text-gray-900">{product.categoryName}</span>
                  </div>
                )}
                {product.brand && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thương hiệu:</span>
                    <span className="font-medium text-gray-900">{product.brand}</span>
                  </div>
                )}
                {product.sku && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã sản phẩm:</span>
                    <span className="font-medium text-gray-900">{product.sku}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tình trạng:</span>
                  <span className={`font-medium ${product.availability ? 'text-green-600' : 'text-red-600'}`}>
                    {product.availability ? 'Còn hàng' : 'Hết hàng'}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Products - Placeholder */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sản phẩm tương tự</h3>
              <p className="text-sm text-gray-500 text-center py-4">
                Đang cập nhật...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
