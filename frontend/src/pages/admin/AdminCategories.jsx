import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Save,
  X,
  AlertCircle,
  FolderTree,
  ChevronRight,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Loader
} from 'lucide-react'
import { categoryService } from '../../services'
import { useToast } from '../../contexts/ToastContext'
import AdminPageHeader from '../../components/AdminPageHeader'

const AdminCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { showToast } = useToast()
  
  // Tree state
  const [expandedNodes, setExpandedNodes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: null,
    status: true
  })
  
  const [formErrors, setFormErrors] = useState({})

  // Fetch categories tree
  const fetchCategories = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await categoryService.getCategoryTree()
      setCategories(data)
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách danh mục')
      showToast('error', 'Lỗi khi tải danh mục')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Toggle node expansion
  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    )
  }

  // Flatten tree for display
  const flattenTree = (nodes, level = 0, result = []) => {
    nodes.forEach(node => {
      result.push({ ...node, level })
      if (expandedNodes.includes(node.id) && node.children?.length > 0) {
        flattenTree(node.children, level + 1, result)
      }
    })
    return result
  }

  // Filter categories by search
  const filterTree = (nodes) => {
    if (!searchTerm) return nodes
    
    return nodes.reduce((acc, node) => {
      const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase())
      const filteredChildren = filterTree(node.children || [])
      
      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren
        })
      }
      return acc
    }, [])
  }

  // Get all category options for parent select (exclude self and descendants)
  const getCategoryOptions = (currentCategoryId = null) => {
    const flatList = []
    
    const traverse = (nodes, level = 0) => {
      nodes.forEach(node => {
        if (node.id !== currentCategoryId) {
          flatList.push({ ...node, level })
          if (node.children?.length > 0) {
            traverse(node.children, level + 1)
          }
        }
      })
    }
    
    traverse(categories)
    return flatList
  }

  // Handle create
  const handleCreate = () => {
    setModalMode('create')
    setSelectedCategory(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      parentId: null,
      status: true
    })
    setFormErrors({})
    setShowModal(true)
  }

  // Handle edit
  const handleEdit = (category) => {
    setModalMode('edit')
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parentId || null,
      status: category.status
    })
    setFormErrors({})
    setShowModal(true)
  }

  // Handle delete
  const handleDelete = (category) => {
    setCategoryToDelete(category)
    setShowDeleteConfirm(true)
  }

  // Validate form
  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Tên danh mục không được để trống'
    }
    
    if (formData.name.length > 255) {
      errors.name = 'Tên danh mục không được vượt quá 255 ký tự'
    }
    
    if (formData.slug && formData.slug.length > 255) {
      errors.slug = 'Slug không được vượt quá 255 ký tự'
    }
    
    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Mô tả không được vượt quá 1000 ký tự'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showToast('error', 'Vui lòng kiểm tra lại thông tin')
      return
    }

    try {
      if (modalMode === 'create') {
        await categoryService.createCategory(formData)
        showToast('success', 'Tạo danh mục thành công')
      } else {
        await categoryService.updateCategory(selectedCategory.id, formData)
        showToast('success', 'Cập nhật danh mục thành công')
      }
      
      setShowModal(false)
      await fetchCategories()
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra'
      showToast('error', errorMsg)
    }
  }

  // Confirm delete
  const confirmDelete = async () => {
    try {
      const hasChildren = categoryToDelete.children?.length > 0
      await categoryService.deleteCategory(categoryToDelete.id, hasChildren)
      showToast('success', 'Xóa danh mục thành công')
      
      setShowDeleteConfirm(false)
      setCategoryToDelete(null)
      await fetchCategories()
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Không thể xóa danh mục'
      showToast('error', errorMsg)
    }
  }

  const filteredCategories = filterTree(categories)
  const flatCategories = flattenTree(filteredCategories)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader
        title="Quản lý Danh mục"
        description="Quản lý cây danh mục phân cấp sản phẩm"
        actions={
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Thêm danh mục
          </button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Tree Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flatCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Không tìm thấy danh mục nào</p>
                  </td>
                </tr>
              ) : (
                flatCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2" style={{ paddingLeft: `${category.level * 24}px` }}>
                        {category.children?.length > 0 ? (
                          <button
                            onClick={() => toggleNode(category.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {expandedNodes.includes(category.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="w-4" />
                        )}
                        <FolderTree className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-xs truncate">
                        {category.description || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.status ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <ToggleRight className="w-3 h-3" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <ToggleLeft className="w-3 h-3" />
                          Tạm ngừng
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="text-red-600 hover:text-red-800"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'create' ? 'Thêm danh mục mới' : 'Sửa danh mục'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="VD: Văn phòng phẩm"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.slug ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="van-phong-pham (để trống để tự động tạo)"
                />
                {formErrors.slug && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.slug}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Để trống để backend tự động tạo từ tên danh mục
                </p>
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục cha
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Không có (Danh mục gốc) --</option>
                  {getCategoryOptions(selectedCategory?.id).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {'—'.repeat(cat.level)} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Mô tả ngắn về danh mục..."
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Kích hoạt</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Save className="w-4 h-4" />
                  {modalMode === 'create' ? 'Tạo mới' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                </div>
              </div>
              
              <p className="text-gray-600 mb-2">
                Bạn có chắc chắn muốn xóa danh mục <strong>{categoryToDelete.name}</strong>?
              </p>
              
              {categoryToDelete.children?.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Cảnh báo:</strong> Danh mục này có {categoryToDelete.children.length} danh mục con. 
                    Backend sẽ kiểm tra và không cho phép xóa nếu có sản phẩm liên quan.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setCategoryToDelete(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCategories
