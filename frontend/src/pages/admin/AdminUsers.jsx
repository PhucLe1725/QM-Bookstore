import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  AlertCircle,
  Shield,
  UserCheck,
  UserX,
  Crown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import userService from '../../services/userService'
import roleService from '../../services/roleService'
import { useToast } from '../../contexts/ToastContext'
import AdminPageHeader from '../../components/AdminPageHeader'

const AdminUsers = () => {
  const navigate = useNavigate()
  const toast = useToast()

  // State
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  // Form data
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    roleId: null,
    status: true,
    points: 0,
    balance: 0,
    totalPurchase: 0,
    membershipLevel: 'basic'
  })

  const [formErrors, setFormErrors] = useState([])

  // Load users and roles
  useEffect(() => {
    loadRoles()
  }, [])

  useEffect(() => {
    loadUsers()
  }, [currentPage, pageSize, sortBy, sortDirection])

  const loadRoles = async () => {
    try {
      const response = await roleService.getAllRoles()
      const rolesList = response.result || []
      setRoles(rolesList)
      
      // Set default roleId if not already set
      if (!formData.roleId && rolesList.length > 0) {
        const userRole = rolesList.find(r => r.name === 'user')
        const defaultRole = userRole || rolesList[0]
        if (defaultRole) {
          setFormData(prev => ({ ...prev, roleId: defaultRole.id }))
        }
      }
    } catch (err) {
      console.error('Error loading roles:', err)
      toast?.error?.('Không thể tải danh sách role')
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await userService.getAllUsersPaginated({
        skipCount: currentPage * pageSize,
        maxResultCount: pageSize,
        sortBy,
        sortDirection
      })

      setUsers(response.result.data || [])
      setTotalRecords(response.result.totalRecords || 0)
    } catch (err) {
      setError('Không thể tải danh sách người dùng')
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Validate form
  const validateForm = (data, isEdit = false) => {
    const errors = []

    if (!isEdit) {
      if (!data.username) {
        errors.push('Username không được để trống')
      }
      if (!data.password) {
        errors.push('Password không được để trống')
      } else if (data.password.length < 6) {
        errors.push('Password phải có ít nhất 6 ký tự')
      }
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email không hợp lệ')
    }

    if (data.phoneNumber && !/^[0-9]{10,11}$/.test(data.phoneNumber)) {
      errors.push('Số điện thoại phải có 10-11 chữ số')
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
      await userService.createUser(formData)
      toast.success('Tạo người dùng thành công')
      setShowCreateModal(false)
      resetForm()
      loadUsers()
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tạo người dùng'
      toast.error(errorMessage)
      console.error('Error creating user:', err)
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
      // Remove password if empty
      const updateData = { ...formData }
      if (!updateData.password) {
        delete updateData.password
      }

      await userService.updateUser(selectedUser.id, updateData)
      toast.success('Cập nhật người dùng thành công')
      setShowEditModal(false)
      setSelectedUser(null)
      resetForm()
      loadUsers()
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật người dùng'
      toast.error(errorMessage)
      console.error('Error updating user:', err)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    try {
      await userService.deleteUser(selectedUser.id)
      toast.success('Đã xóa người dùng')
      setShowDeleteConfirm(false)
      setSelectedUser(null)
      loadUsers()
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể xóa người dùng'
      toast.error(errorMessage)
      console.error('Error deleting user:', err)
    }
  }

  // Handle toggle status (soft delete)
  const handleToggleStatus = async (user) => {
    try {
      await userService.updateUser(user.id, { status: !user.status })
      toast.success(`Đã ${user.status ? 'vô hiệu hóa' : 'kích hoạt'} người dùng`)
      loadUsers()
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái')
      console.error('Error toggling status:', err)
    }
  }

  // Reset form
  const resetForm = () => {
    const userRole = roles.find(r => r.name === 'user')
    const defaultRole = userRole || (roles.length > 0 ? roles[0] : null)
    const defaultRoleId = defaultRole?.id || null
    
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      roleId: defaultRoleId,
      status: true,
      points: 0,
      balance: 0,
      totalPurchase: 0,
      membershipLevel: 'basic'
    })
    setFormErrors([])
  }

  // Open edit modal
  const openEditModal = (user) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      roleId: user.roleId,
      status: user.status,
      points: user.points,
      balance: user.balance,
      totalPurchase: user.totalPurchase,
      membershipLevel: user.membershipLevel
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

  // Get membership badge
  const getMembershipBadge = (level) => {
    const badges = {
      platinum: { color: 'bg-purple-100 text-purple-700', icon: Crown, label: 'Platinum' },
      gold: { color: 'bg-yellow-100 text-yellow-700', icon: Crown, label: 'Gold' },
      silver: { color: 'bg-gray-300 text-gray-700', icon: Crown, label: 'Silver' },
      basic: { color: 'bg-blue-100 text-blue-700', icon: Users, label: 'Basic' }
    }
    const badge = badges[level] || badges.basic
    const Icon = badge.icon
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badge.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{badge.label}</span>
      </span>
    )
  }

  // Get role badge
  const getRoleBadge = (roleName) => {
    if (roleName === 'admin') {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 flex items-center space-x-1">
        <Shield className="h-3 w-3" />
        <span>Admin</span>
      </span>
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Customer</span>
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchSearch = !searchTerm || 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchRole = filterRole === 'all' || user.roleName === filterRole
    const matchStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.status) ||
      (filterStatus === 'inactive' && !user.status)
    
    return matchSearch && matchRole && matchStatus
  })

  const totalPages = Math.ceil(totalRecords / pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader
        title="Quản lý Người dùng"
        description="Tạo và quản lý tài khoản người dùng"
        actions={
          <button
            onClick={() => {
              resetForm()
              setShowCreateModal(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Tạo Người Dùng</span>
          </button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo username, tên, email..."
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quyền
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                {roles.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Vô hiệu</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sắp xếp
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setCurrentPage(0)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="username">Username</option>
                <option value="totalPurchase">Tổng mua hàng</option>
                <option value="points">Điểm</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <label className="text-sm text-gray-700">Hướng:</label>
            <button
              onClick={() => {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                setCurrentPage(0)
              }}
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              {sortDirection === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
            </button>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Không tìm thấy người dùng nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quyền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Membership
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Điểm/Số dư
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng mua
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
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            {user.fullName && (
                              <div className="text-sm text-gray-500">{user.fullName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email || '-'}</div>
                        <div className="text-sm text-gray-500">{user.phoneNumber || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.roleName)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getMembershipBadge(user.membershipLevel)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.points} điểm</div>
                        <div className="text-sm text-gray-500">{formatCurrency(user.balance)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(user.totalPurchase)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.status ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center space-x-1 w-fit">
                            <UserCheck className="h-3 w-3" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700 flex items-center space-x-1 w-fit">
                            <UserX className="h-3 w-3" />
                            <span>Vô hiệu</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-2 ${user.status ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'} rounded-lg transition-colors`}
                            title={user.status ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {user.status ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalRecords)} / {totalRecords}
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(0)
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="10">10/trang</option>
                    <option value="20">20/trang</option>
                    <option value="50">50/trang</option>
                    <option value="100">100/trang</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Trước</span>
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Trang {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <span>Sau</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Tạo Người Dùng Mới</h2>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="john_doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ tên
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      placeholder="0123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quyền
                    </label>
                    <select
                      value={formData.roleId || ''}
                      onChange={(e) => setFormData({...formData, roleId: e.target.value ? parseInt(e.target.value) : null})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {!formData.roleId && <option value="">Chọn quyền</option>}
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Membership Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Membership
                    </label>
                    <select
                      value={formData.membershipLevel}
                      onChange={(e) => setFormData({...formData, membershipLevel: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="basic">Basic</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                      <option value="platinum">Platinum</option>
                    </select>
                  </div>

                  {/* Points */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Điểm tích lũy
                    </label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Balance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số dư (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={formData.balance}
                      onChange={(e) => setFormData({...formData, balance: parseFloat(e.target.value) || 0})}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Total Purchase */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tổng mua hàng (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={formData.totalPurchase}
                      onChange={(e) => setFormData({...formData, totalPurchase: parseFloat(e.target.value) || 0})}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows="3"
                    placeholder="Nhập địa chỉ..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">Kích hoạt tài khoản</label>
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
                  Tạo Người Dùng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa Người Dùng</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username - Disabled */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">Username không thể thay đổi</p>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password (để trống nếu không đổi)
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Nhập password mới nếu muốn đổi"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ tên
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quyền
                    </label>
                    <select
                      value={formData.roleId || ''}
                      onChange={(e) => setFormData({...formData, roleId: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Membership Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Membership
                    </label>
                    <select
                      value={formData.membershipLevel}
                      onChange={(e) => setFormData({...formData, membershipLevel: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="basic">Basic</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                      <option value="platinum">Platinum</option>
                    </select>
                  </div>

                  {/* Points */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Điểm tích lũy
                    </label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Balance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số dư (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={formData.balance}
                      onChange={(e) => setFormData({...formData, balance: parseFloat(e.target.value) || 0})}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Total Purchase */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tổng mua hàng (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={formData.totalPurchase}
                      onChange={(e) => setFormData({...formData, totalPurchase: parseFloat(e.target.value) || 0})}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">Kích hoạt tài khoản</label>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
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
        {showDeleteConfirm && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                  <p className="text-sm text-gray-600">
                    Bạn có chắc chắn muốn xóa người dùng "{selectedUser.username}"?
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Đây là thao tác xóa vĩnh viễn. Nếu người dùng có đơn hàng, việc xóa có thể gây lỗi.
                </p>
                <p className="text-sm text-yellow-800 mt-2">
                  Khuyến nghị: Sử dụng "Vô hiệu hóa" thay vì xóa.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setSelectedUser(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    handleToggleStatus(selectedUser)
                    setShowDeleteConfirm(false)
                    setSelectedUser(null)
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Vô hiệu hóa
                </button>
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

export default AdminUsers
