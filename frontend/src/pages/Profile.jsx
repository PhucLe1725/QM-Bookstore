import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Star,
  CreditCard,
  ShoppingBag,
  Edit,
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { userService } from '../services'
import { useToast } from '../contexts/ToastContext'

const Profile = () => {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState(null) // Local profile state
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: ''
  })
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  // Fetch profile data từ API khi component mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return
      
      setProfileLoading(true)
      try {
        const response = await userService.getMyProfile()
        if (response.success && response.result) {
          // Cập nhật local profile state ngay lập tức
          setProfileData(response.result)
          
          // Cập nhật user trong AuthContext và localStorage
          if (updateUser) {
            updateUser(response.result)
          }
          
          // Cập nhật form data ngay lập tức
          setEditForm({
            fullName: response.result.fullName || '',
            email: response.result.email || '',
            phoneNumber: response.result.phoneNumber || '',
            address: response.result.address || ''
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        // Nếu fetch thất bại, dùng user từ AuthContext
        setProfileData(user)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user?.id]) // Chạy lại khi user.id thay đổi

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      // Nếu chưa có profileData, dùng user từ AuthContext
      if (!profileData) {
        setProfileData(user)
      }
      
      setEditForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || ''
      })
    }
  }, [user])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form to original values from profileData or user
    const currentData = profileData || user
    setEditForm({
      fullName: currentData.fullName || '',
      email: currentData.email || '',
      phoneNumber: currentData.phoneNumber || '',
      address: currentData.address || ''
    })
  }

  const handleSave = async () => {
    // Validate form data
    if (!editForm.fullName?.trim()) {
      toast.warning('Vui lòng nhập họ tên')
      return
    }

    if (editForm.phoneNumber && !/^[0-9]{10,11}$/.test(editForm.phoneNumber.replace(/\s/g, ''))) {
      toast.warning('Số điện thoại không hợp lệ (10-11 số)')
      return
    }

    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      toast.warning('Email không hợp lệ')
      return
    }

    setIsSaving(true)
    
    try {
      // Call API to update profile using new endpoint
      const response = await userService.updateMyProfile({
        fullName: editForm.fullName.trim(),
        email: editForm.email?.trim() || null,
        phoneNumber: editForm.phoneNumber?.trim() || null,
        address: editForm.address?.trim() || null
      })

      if (response.success) {
        toast.success('Cập nhật thông tin thành công!')
        
        // Cập nhật local profile state ngay lập tức
        setProfileData(response.result)
        
        // Cập nhật user trong AuthContext và localStorage
        if (updateUser) {
          updateUser(response.result)
        }
        
        // Cập nhật form data với thông tin mới
        setEditForm({
          fullName: response.result.fullName || '',
          email: response.result.email || '',
          phoneNumber: response.result.phoneNumber || '',
          address: response.result.address || ''
        })
        
        setIsEditing(false)
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi cập nhật')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getMembershipColor = (level) => {
    switch (level) {
      case 'BRONZE':
        return 'bg-amber-600 text-white'
      case 'SILVER':
        return 'bg-gray-400 text-white'
      case 'GOLD':
        return 'bg-yellow-500 text-white'
      case 'PLATINUM':
        return 'bg-purple-600 text-white'
      case 'DIAMOND':
        return 'bg-blue-600 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getRoleBadgeColor = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'staff':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Chưa đăng nhập
          </h2>
          <Link 
            to="/login" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Đăng nhập ngay →
          </Link>
        </div>
      </div>
    )
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <User className="h-8 w-8 mr-3 text-blue-600" />
                  Hồ sơ cá nhân
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Quản lý thông tin cá nhân và tài khoản của bạn
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Information Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Thông tin cá nhân
              </h2>
              
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {(profileData || user).fullName || 'Chưa cập nhật'}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên đăng nhập
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {(profileData || user).username}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Không thể thay đổi tên đăng nhập</p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {(profileData || user).email || 'Chưa cập nhật'}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {(profileData || user).phoneNumber || 'Chưa cập nhật'}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editForm.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                      {(profileData || user).address || 'Chưa cập nhật'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Activity */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Hoạt động tài khoản
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Ngày tạo tài khoản</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate((profileData || user).createdAt)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Lần cập nhật cuối</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate((profileData || user).updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Status & Stats */}
          <div className="space-y-6">
            
            {/* Account Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Trạng thái tài khoản
              </h2>
              
              <div className="space-y-4">
                {/* Role */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vai trò</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor((profileData || user).roleName)}`}>
                    {(profileData || user).roleName || 'User'}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    (profileData || user).status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {(profileData || user).status ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </div>

                {/* Membership Level */}
                {(profileData || user).membershipLevel && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Hạng thành viên</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMembershipColor((profileData || user).membershipLevel)}`}>
                      <Star className="h-4 w-4 mr-1" />
                      {(profileData || user).membershipLevel}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                  Thông tin tài chính
                </h2>
                <button
                  onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                  className="text-gray-500 hover:text-gray-700"
                  title={showSensitiveInfo ? 'Ẩn thông tin' : 'Hiện thông tin'}
                >
                  {showSensitiveInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Points */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Điểm tích lũy</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(profileData || user).points || 0} điểm
                  </p>
                </div>

                {/* Total Purchase */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                  <p className="text-2xl font-bold text-purple-600 flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    {showSensitiveInfo ? formatCurrency((profileData || user).totalPurchase) : '••••••'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Thao tác nhanh
              </h2>
              
              <div className="space-y-3">
                <Link
                  to="/dashboard"
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Về Dashboard
                </Link>
                <button className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Đổi mật khẩu
                </button>
                <button className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Lịch sử đơn hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile