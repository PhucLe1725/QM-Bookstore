import React, { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Trash2, AlertTriangle, X, Search } from 'lucide-react'
import roleService from '../../services/roleService'
import { useToast } from '../../contexts/ToastContext'
import AdminPageHeader from '../../components/AdminPageHeader'

const AdminRoles = () => {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [formData, setFormData] = useState({
    name: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const { showToast } = useToast()

  // System roles that cannot be deleted
  const SYSTEM_ROLES = ['admin', 'manager', 'customer']

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setLoading(true)
      const response = await roleService.getAllRoles()
      if (response.success) {
        setRoles(response.result || [])
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      showToast('Không thể tải danh sách role', 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '' })
    setFormErrors({})
  }

  const validateForm = () => {
    const errors = {}
    
    const nameValidation = roleService.validateRoleName(formData.name)
    if (!nameValidation.valid) {
      errors.name = nameValidation.error
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreate = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const handleEdit = (role) => {
    setSelectedRole(role)
    setFormData({ name: role.name })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleDeleteClick = (role) => {
    setSelectedRole(role)
    setShowDeleteModal(true)
  }

  const handleSubmitCreate = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      const response = await roleService.createRole(formData)
      if (response.success) {
        showToast('Tạo role thành công', 'success')
        setShowCreateModal(false)
        loadRoles()
        resetForm()
      }
    } catch (error) {
      console.error('Error creating role:', error)
      if (error.response?.data?.code === 1010) {
        setFormErrors({ name: 'Role này đã tồn tại' })
      } else if (error.response?.data?.code === 1003) {
        showToast('Dữ liệu không hợp lệ', 'error')
      } else {
        showToast('Không thể tạo role', 'error')
      }
    }
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      const response = await roleService.updateRole(selectedRole.id, formData)
      if (response.success) {
        showToast('Cập nhật role thành công', 'success')
        setShowEditModal(false)
        loadRoles()
        resetForm()
      }
    } catch (error) {
      console.error('Error updating role:', error)
      if (error.response?.data?.code === 1010) {
        setFormErrors({ name: 'Tên role này đã tồn tại' })
      } else if (error.response?.data?.code === 1009) {
        showToast('Role không tồn tại', 'error')
      } else {
        showToast('Không thể cập nhật role', 'error')
      }
    }
  }

  const handleConfirmDelete = async () => {
    try {
      const response = await roleService.deleteRole(selectedRole.id)
      if (response.success) {
        showToast('Xóa role thành công', 'success')
        setShowDeleteModal(false)
        loadRoles()
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      if (error.response?.data?.code === 1009) {
        showToast('Role không tồn tại', 'error')
      } else {
        showToast('Không thể xóa role', 'error')
      }
      setShowDeleteModal(false)
    }
  }

  // Filter roles based on search
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader
        title="Quản lý Role"
        description="Quản lý các vai trò người dùng trong hệ thống"
        actions={
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Tạo Role Mới</span>
          </button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy role nào
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {role.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{role.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {SYSTEM_ROLES.includes(role.name) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Hệ thống
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Tùy chỉnh
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(role)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(role)}
                          disabled={SYSTEM_ROLES.includes(role.name)}
                          className={`p-1 ${
                            SYSTEM_ROLES.includes(role.name)
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-800'
                          }`}
                          title={SYSTEM_ROLES.includes(role.name) ? 'Không thể xóa role hệ thống' : 'Xóa'}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Tạo Role Mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Role <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: moderator, super_admin"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ dùng chữ thường và dấu gạch dưới (_), không dấu cách
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tạo Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Chỉnh sửa Role</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Role <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: moderator, super_admin"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Chỉ dùng chữ thường và dấu gạch dưới (_), không dấu cách
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Xác nhận xóa</h2>
                <p className="text-sm text-gray-600">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">
                Bạn có chắc chắn muốn xóa role <span className="font-semibold">"{selectedRole.name}"</span>?
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Việc xóa role có thể ảnh hưởng đến các user đang sử dụng role này.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xóa Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRoles
