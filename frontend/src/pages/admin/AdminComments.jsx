import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  MessageSquare, 
  Trash2, 
  Search, 
  AlertCircle,
  User,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Reply,
  CornerDownRight
} from 'lucide-react'
import { commentService } from '../../services'
import { useToast } from '../../contexts/ToastContext'

const AdminComments = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  
  // Parse query params
  const productIdParam = searchParams.get('productId')
  const commentIdParam = searchParams.get('commentId')
  
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProductId, setFilterProductId] = useState(productIdParam || '')
  const [selectedComment, setSelectedComment] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState(null)
  const [expandedComments, setExpandedComments] = useState({})
  const [repliesData, setRepliesData] = useState({})
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Fetch comments for a product
  const fetchComments = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (filterProductId) {
        // Fetch root comments
        const response = await commentService.getRootCommentsByProduct(filterProductId)
        
        if (response.success) {
          const commentsData = response.result || []
          setComments(commentsData)
          
          // If commentId is specified, find and highlight it
          if (commentIdParam) {
            const comment = commentsData.find(c => c.id === parseInt(commentIdParam))
            if (comment) {
              setSelectedComment(comment)
              // Auto expand to show it
              setExpandedComments({ [comment.id]: true })
            } else {
              // Might be a reply, need to search in all comments
              for (const comment of commentsData) {
                const replies = await fetchRepliesForComment(comment.id)
                const reply = replies.find(r => r.id === parseInt(commentIdParam))
                if (reply) {
                  setSelectedComment(reply)
                  setExpandedComments({ [comment.id]: true })
                  break
                }
              }
            }
          }
          
          // Fetch reply counts for all root comments
          for (const comment of commentsData) {
            try {
              const replyCountResponse = await commentService.getReplyCount(comment.id)
              if (replyCountResponse.success) {
                setRepliesData(prev => ({
                  ...prev,
                  [comment.id]: {
                    count: replyCountResponse.result,
                    replies: []
                  }
                }))
              }
            } catch (err) {
              console.error('Error fetching reply count:', err)
            }
          }
        }
      } else {
        setComments([])
      }
    } catch (err) {
      setError('Không thể tải danh sách bình luận')
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch replies for a comment
  const fetchRepliesForComment = async (commentId) => {
    try {
      const response = await commentService.getRepliesByComment(commentId)
      if (response.success) {
        const replies = response.result || []
        setRepliesData(prev => ({
          ...prev,
          [commentId]: {
            ...prev[commentId],
            replies
          }
        }))
        return replies
      }
      return []
    } catch (err) {
      console.error('Error fetching replies:', err)
      return []
    }
  }

  // Toggle expand/collapse replies
  const toggleReplies = async (commentId) => {
    if (expandedComments[commentId]) {
      // Collapse
      setExpandedComments(prev => ({
        ...prev,
        [commentId]: false
      }))
    } else {
      // Expand and fetch replies if not already fetched
      if (!repliesData[commentId]?.replies?.length) {
        await fetchRepliesForComment(commentId)
      }
      setExpandedComments(prev => ({
        ...prev,
        [commentId]: true
      }))
    }
  }

  useEffect(() => {
    fetchComments()
  }, [filterProductId, commentIdParam])

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId)
      toast.success('Đã xóa bình luận')
      fetchComments()
      setShowDeleteConfirm(false)
      setCommentToDelete(null)
    } catch (err) {
      console.error('Error deleting comment:', err)
      toast.error('Không thể xóa bình luận')
    }
  }

  // Filter comments by search term
  const filteredComments = comments.filter(comment => {
    if (!searchTerm) return true
    return comment.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           comment.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Paginate comments
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentComments = filteredComments.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredComments.length / itemsPerPage)

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

  // Render comment card
  const renderComment = (comment, isReply = false) => {
    const replyCount = repliesData[comment.id]?.count || 0
    const replies = repliesData[comment.id]?.replies || []
    const isExpanded = expandedComments[comment.id]
    const isHighlighted = selectedComment?.id === comment.id

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-12' : ''} ${
          isHighlighted ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* User info */}
              <div className="flex items-center space-x-3 mb-3">
                {isReply && (
                  <CornerDownRight className="h-4 w-4 text-gray-400" />
                )}
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{comment.userName}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-3 ml-13">{comment.content}</p>

              {/* Product info */}
              <div className="flex items-center space-x-2 text-sm text-gray-500 ml-13">
                <Package className="h-4 w-4" />
                <span>Product ID: {comment.productId}</span>
                {comment.parentId && (
                  <>
                    <span>•</span>
                    <Reply className="h-4 w-4" />
                    <span>Reply to comment {comment.parentId}</span>
                  </>
                )}
              </div>

              {/* Replies button */}
              {!isReply && replyCount > 0 && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="mt-3 ml-13 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                >
                  <Reply className="h-4 w-4" />
                  <span>
                    {isExpanded ? 'Ẩn' : 'Xem'} {replyCount} phản hồi
                  </span>
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => navigate(`/products/${comment.productId}`)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Xem sản phẩm"
              >
                <Eye className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setCommentToDelete(comment)
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

        {/* Replies */}
        {!isReply && isExpanded && replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Bình luận</h1>
          <p className="mt-2 text-gray-600">Xem và quản lý các bình luận từ khách hàng về sản phẩm</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Comments List */}
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
              Nhập ID sản phẩm ở trên để xem các bình luận của sản phẩm đó
            </p>
          </div>
        ) : currentComments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Không có bình luận nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentComments.map(comment => renderComment(comment))}

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
                    Bạn có chắc chắn muốn xóa bình luận này?
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setCommentToDelete(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDeleteComment(commentToDelete.id)}
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

export default AdminComments
