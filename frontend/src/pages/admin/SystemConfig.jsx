import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Search,
  AlertCircle,
  Check
} from 'lucide-react'
import systemConfigService from '../../services/systemConfigService'
import { useToast } from '../../contexts/ToastContext'
import { clearConfigCache } from '../../utils/systemConfig'
import AdminPageHeader from '../../components/AdminPageHeader'

const SystemConfig = () => {
  const toast = useToast()
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingConfig, setEditingConfig] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
  })

  const [createForm, setCreateForm] = useState({
    configKey: '',
    configValue: '',
    valueType: 'string',
    description: ''
  })

  useEffect(() => {
    loadConfigs()
  }, [pagination.page, pagination.size])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const response = await systemConfigService.getAll({
        page: pagination.page,
        size: pagination.size,
        sortBy: 'configKey'
      })

      if (response.success && response.result) {
        setConfigs(response.result.content || [])
        setPagination(prev => ({
          ...prev,
          totalElements: response.result.totalElements || 0,
          totalPages: response.result.totalPages || 0
        }))
      }
    } catch (error) {
      console.error('Error loading configs:', error)
      toast.error('Không thể tải cấu hình hệ thống')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    if (!createForm.configKey.trim()) {
      toast.warning('Vui lòng nhập key')
      return
    }

    if (!createForm.configValue.trim()) {
      toast.warning('Vui lòng nhập giá trị')
      return
    }

    try {
      const response = await systemConfigService.create(createForm)
      
      if (response.success) {
        toast.success('Tạo cấu hình thành công')
        setShowCreateModal(false)
        setCreateForm({
          configKey: '',
          configValue: '',
          valueType: 'string',
          description: ''
        })
        loadConfigs()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo cấu hình')
    }
  }

  const handleUpdate = async (id) => {
    if (!editingConfig) return

    try {
      const response = await systemConfigService.update(id, {
        configValue: editingConfig.configValue,
        valueType: editingConfig.valueType,
        description: editingConfig.description
      })

      if (response.success) {
        toast.success('Cập nhật thành công')
        
        // Clear cache cho config này
        clearConfigCache(configs.find(c => c.id === id)?.configKey)
        
        setEditingConfig(null)
        loadConfigs()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật')
    }
  }

  const handleDelete = async (id, configKey) => {
    if (!window.confirm(`Bạn có chắc muốn xóa cấu hình "${configKey}"?`)) {
      return
    }

    try {
      const response = await systemConfigService.delete(id)
      
      if (response.success) {
        toast.success('Xóa cấu hình thành công')
        
        // Clear cache cho config đã xóa
        clearConfigCache(configKey)
        
        loadConfigs()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa')
    }
  }

  const filteredConfigs = configs.filter(config => 
    config.configKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getValueTypeColor = (type) => {
    switch (type) {
      case 'number': return 'bg-blue-100 text-blue-800'
      case 'boolean': return 'bg-green-100 text-green-800'
      case 'json': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader
        title="Cấu hình hệ thống"
        description="Quản lý các thiết lập và cấu hình của hệ thống"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Thêm cấu hình
          </button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo key hoặc mô tả..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá trị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cập nhật
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConfigs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-900">
                        {config.configKey}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingConfig?.id === config.id ? (
                        <input
                          type="text"
                          value={editingConfig.configValue}
                          onChange={(e) => setEditingConfig({
                            ...editingConfig,
                            configValue: e.target.value
                          })}
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">
                          {config.configValue}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingConfig?.id === config.id ? (
                        <select
                          value={editingConfig.valueType}
                          onChange={(e) => setEditingConfig({
                            ...editingConfig,
                            valueType: e.target.value
                          })}
                          className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="json">JSON</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getValueTypeColor(config.valueType)}`}>
                          {config.valueType}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingConfig?.id === config.id ? (
                        <input
                          type="text"
                          value={editingConfig.description || ''}
                          onChange={(e) => setEditingConfig({
                            ...editingConfig,
                            description: e.target.value
                          })}
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">
                          {config.description || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(config.updatedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingConfig?.id === config.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleUpdate(config.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setEditingConfig(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setEditingConfig(config)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(config.id, config.configKey)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredConfigs.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">Không tìm thấy cấu hình nào</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{pagination.page * pagination.size + 1}</span> đến{' '}
              <span className="font-medium">
                {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)}
              </span>{' '}
              trong <span className="font-medium">{pagination.totalElements}</span> kết quả
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thêm cấu hình mới
              </h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Config Key *
                  </label>
                  <input
                    type="text"
                    value={createForm.configKey}
                    onChange={(e) => setCreateForm({ ...createForm, configKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., max_cart_items"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá trị *
                  </label>
                  <input
                    type="text"
                    value={createForm.configValue}
                    onChange={(e) => setCreateForm({ ...createForm, configValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại dữ liệu
                  </label>
                  <select
                    value={createForm.valueType}
                    onChange={(e) => setCreateForm({ ...createForm, valueType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="json">JSON</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mô tả về cấu hình này..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Tạo mới
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setCreateForm({
                        configKey: '',
                        configValue: '',
                        valueType: 'string',
                        description: ''
                      })
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemConfig
