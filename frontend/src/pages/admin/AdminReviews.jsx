import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  Star, 
  Trash2, 
  Search,
  AlertCircle,
  User,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react'
import { reviewService } from '../../services'
import { useToast } from '../../contexts/ToastContext'
import AdminPageHeader from '../../components/AdminPageHeader'

const AdminReviews = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  
  // Parse query params
  const productIdParam = searchParams.get('productId')
  const reviewIdParam = searchParams.get('reviewId')
  
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRating, setFilterRating] = useState('all')
  const [filterProductId, setFilterProductId] = useState(productIdParam || '')
  const [selectedReview, setSelectedReview] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Fetch all reviews
  const fetchAllReviews = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // If productId is specified, fetch reviews for that product
      if (filterProductId) {
        const reviewsData = await reviewService.getProductReviews(filterProductId)
        setReviews(reviewsData || [])
        
        // If reviewId is also specified, highlight it
        if (reviewIdParam) {
          const review = reviewsData.find(r => r.id === parseInt(reviewIdParam))
          if (review) {
            setSelectedReview(review)
          }
        }
      } else {
        // Fetch all reviews (we need an API endpoint for this)
        // For now, we'll show message to filter by product
        setReviews([])
      }
    } catch (err) {
      setError('Không thể tải danh sách đánh giá')
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllReviews()
  }, [filterProductId, reviewIdParam])

  // Handle delete review
  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewService.deleteReview(reviewId)
      toast.success('Đã xóa đánh giá')
      fetchAllReviews()
      setShowDeleteConfirm(false)
      setReviewToDelete(null)
    } catch (err) {
      console.error('Error deleting review:', err)
      toast.error('Không thể xóa đánh giá')
    }
  }



  // Filter reviews by rating
  const filteredReviews = reviews.filter(review => {
    if (filterRating === 'all') return true
    return review.rating === parseInt(filterRating)
  }).filter(review => {
    if (!searchTerm) return true
    return review.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           review.username?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Paginate reviews
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentReviews = filteredReviews.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage)

  // Render star rating
  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader
        title="Quản lý Đánh giá"
        description="Xem và quản lý các đánh giá từ khách hàng"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters and Reviews */}
          <div>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm theo nội dung, tên người dùng..."
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lọc theo số sao
                  </label>
                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tất cả</option>
                    <option value="5">5 sao</option>
                    <option value="4">4 sao</option>
                    <option value="3">3 sao</option>
                    <option value="2">2 sao</option>
                    <option value="1">1 sao</option>
                  </select>
                </div>

                {/* Product ID Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã sản phẩm
                  </label>
                  <input
                    type="number"
                    value={filterProductId}
                    onChange={(e) => setFilterProductId(e.target.value)}
                    placeholder="Nhập ID sản phẩm..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Reviews List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            ) : !filterProductId ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <Package className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Vui lòng nhập mã sản phẩm
                </p>
                <p className="text-gray-600">
                  Nhập ID sản phẩm ở trên để xem các đánh giá của sản phẩm đó
                </p>
              </div>
            ) : currentReviews.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Không có đánh giá nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentReviews.map((review) => (
                  <div
                    key={review.id}
                    className={`bg-white rounded-lg shadow-sm p-6 transition-all ${
                      selectedReview?.id === review.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* User info */}
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{review.username}</p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(review.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="mb-3">
                          {renderStars(review.rating)}
                        </div>

                        {/* Content */}
                        <p className="text-gray-700 mb-3">{review.content}</p>

                        {/* Product info */}
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Package className="h-4 w-4" />
                          <span>Product ID: {review.productId}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => navigate(`/products/${review.productId}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem sản phẩm"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setReviewToDelete(review)
                            setShowDeleteConfirm(true)
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Trang {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                  <p className="text-sm text-gray-600">
                    Bạn có chắc chắn muốn xóa đánh giá này?
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setReviewToDelete(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDeleteReview(reviewToDelete.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminReviews
