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
  Shield,
  MessageCircle,
  Send,
  ThumbsUp
} from 'lucide-react'
import { productService, commentService, reviewService, cartService } from '../services'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../contexts/ToastContext'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const toast = useToast()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState('description') // 'description', 'comments', 'reviews'

  // Comments state
  const [comments, setComments] = useState([])
  const [commentCount, setCommentCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null) // ID of comment being replied to
  const [replyContent, setReplyContent] = useState('')
  const [loadedReplies, setLoadedReplies] = useState({}) // Track which comments have loaded replies
  const [replyCounts, setReplyCounts] = useState({}) // Track reply count for each comment
  const [editingComment, setEditingComment] = useState(null) // ID of comment being edited
  const [editContent, setEditContent] = useState('')

  // Reviews state
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [userReview, setUserReview] = useState(null) // User's existing review
  const [hasPurchased, setHasPurchased] = useState(false) // Check if user bought this product
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 5,
    content: ''
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
          // Fetch reviews
          await fetchReviews(id)
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

  // Check purchase status when user logs in or changes
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (isAuthenticated && user && id) {
        try {
          const purchased = await reviewService.checkUserPurchased(id)
          setHasPurchased(purchased)
        } catch (err) {
          console.error('Error checking purchase status:', err)
          setHasPurchased(false)
        }
      } else {
        setHasPurchased(false)
      }
    }

    checkPurchaseStatus()
  }, [isAuthenticated, user, id])

  // Fetch comments for product
  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return

      setCommentsLoading(true)
      try {
        // Fetch root comments only (for better performance)
        const [commentsResponse, countResponse] = await Promise.all([
          commentService.getRootCommentsByProduct(id),
          commentService.getCommentCount(id)
        ])

        if (commentsResponse.success) {
          setComments(commentsResponse.result || [])

          // Fetch reply counts for all root comments
          const rootComments = commentsResponse.result || []
          rootComments.forEach(async (comment) => {
            try {
              const replyCountResponse = await commentService.getReplyCount(comment.id)
              if (replyCountResponse.success) {
                setReplyCounts(prev => ({
                  ...prev,
                  [comment.id]: replyCountResponse.result
                }))
              }
            } catch (err) {
              console.error('Error fetching reply count:', err)
            }
          })
        }

        if (countResponse.success) {
          setCommentCount(countResponse.result || 0)
        }
      } catch (err) {
        console.error('Error fetching comments:', err)
      } finally {
        setCommentsLoading(false)
      }
    }

    fetchComments()
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
  const handleAddToCart = async () => {
    if (addingToCart) return

    setAddingToCart(true)
    try {
      await cartService.addToCart(id, quantity)
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`)

      // Refresh cart count in header (dispatch custom event)
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng')
    } finally {
      setAddingToCart(false)
    }
  }

  // Handle wishlist toggle
  const handleWishlistToggle = () => {
    // TODO: Implement wishlist API
    setIsInWishlist(!isInWishlist)
  }

  // Fetch reviews from API
  const fetchReviews = async (productId) => {
    try {
      setReviewsLoading(true)
      const reviews = await reviewService.getProductReviews(productId)

      setReviews(reviews)

      // Check if current user has reviewed
      if (isAuthenticated && user) {
        const myReview = reviews.find(r => r.userId === user.id)
        setUserReview(myReview || null)
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }

  // Handle submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để đánh giá sản phẩm')
      navigate('/login')
      return
    }

    if (!hasPurchased) {
      toast.warning('Bạn cần mua sản phẩm này trước khi đánh giá')
      return
    }

    if (userReview) {
      toast.info('Bạn đã đánh giá sản phẩm này rồi')
      return
    }

    try {
      const reviewData = {
        productId: parseInt(id),
        userId: user?.id,
        rating: newReview.rating,
        content: newReview.content
      }

      const response = await reviewService.createReview(reviewData)

      // API response format: { success: true, result: {...} }
      if (response && (response.success || response.result)) {
        toast.success('Cảm ơn bạn đã đánh giá!')

        // Refresh reviews
        await fetchReviews(id)

        // Reset form
        setNewReview({ rating: 5, content: '' })
        setShowReviewForm(false)
      } else {
        toast.error('Có lỗi khi gửi đánh giá. Vui lòng thử lại')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      const errorMessage = error.response?.data?.message || 'Có lỗi khi gửi đánh giá. Vui lòng thử lại'
      toast.error(errorMessage)
    }
  }

  // Handle submit comment
  const handleSubmitComment = async (e) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để bình luận')
      navigate('/login')
      return
    }

    if (!newComment.trim()) {
      return
    }

    try {
      const response = await commentService.createComment({
        productId: parseInt(id),
        userId: user?.id,
        content: newComment.trim(),
        parentId: null // Root comment
      })

      if (response.success) {
        // Add new comment to the list with user info from context if not provided
        const newCommentData = {
          ...response.result,
          username: response.result.username || user?.username,
          fullName: response.result.fullName || user?.fullName
        }
        setComments([newCommentData, ...comments])
        setCommentCount(commentCount + 1)
        // Initialize reply count to 0 for new comment
        setReplyCounts(prev => ({
          ...prev,
          [newCommentData.id]: 0
        }))
        setNewComment('')
        toast.success('Bình luận của bạn đã được đăng!')
      }
    } catch (err) {
      console.error('Error submitting comment:', err)
      toast.error('Có lỗi xảy ra khi đăng bình luận')
    }
  }

  // Handle submit reply
  const handleSubmitReply = async (commentId) => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để trả lời')
      navigate('/login')
      return
    }

    if (!replyContent.trim()) {
      return
    }

    try {
      const response = await commentService.createComment({
        productId: parseInt(id),
        userId: user?.id,
        content: replyContent.trim(),
        parentId: commentId
      })

      if (response.success) {
        // Add reply to loaded replies with user info from context if not provided
        const newReplyData = {
          ...response.result,
          username: response.result.username || user?.username,
          fullName: response.result.fullName || user?.fullName
        }
        const replies = loadedReplies[commentId] || []
        setLoadedReplies({
          ...loadedReplies,
          [commentId]: [...replies, newReplyData]
        })
        setCommentCount(commentCount + 1)
        // Update reply count
        setReplyCounts(prev => ({
          ...prev,
          [commentId]: (prev[commentId] || 0) + 1
        }))
        setReplyContent('')
        setReplyingTo(null)
        toast.success('Trả lời của bạn đã được đăng!')
      }
    } catch (err) {
      console.error('Error submitting reply:', err)
      toast.error('Có lỗi xảy ra khi đăng trả lời')
    }
  }

  // Load replies for a comment
  const handleLoadReplies = async (commentId) => {
    // If already loaded, toggle visibility
    if (loadedReplies[commentId]) {
      setLoadedReplies({
        ...loadedReplies,
        [commentId]: null
      })
      return
    }

    try {
      const response = await commentService.getRepliesByComment(commentId)

      if (response.success) {
        setLoadedReplies({
          ...loadedReplies,
          [commentId]: response.result || []
        })
      }
    } catch (err) {
      console.error('Error loading replies:', err)
      toast.error('Có lỗi xảy ra khi tải trả lời')
    }
  }

  // Handle edit comment
  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) {
      return
    }

    try {
      const response = await commentService.updateComment(commentId, editContent.trim())

      if (response.success) {
        // Update comment in list
        setComments(comments.map(c =>
          c.id === commentId ? { ...c, content: editContent.trim() } : c
        ))

        // Update in replies if exists
        Object.keys(loadedReplies).forEach(parentId => {
          const replies = loadedReplies[parentId]
          if (replies) {
            setLoadedReplies({
              ...loadedReplies,
              [parentId]: replies.map(r =>
                r.id === commentId ? { ...r, content: editContent.trim() } : r
              )
            })
          }
        })

        setEditingComment(null)
        setEditContent('')
        toast.success('Cập nhật bình luận thành công!')
      }
    } catch (err) {
      console.error('Error updating comment:', err)
      toast.error('Có lỗi xảy ra khi cập nhật bình luận')
    }
  }

  // Handle delete comment
  const handleDeleteComment = async (commentId, isReply = false, parentId = null) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này? Tất cả trả lời sẽ bị xóa cùng.')) {
      return
    }

    try {
      const response = await commentService.deleteComment(commentId)

      if (response.success) {
        if (isReply && parentId) {
          // Remove from replies
          const replies = loadedReplies[parentId] || []
          setLoadedReplies({
            ...loadedReplies,
            [parentId]: replies.filter(r => r.id !== commentId)
          })
        } else {
          // Remove from root comments
          setComments(comments.filter(c => c.id !== commentId))
          // Remove loaded replies for this comment
          const { [commentId]: removed, ...rest } = loadedReplies
          setLoadedReplies(rest)
        }

        // Refresh comment count
        const countResponse = await commentService.getCommentCount(id)
        if (countResponse.success) {
          setCommentCount(countResponse.result)
        }

        toast.success('Xóa bình luận thành công!')
      }
    } catch (err) {
      console.error('Error deleting comment:', err)
      toast.error('Có lỗi xảy ra khi xóa bình luận')
    }
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
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    return `${hours}:${minutes} ${day}/${month}/${year}`
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
    : ['/assets/placeholder-product.jpg']

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
                    e.target.src = '/assets/placeholder-product.jpg'
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
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-blue-600' : 'border-gray-200'
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
                      className={`h-5 w-5 ${i < Math.floor(averageRating)
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
                    <p className="text-sm text-gray-600">Trong vòng 2-3 ngày làm việc</p>
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
            {/* Tabs Navigation */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${activeTab === 'description'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    Mô tả sản phẩm
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex-1 py-4 px-6 text-center font-medium transition-colors relative ${activeTab === 'comments'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <MessageCircle className="h-5 w-5" />
                      <span>Thảo luận</span>
                      <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                        {commentCount}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`flex-1 py-4 px-6 text-center font-medium transition-colors relative ${activeTab === 'reviews'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Star className="h-5 w-5" />
                      <span>Đánh giá</span>
                      <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                        {reviews.length}
                      </span>
                    </div>
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Description Tab */}
                {activeTab === 'description' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Thông tin chi tiết</h2>
                    <div className="prose max-w-none text-gray-600">
                      {product.fullDescription ? (
                        <p className="whitespace-pre-wrap">{product.fullDescription}</p>
                      ) : (
                        <p>{product.shortDescription || 'Chưa có mô tả chi tiết cho sản phẩm này.'}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Thảo luận về sản phẩm
                      </h2>
                      <span className="text-sm text-gray-500">
                        {commentCount} bình luận
                      </span>
                    </div>

                    {/* Comment Form */}
                    {isAuthenticated ? (
                      <form onSubmit={handleSubmitComment} className="mb-6">
                        <div className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="relative">
                              <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Đặt câu hỏi hoặc thảo luận về sản phẩm..."
                              />
                              <div className="mt-2 flex justify-between items-center">
                                <p className="text-xs text-gray-500">
                                  <MessageCircle className="h-3 w-3 inline mr-1" />
                                  Mọi người đều có thể xem và trả lời
                                </p>
                                <button
                                  type="submit"
                                  disabled={!newComment.trim()}
                                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Send className="h-4 w-4" />
                                  <span>Gửi</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-gray-600 mb-3">
                          Đăng nhập để tham gia thảo luận
                        </p>
                        <button
                          onClick={() => navigate('/login')}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Đăng nhập
                        </button>
                      </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-6">
                      {commentsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">
                            Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!
                          </p>
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-0">
                            {/* Root Comment */}
                            <div className="flex space-x-3">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-600 font-medium">
                                    {(comment.fullName || comment.username || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="font-medium text-gray-900">
                                    {comment.fullName || comment.username || 'Anonymous'}
                                  </p>
                                  <span className="text-sm text-gray-500">
                                    {formatDate(comment.createdAt)}
                                  </span>
                                </div>

                                {/* Edit mode */}
                                {editingComment === comment.id ? (
                                  <div className="mt-2">
                                    <textarea
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      rows={3}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                    <div className="mt-2 flex space-x-2">
                                      <button
                                        onClick={() => handleEditComment(comment.id)}
                                        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                      >
                                        Lưu
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingComment(null)
                                          setEditContent('')
                                        }}
                                        className="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-gray-600 whitespace-pre-wrap">{comment.content}</p>

                                    {/* Action buttons */}
                                    <div className="mt-2 flex items-center space-x-4">
                                      <button
                                        onClick={() => setReplyingTo(comment.id)}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                      >
                                        Trả lời
                                      </button>

                                      {isAuthenticated && user?.id === comment.userId && (
                                        <>
                                          <button
                                            onClick={() => {
                                              setEditingComment(comment.id)
                                              setEditContent(comment.content)
                                            }}
                                            className="text-sm text-gray-600 hover:text-gray-700"
                                          >
                                            Sửa
                                          </button>
                                          <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="text-sm text-red-600 hover:text-red-700"
                                          >
                                            Xóa
                                          </button>
                                        </>
                                      )}

                                      {replyCounts[comment.id] > 0 && (
                                        <button
                                          onClick={() => handleLoadReplies(comment.id)}
                                          className="text-sm text-gray-600 hover:text-gray-700"
                                        >
                                          {loadedReplies[comment.id]
                                            ? 'Ẩn trả lời'
                                            : `Xem trả lời (${replyCounts[comment.id]})`}
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}

                                {/* Reply Form */}
                                {replyingTo === comment.id && (
                                  <div className="mt-4 pl-4 border-l-2 border-blue-200">
                                    <textarea
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      rows={3}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                      placeholder="Viết trả lời của bạn..."
                                    />
                                    <div className="mt-2 flex space-x-2">
                                      <button
                                        onClick={() => handleSubmitReply(comment.id)}
                                        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                      >
                                        Gửi
                                      </button>
                                      <button
                                        onClick={() => {
                                          setReplyingTo(null)
                                          setReplyContent('')
                                        }}
                                        className="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Replies */}
                                {loadedReplies[comment.id] && (
                                  <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200">
                                    {loadedReplies[comment.id].length === 0 ? (
                                      <p className="text-sm text-gray-500 italic">Chưa có trả lời nào</p>
                                    ) : (
                                      loadedReplies[comment.id].map((reply) => (
                                        <div key={reply.id} className="flex space-x-3">
                                          <div className="flex-shrink-0">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                              <span className="text-blue-600 text-sm font-medium">
                                                {(reply.fullName || reply.username || 'U').charAt(0).toUpperCase()}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                              <p className="text-sm font-medium text-gray-900">
                                                {reply.fullName || reply.username || 'Anonymous'}
                                              </p>
                                              <span className="text-xs text-gray-500">
                                                {formatDate(reply.createdAt)}
                                              </span>
                                            </div>

                                            {editingComment === reply.id ? (
                                              <div className="mt-2">
                                                <textarea
                                                  value={editContent}
                                                  onChange={(e) => setEditContent(e.target.value)}
                                                  rows={2}
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                                />
                                                <div className="mt-2 flex space-x-2">
                                                  <button
                                                    onClick={() => handleEditComment(reply.id)}
                                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                  >
                                                    Lưu
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      setEditingComment(null)
                                                      setEditContent('')
                                                    }}
                                                    className="px-3 py-1 border border-gray-300 text-xs rounded hover:bg-gray-50"
                                                  >
                                                    Hủy
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{reply.content}</p>

                                                {isAuthenticated && user?.id === reply.userId && (
                                                  <div className="mt-1 flex items-center space-x-3">
                                                    <button
                                                      onClick={() => {
                                                        setEditingComment(reply.id)
                                                        setEditContent(reply.content)
                                                      }}
                                                      className="text-xs text-gray-600 hover:text-gray-700"
                                                    >
                                                      Sửa
                                                    </button>
                                                    <button
                                                      onClick={() => handleDeleteComment(reply.id, true, comment.id)}
                                                      className="text-xs text-red-600 hover:text-red-700"
                                                    >
                                                      Xóa
                                                    </button>
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Đánh giá từ khách hàng
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Chỉ khách hàng đã mua sản phẩm mới có thể đánh giá
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                          <span className="text-3xl font-bold text-gray-900">{averageRating}</span>
                        </div>
                        <p className="text-sm text-gray-500">{reviews.length} đánh giá</p>
                      </div>
                    </div>

                    {/* Review Form - Only for purchased users */}
                    {isAuthenticated && hasPurchased && !userReview && (
                      <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-4">
                          <Check className="h-5 w-5 text-green-600" />
                          <p className="font-medium text-gray-900">
                            Bạn đã mua sản phẩm này. Hãy chia sẻ đánh giá của bạn!
                          </p>
                        </div>

                        {!showReviewForm ? (
                          <button
                            onClick={() => setShowReviewForm(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            Viết đánh giá
                          </button>
                        ) : (
                          <form onSubmit={handleSubmitReview} className="bg-white p-4 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-4">Đánh giá của bạn</h3>

                            {/* Rating Stars */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Đánh giá sao <span className="text-red-500">*</span>
                              </label>
                              <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setNewReview({ ...newReview, rating: star })}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                  >
                                    <Star
                                      className={`h-8 w-8 ${star <= newReview.rating
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
                                Nhận xét chi tiết <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={newReview.content}
                                onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Chia sẻ trải nghiệm của bạn về chất lượng, tính năng, độ bền..."
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Đánh giá của bạn sẽ giúp khách hàng khác đưa ra quyết định mua hàng
                              </p>
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
                                onClick={() => {
                                  setShowReviewForm(false)
                                  setNewReview({ rating: 5, content: '' })
                                }}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Hủy
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    {/* Message for non-purchased users */}
                    {isAuthenticated && !hasPurchased && !userReview && (
                      <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                          <p className="font-medium text-gray-900">
                            Bạn cần mua sản phẩm này trước khi có thể đánh giá
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Message for non-authenticated users */}
                    {!isAuthenticated && (
                      <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5 text-gray-600" />
                          <p className="font-medium text-gray-900">
                            Vui lòng <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline">đăng nhập</button> để đánh giá sản phẩm
                          </p>
                        </div>
                      </div>
                    )}

                    {/* User's existing review */}
                    {userReview && (
                      <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <Check className="h-5 w-5 text-green-600" />
                          <p className="font-medium text-gray-900">Đánh giá của bạn</p>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${i < userReview.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                        <p className="text-gray-600">{userReview.content}</p>
                      </div>
                    )}

                    {/* Not purchased message */}
                    {isAuthenticated && !hasPurchased && (
                      <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">
                          Bạn cần mua sản phẩm này trước khi có thể đánh giá
                        </p>
                        <p className="text-sm text-gray-500">
                          Điều này giúp đảm bảo tính chính xác của các đánh giá
                        </p>
                      </div>
                    )}

                    {/* Reviews List */}
                    <div className="space-y-6">
                      {reviews.length === 0 ? (
                        <div className="text-center py-12">
                          <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">
                            Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!
                          </p>
                        </div>
                      ) : (
                        reviews.map((review) => (
                          <div key={review.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start space-x-3">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                  <span className="text-gray-600 font-medium">
                                    {(review.fullName || review.username || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {review.fullName || review.username || 'Anonymous'}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${i < review.rating
                                              ? 'text-yellow-400 fill-yellow-400'
                                              : 'text-gray-300'
                                            }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm text-gray-500">•</span>
                                    <span className="text-sm text-gray-500">
                                      {formatDate(review.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 text-green-600 text-sm">
                                <Check className="h-4 w-4" />
                                <span>Đã mua hàng</span>
                              </div>
                            </div>
                            <p className="text-gray-600 mb-3 ml-13">{review.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
