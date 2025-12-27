import React, { useState, useEffect } from 'react'
import { 
  Ticket,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  AlertCircle,
  X,
  Calendar,
  Package,
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react'
import voucherService from '../../services/voucherService'
import { useToast } from '../../contexts/ToastContext'
import AdminPageHeader from '../../components/AdminPageHeader'

const AdminVouchers = () => {
  const toast = useToast()
  
  // State
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterApplyTo, setFilterApplyTo] = useState('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize] = useState(10)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  
  // Form data
  const [formData, setFormData] = useState({
    code: '',
    discountAmount: 0,
    discountType: 'PERCENT',
    applyTo: 'ORDER',
    minOrderAmount: 0,
    maxDiscount: null,
    description: '',
    validFrom: '',
    validTo: '',
    usageLimit: 100,
    perUserLimit: 1,
    status: true
  })
  
  const [formErrors, setFormErrors] = useState([])

  // Load vouchers
  useEffect(() => {
    fetchVouchers()
  }, [currentPage, filterStatus, filterApplyTo])

  const fetchVouchers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = {
        page: currentPage,
        size: pageSize,
        status: filterStatus !== 'all' ? filterStatus === 'active' : undefined,
        applyTo: filterApplyTo !== 'all' ? filterApplyTo : undefined
      }
      
      const response = await voucherService.getAllVouchers(params)
      setVouchers(response.result.content || [])
      setTotalPages(response.result.totalPages || 0)
    } catch (err) {
      setError('Không thể tải danh sách voucher')
      console.error('Error fetching vouchers:', err)
    } finally {
      setLoading(false)
    }
  }

  // Validate form
  const validateForm = (data, isEdit = false) => {
    const errors = []
    
    if (!isEdit) {
      // Code validation
      if (!data.code) {
        errors.push('Mã voucher không được để trống')
      } else if (!/^[A-Z0-9_-]+$/.test(data.code)) {
        errors.push('Mã voucher chỉ chứa chữ HOA, số, gạch ngang và gạch dưới')
      } else if (data.code.length > 50) {
        errors.push('Mã voucher không quá 50 ký tự')
      }
      
      // Discount Amount
      if (!data.discountAmount || data.discountAmount <= 0) {
        errors.push('Giá trị giảm phải lớn hơn 0')
      }
      
      if (data.discountType === 'PERCENT' && data.discountAmount > 100) {
        errors.push('Giảm theo % không được vượt quá 100')
      }
      
      if (data.discountType === 'FIXED' && data.maxDiscount) {
        errors.push('Voucher giảm cố định không dùng giá trị giảm tối đa')
      }
    }
    
    // Date validation
    if (data.validFrom && data.validTo) {
      const validFrom = new Date(data.validFrom)
      const validTo = new Date(data.validTo)
      const now = new Date()
      
      if (!isEdit && validFrom < now) {
        errors.push('Ngày bắt đầu phải từ hiện tại trở đi')
      }
      
      if (validTo <= validFrom) {
        errors.push('Ngày kết thúc phải sau ngày bắt đầu')
      }
    }
    
    // Usage limits
    if (data.usageLimit && data.usageLimit < 1) {
      errors.push('Số lượt sử dụng phải >= 1')
    }
    
    if (data.perUserLimit && data.perUserLimit < 1) {
      errors.push('Số lượt/user phải >= 1')
    }
    
    // Min order amount
    if (data.minOrderAmount !== undefined && data.minOrderAmount < 0) {
      errors.push('Giá trị đơn hàng tối thiểu không được âm')
    }
    
    // Max discount
    if (data.maxDiscount !== undefined && data.maxDiscount !== null && data.maxDiscount <= 0) {
      errors.push('Giá trị giảm tối đa phải > 0')
    }
    
    return errors
  }

  // Handle create
  const handleCreate = async () => {
    const errors = validateForm(formData, false)
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }
    
    try {
      // Clean data - remove maxDiscount if FIXED type
      const submitData = { ...formData }
      if (submitData.discountType === 'FIXED') {
        submitData.maxDiscount = null
      }
      
      await voucherService.createVoucher(submitData)
      toast.success('Tạo voucher thành công')
      setShowCreateModal(false)
      resetForm()
      fetchVouchers()
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tạo voucher'
      toast.error(errorMessage)
      console.error('Error creating voucher:', err)
    }
  }

  // Handle update
  const handleUpdate = async () => {
    const errors = validateForm(formData, true)
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }
    
    try {
      const updateData = {
        description: formData.description,
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        usageLimit: formData.usageLimit,
        perUserLimit: formData.perUserLimit,
        status: formData.status,
        minOrderAmount: formData.minOrderAmount,
        maxDiscount: formData.discountType === 'PERCENT' ? formData.maxDiscount : null
      }
      
      await voucherService.updateVoucher(selectedVoucher.id, updateData)
      toast.success('Cập nhật voucher thành công')
      setShowEditModal(false)
      setSelectedVoucher(null)
      resetForm()
      fetchVouchers()
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật voucher'
      toast.error(errorMessage)
      console.error('Error updating voucher:', err)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    try {
      await voucherService.deleteVoucher(selectedVoucher.id)
      toast.success('Đã xóa voucher')
      setShowDeleteConfirm(false)
      setSelectedVoucher(null)
      fetchVouchers()
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể xóa voucher'
      toast.error(errorMessage)
      console.error('Error deleting voucher:', err)
    }
  }

  // Handle disable (soft delete)
  const handleDisable = async (voucher) => {
    try {
      await voucherService.updateVoucher(voucher.id, { status: false })
      toast.success('Đã vô hiệu hóa voucher')
      fetchVouchers()
    } catch (err) {
      toast.error('Không thể vô hiệu hóa voucher')
      console.error('Error disabling voucher:', err)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      discountAmount: 0,
      discountType: 'PERCENT',
      applyTo: 'ORDER',
      minOrderAmount: 0,
      maxDiscount: null,
      description: '',
      validFrom: '',
      validTo: '',
      usageLimit: 100,
      perUserLimit: 1,
      status: true
    })
    setFormErrors([])
  }

  // Open edit modal
  const openEditModal = (voucher) => {
    setSelectedVoucher(voucher)
    setFormData({
      code: voucher.code,
      discountAmount: voucher.discountAmount,
      discountType: voucher.discountType,
      applyTo: voucher.applyTo,
      minOrderAmount: voucher.minOrderAmount || 0,
      maxDiscount: voucher.maxDiscount || null,
      description: voucher.description || '',
      validFrom: voucher.validFrom?.substring(0, 16) || '',
      validTo: voucher.validTo?.substring(0, 16) || '',
      usageLimit: voucher.usageLimit,
      perUserLimit: voucher.perUserLimit,
      status: voucher.status
    })
    setFormErrors([])
    setShowEditModal(true)
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status badge
  const getStatusBadge = (voucher) => {
    const now = new Date()
    const validFrom = new Date(voucher.validFrom)
    const validTo = new Date(voucher.validTo)
    
    if (!voucher.status) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Vô hiệu</span>
    }
    
    if (now < validFrom) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Sắp diễn ra</span>
    }
    
    if (now > validTo) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Hết hạn</span>
    }
    
    if (voucher.usedCount >= voucher.usageLimit) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Hết lượt</span>
    }
    
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Khả dụng</span>
  }

  // Filter vouchers by search term
  const filteredVouchers = vouchers.filter(voucher => {
    if (!searchTerm) return true
    return voucher.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           voucher.description?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader
        title="Quản lý Voucher"
        description="Tạo và quản lý các voucher giảm giá"
        actions={
          <button
            onClick={() => {
              resetForm()
              setShowCreateModal(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Tạo Voucher</span>
          </button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
                  placeholder="Tìm theo mã, mô tả..."
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value)
                  setCurrentPage(0)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="active">Kích hoạt</option>
                <option value="inactive">Vô hiệu</option>
              </select>
            </div>

            {/* Apply To Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Áp dụng cho
              </label>
              <select
                value={filterApplyTo}
                onChange={(e) => {
                  setFilterApplyTo(e.target.value)
                  setCurrentPage(0)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="ORDER">Đơn hàng</option>
                <option value="SHIPPING">Phí vận chuyển</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vouchers List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Chưa có voucher nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã Voucher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Áp dụng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời hạn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lượt dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Ticket className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{voucher.code}</div>
                          {voucher.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{voucher.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {voucher.discountType === 'PERCENT' 
                          ? `${voucher.discountAmount}%` 
                          : formatCurrency(voucher.discountAmount)
                        }
                      </div>
                      {voucher.maxDiscount && voucher.discountType === 'PERCENT' && (
                        <div className="text-xs text-gray-500">
                          Giảm tối đa: {formatCurrency(voucher.maxDiscount)}
                        </div>
                      )}
                      {voucher.minOrderAmount > 0 && (
                        <div className="text-xs text-gray-500">
                          Giá trị đơn hàng tối thiểu: {formatCurrency(voucher.minOrderAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                        {voucher.applyTo === 'ORDER' ? 'Đơn hàng' : 'Phí ship'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(voucher.validFrom)}</div>
                      <div>{formatDate(voucher.validTo)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {voucher.usedCount}/{voucher.usageLimit}
                      </div>
                      <div className="text-xs text-gray-500">
                        {voucher.perUserLimit}/user
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(voucher)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(voucher)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {voucher.status && (
                          <button
                            onClick={() => handleDisable(voucher)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Vô hiệu hóa"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedVoucher(voucher)
                            setShowDeleteConfirm(true)
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trang trước
                </button>
                <span className="text-sm text-gray-700">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Tạo Voucher Mới</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Errors */}
                {formErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                      {formErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã Voucher <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="VD: SUMMER2025"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">Chỉ chữ HOA, số, gạch ngang (-) và gạch dưới (_)</p>
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại giảm giá <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="PERCENT"
                        checked={formData.discountType === 'PERCENT'}
                        onChange={(e) => setFormData({...formData, discountType: e.target.value, maxDiscount: null})}
                        className="mr-2"
                      />
                      <span>Phần trăm (%)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="FIXED"
                        checked={formData.discountType === 'FIXED'}
                        onChange={(e) => setFormData({...formData, discountType: e.target.value, maxDiscount: null})}
                        className="mr-2"
                      />
                      <span>Số tiền cố định (VNĐ)</span>
                    </label>
                  </div>
                </div>

                {/* Discount Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.discountType === 'PERCENT' ? 'Giảm (%)' : 'Giảm (VNĐ)'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.discountAmount}
                    onChange={(e) => setFormData({...formData, discountAmount: parseFloat(e.target.value) || 0})}
                    min="0"
                    max={formData.discountType === 'PERCENT' ? 100 : undefined}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Apply To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Áp dụng cho <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="ORDER"
                        checked={formData.applyTo === 'ORDER'}
                        onChange={(e) => setFormData({...formData, applyTo: e.target.value})}
                        className="mr-2"
                      />
                      <span>Tổng đơn hàng</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="SHIPPING"
                        checked={formData.applyTo === 'SHIPPING'}
                        onChange={(e) => setFormData({...formData, applyTo: e.target.value})}
                        className="mr-2"
                      />
                      <span>Phí vận chuyển</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Min Order Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá trị đơn tối thiểu (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({...formData, minOrderAmount: parseFloat(e.target.value) || 0})}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Max Discount - only for PERCENT */}
                  {formData.discountType === 'PERCENT' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giảm tối đa (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={formData.maxDiscount || ''}
                        onChange={(e) => setFormData({...formData, maxDiscount: e.target.value ? parseFloat(e.target.value) : null})}
                        min="0"
                        placeholder="Không giới hạn"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    maxLength="1000"
                    placeholder="Mô tả voucher..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Valid From */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Valid To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày kết thúc <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validTo}
                      onChange={(e) => setFormData({...formData, validTo: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Usage Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượt sử dụng tối đa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({...formData, usageLimit: parseInt(e.target.value) || 1})}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Per User Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượt/người dùng
                    </label>
                    <input
                      type="number"
                      value={formData.perUserLimit}
                      onChange={(e) => setFormData({...formData, perUserLimit: parseInt(e.target.value) || 1})}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">Kích hoạt ngay</label>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tạo Voucher
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedVoucher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa Voucher</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedVoucher(null)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Errors */}
                {formErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                      {formErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Code - Disabled */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã Voucher
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Không thể thay đổi mã voucher</p>
                </div>

                {/* Discount Type - Disabled */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại giảm giá
                  </label>
                  <input
                    type="text"
                    value={formData.discountType === 'PERCENT' ? 'Phần trăm (%)' : 'Số tiền cố định (VNĐ)'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Discount Amount - Disabled */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá trị giảm
                  </label>
                  <input
                    type="text"
                    value={formData.discountType === 'PERCENT' 
                      ? `${formData.discountAmount}%` 
                      : formatCurrency(formData.discountAmount)
                    }
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Apply To - Disabled */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Áp dụng cho
                  </label>
                  <input
                    type="text"
                    value={formData.applyTo === 'ORDER' ? 'Tổng đơn hàng' : 'Phí vận chuyển'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Min Order Amount - Editable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá trị đơn tối thiểu (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({...formData, minOrderAmount: parseFloat(e.target.value) || 0})}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Max Discount - only for PERCENT, Editable */}
                  {formData.discountType === 'PERCENT' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giảm tối đa (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={formData.maxDiscount || ''}
                        onChange={(e) => setFormData({...formData, maxDiscount: e.target.value ? parseFloat(e.target.value) : null})}
                        min="0"
                        placeholder="Không giới hạn"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Description - Editable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    maxLength="1000"
                    placeholder="Mô tả voucher..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Valid From - Editable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Valid To - Editable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày kết thúc
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validTo}
                      onChange={(e) => setFormData({...formData, validTo: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Usage Limit - Editable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượt sử dụng tối đa
                    </label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({...formData, usageLimit: parseInt(e.target.value) || 1})}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Đã dùng: {selectedVoucher.usedCount}</p>
                  </div>

                  {/* Per User Limit - Editable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượt/người dùng
                    </label>
                    <input
                      type="number"
                      value={formData.perUserLimit}
                      onChange={(e) => setFormData({...formData, perUserLimit: parseInt(e.target.value) || 1})}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status - Editable */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">Kích hoạt</label>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedVoucher(null)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Cập Nhật
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedVoucher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                  <p className="text-sm text-gray-600">
                    Bạn có chắc chắn muốn xóa voucher "{selectedVoucher.code}"?
                  </p>
                </div>
              </div>

              {selectedVoucher.usedCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Voucher này đã được sử dụng {selectedVoucher.usedCount} lần. 
                    Việc xóa có thể ảnh hưởng đến dữ liệu đơn hàng.
                  </p>
                  <p className="text-sm text-yellow-800 mt-2">
                    Khuyến nghị: Vô hiệu hóa thay vì xóa.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setSelectedVoucher(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                {selectedVoucher.usedCount > 0 && (
                  <button
                    onClick={() => {
                      handleDisable(selectedVoucher)
                      setShowDeleteConfirm(false)
                      setSelectedVoucher(null)
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Vô hiệu hóa
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Xóa vĩnh viễn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminVouchers
