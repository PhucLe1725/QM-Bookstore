import React, { useState, useEffect } from 'react'
import {
    Package,
    Search,
    Filter,
    Plus,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    ClipboardCheck,
    Calendar,
    FileText,
    ShoppingCart
} from 'lucide-react'
import inventoryService from '../../services/inventoryService'
import { productService } from '../../services'
import { useToast } from '../../contexts/ToastContext'
import AdminPageHeader from '../../components/AdminPageHeader'
import ProductSearchableSelect from '../../components/ProductSearchableSelect'

const AdminInventory = () => {
    const { showToast } = useToast()

    // State
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)

    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedTransaction, setSelectedTransaction] = useState(null)

    // Filters
    const [filters, setFilters] = useState({
        transactionType: '',
        referenceType: '',
        referenceId: '',
        productId: '',
        skipCount: 0,
        maxResultCount: 20
    })

    // Pagination
    const [totalRecords, setTotalRecords] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)

    // Create form
    const [createForm, setCreateForm] = useState({
        transactionType: 'IN',
        referenceType: 'MANUAL',
        note: '',
        items: [{ productId: '', quantity: 1, changeType: 'PLUS', unitPrice: '' }]
    })

    // Quick filter buttons
    const quickFilters = [
        { label: 'Tất cả', filter: {} },
        { label: '🟢 Nhập kho', filter: { transactionType: 'IN' } },
        { label: '🔴 Xuất kho', filter: { transactionType: 'OUT' } },
        { label: '🟠 Hàng hỏng', filter: { transactionType: 'DAMAGED' } },
        { label: '🔵 Kiểm kê', filter: { transactionType: 'STOCKTAKE' } },
        { label: '📦 Từ đơn hàng', filter: { referenceType: 'ORDER' } }
    ]

    const transactionTypeLabels = {
        IN: { label: 'Nhập kho', color: 'bg-green-100 text-green-800', icon: TrendingUp },
        OUT: { label: 'Xuất kho', color: 'bg-red-100 text-red-800', icon: TrendingDown },
        DAMAGED: { label: 'Hàng hỏng', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
        STOCKTAKE: { label: 'Kiểm kê', color: 'bg-blue-100 text-blue-800', icon: ClipboardCheck }
    }

    const referenceTypeLabels = {
        ORDER: { label: 'Đơn hàng', icon: ShoppingCart },
        MANUAL: { label: 'Thủ công', icon: FileText },
        STOCKTAKE: { label: 'Kiểm kê', icon: ClipboardCheck }
    }

    useEffect(() => {
        loadTransactions()
    }, [filters])

    const loadTransactions = async () => {
        try {
            setLoading(true)
            const response = await inventoryService.getTransactions(filters)

            if (response && response.success) {
                setTransactions(response.result.data || [])
                setTotalRecords(response.result.totalRecords || 0)
            } else {
                setTransactions([])
                setTotalRecords(0)
            }
        } catch (error) {
            if (error.response?.status === 404) {
                showToast('⚠️ Backend API chưa được implement', 'warning')
            } else {
                showToast('Không thể tải lịch sử kho', 'error')
            }
            setTransactions([])
            setTotalRecords(0)
        } finally {
            setLoading(false)
        }
    }

    const loadTransactionDetail = async (id) => {
        try {
            const response = await inventoryService.getTransactionById(id)
            if (response.success) {
                setSelectedTransaction(response.result)
                setShowDetailModal(true)
            }
        } catch (error) {
            console.error('Error loading transaction detail:', error)
            showToast('Không thể tải chi tiết giao dịch', 'error')
        }
    }

    const handleQuickFilter = (filter) => {
        setFilters(prev => ({
            ...prev,
            ...filter,
            transactionType: filter.transactionType || '',
            referenceType: filter.referenceType || '',
            skipCount: 0
        }))
        setCurrentPage(1)
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            skipCount: 0
        }))
        setCurrentPage(1)
    }

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage)
        setFilters(prev => ({
            ...prev,
            skipCount: (newPage - 1) * filters.maxResultCount
        }))
    }

    const handleCreateFormChange = (field, value) => {
        setCreateForm(prev => ({ ...prev, [field]: value }))
    }

    const handleItemChange = (index, field, value) => {
        setCreateForm(prev => {
            const items = [...prev.items]
            items[index] = { ...items[index], [field]: value }
            return { ...prev, items }
        })
    }

    const addItem = () => {
        const defaultChangeType = createForm.transactionType === 'STOCKTAKE' ? 'PLUS' : getChangeTypeForTransaction(createForm.transactionType)
        setCreateForm(prev => ({
            ...prev,
            items: [...prev.items, { productId: '', quantity: 1, changeType: defaultChangeType, unitPrice: '' }]
        }))
    }

    const removeItem = (index) => {
        if (createForm.items.length === 1) {
            showToast('Phải có ít nhất 1 sản phẩm', 'warning')
            return
        }
        setCreateForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }))
    }

    const getChangeTypeForTransaction = (transactionType) => {
        switch (transactionType) {
            case 'IN':
                return 'PLUS'
            case 'DAMAGED':
                return 'MINUS'
            case 'STOCKTAKE':
                return 'PLUS' // Default, user can change
            default:
                return 'PLUS'
        }
    }

    const handleSubmitCreate = async (e) => {
        e.preventDefault()

        // Validation
        if (!createForm.transactionType) {
            showToast('Vui lòng chọn loại giao dịch', 'warning')
            return
        }

        if (createForm.items.some(item => !item.productId || item.quantity <= 0)) {
            showToast('Vui lòng chọn sản phẩm và nhập số lượng hợp lệ', 'warning')
            return
        }

        // Validate unitPrice for IN transactions
        if (createForm.transactionType === 'IN') {
            if (createForm.items.some(item => !item.unitPrice || parseFloat(item.unitPrice) <= 0)) {
                showToast('Vui lòng nhập giá nhập cho tất cả sản phẩm!', 'warning')
                return
            }
        }

        const changeType = getChangeTypeForTransaction(createForm.transactionType)

        const payload = {
            transactionType: createForm.transactionType,
            referenceType: createForm.referenceType,
            note: createForm.note || undefined,
            items: createForm.items.map(item => {
                const itemData = {
                    productId: parseInt(item.productId),
                    // For STOCKTAKE, use individual item's changeType, otherwise use default
                    changeType: createForm.transactionType === 'STOCKTAKE' ? item.changeType : changeType,
                    quantity: parseInt(item.quantity)
                }
                // Add unitPrice for IN transactions
                if (createForm.transactionType === 'IN' && item.unitPrice) {
                    itemData.unitPrice = parseFloat(item.unitPrice)
                }
                return itemData
            })
        }

        // console.log('[AdminInventory] Creating transaction with payload:', JSON.stringify(payload, null, 2))

        try {
            const response = await inventoryService.createTransaction(payload)
            if (response.success) {
                showToast('Tạo giao dịch kho thành công', 'success')
                setShowCreateModal(false)
                resetCreateForm()
                loadTransactions()
            }
        } catch (error) {
            console.error('Error creating transaction:', error)
            console.error('Error response:', error.response?.data)
            console.error('Error status:', error.response?.status)
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tạo giao dịch'
            showToast(errorMessage, 'error')
        }
    }

    const resetCreateForm = () => {
        setCreateForm({
            transactionType: 'IN',
            referenceType: 'MANUAL',
            note: '',
            items: [{ productId: '', quantity: 1, changeType: 'PLUS', unitPrice: '' }]
        })
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) {
            return '-'
        }
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const calculateTransactionTotal = (items) => {
        if (!items || items.length === 0) return 0
        return items.reduce((sum, item) => {
            return sum + (item.totalPrice || 0)
        }, 0)
    }

    const totalPages = Math.ceil(totalRecords / filters.maxResultCount)

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminPageHeader
                title="Quản Lý Kho"
                description="Theo dõi và quản lý biến động tồn kho, nhập xuất hàng hóa"
                actions={
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Tạo Phiếu Mới
                    </button>
                }
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Quick Filters */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {quickFilters.map((qf, idx) => {
                        const isActive =
                            (!qf.filter.transactionType && !filters.transactionType && !qf.filter.referenceType && !filters.referenceType) ||
                            (qf.filter.transactionType === filters.transactionType) ||
                            (qf.filter.referenceType === filters.referenceType)

                        return (
                            <button
                                key={idx}
                                onClick={() => handleQuickFilter(qf.filter)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {qf.label}
                            </button>
                        )
                    })}
                </div>

                {/* Advanced Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <h3 className="text-lg font-semibold text-gray-800">Bộ Lọc Nâng Cao</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Loại Giao Dịch
                            </label>
                            <select
                                value={filters.transactionType}
                                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Tất cả</option>
                                <option value="IN">Nhập kho</option>
                                <option value="OUT">Xuất kho</option>
                                <option value="DAMAGED">Hàng hỏng</option>
                                <option value="STOCKTAKE">Kiểm kê</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nguồn Gốc
                            </label>
                            <select
                                value={filters.referenceType}
                                onChange={(e) => handleFilterChange('referenceType', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Tất cả</option>
                                <option value="ORDER">Đơn hàng</option>
                                <option value="MANUAL">Thủ công</option>
                                <option value="STOCKTAKE">Kiểm kê</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ID Tham Chiếu
                            </label>
                            <input
                                type="number"
                                value={filters.referenceId}
                                onChange={(e) => handleFilterChange('referenceId', e.target.value)}
                                placeholder="Tìm theo ID đơn hàng..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({
                                        transactionType: '',
                                        referenceType: '',
                                        referenceId: '',
                                        productId: '',
                                        skipCount: 0,
                                        maxResultCount: 20
                                    })
                                    setCurrentPage(1)
                                }}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Xóa Bộ Lọc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Loại
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nguồn Gốc
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tham Chiếu
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ghi Chú
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tổng Giá Trị
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao Tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center">
                                            <div className="flex justify-center items-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                            Không có giao dịch nào
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((transaction) => {
                                        const typeInfo = transactionTypeLabels[transaction.transactionType]
                                        const refInfo = referenceTypeLabels[transaction.referenceType]
                                        const TypeIcon = typeInfo?.icon || Package
                                        const RefIcon = refInfo?.icon || FileText

                                        return (
                                            <tr key={transaction.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{transaction.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                                                        <TypeIcon className="w-3 h-3 mr-1" />
                                                        {typeInfo?.label || transaction.transactionType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        <RefIcon className="w-4 h-4 mr-2 text-gray-400" />
                                                        {refInfo?.label || transaction.referenceType}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {transaction.referenceId ? `#${transaction.referenceId}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {transaction.note || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                        {formatDate(transaction.createdAt)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                                    {formatCurrency(calculateTransactionTotal(transaction.items))}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => loadTransactionDetail(transaction.id)}
                                                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        Xem
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Sau
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Hiển thị <span className="font-medium">{filters.skipCount + 1}</span> đến{' '}
                                        <span className="font-medium">{Math.min(filters.skipCount + filters.maxResultCount, totalRecords)}</span> trong tổng{' '}
                                        <span className="font-medium">{totalRecords}</span> giao dịch
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        {[...Array(totalPages)].map((_, idx) => {
                                            const pageNum = idx + 1
                                            if (
                                                pageNum === 1 ||
                                                pageNum === totalPages ||
                                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                )
                                            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                                return <span key={pageNum} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
                                            }
                                            return null
                                        })}
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedTransaction && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Chi Tiết Giao Dịch #{selectedTransaction.id}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{formatDate(selectedTransaction.createdAt)}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Transaction Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại Giao Dịch</label>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${transactionTypeLabels[selectedTransaction.transactionType]?.color}`}>
                                        {transactionTypeLabels[selectedTransaction.transactionType]?.label}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn Gốc</label>
                                    <div className="flex items-center">
                                        {React.createElement(referenceTypeLabels[selectedTransaction.referenceType]?.icon || FileText, { className: "w-4 h-4 mr-2 text-gray-400" })}
                                        <span className="text-sm text-gray-900">{referenceTypeLabels[selectedTransaction.referenceType]?.label}</span>
                                        {selectedTransaction.referenceId && (
                                            <span className="ml-2 text-sm text-gray-500">#{selectedTransaction.referenceId}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedTransaction.note && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi Chú</label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTransaction.note}</p>
                                </div>
                            )}

                            {/* Items List */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Danh Sách Sản Phẩm</label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thay đổi</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {selectedTransaction.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{item.productSku || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.changeType === 'PLUS'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {item.changeType === 'PLUS' ? '+' : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                        {formatCurrency(item.unitPrice)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                                                        {formatCurrency(item.totalPrice)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan="5" className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                    Tổng cộng:
                                                </td>
                                                <td className="px-4 py-3 text-right text-base font-bold text-blue-600">
                                                    {formatCurrency(calculateTransactionTotal(selectedTransaction.items))}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-10">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Tạo Giao Dịch Kho Mới</h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false)
                                    resetCreateForm()
                                }}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitCreate} className="space-y-6">
                            {/* Transaction Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loại Giao Dịch <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={createForm.transactionType}
                                        onChange={(e) => handleCreateFormChange('transactionType', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="IN">🟢 Nhập Kho</option>
                                        <option value="DAMAGED">🟠 Hàng Hỏng</option>
                                        <option value="STOCKTAKE">🔵 Kiểm Kê</option>
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {createForm.transactionType === 'IN' && 'Nhập hàng từ nhà cung cấp'}
                                        {createForm.transactionType === 'DAMAGED' && 'Ghi nhận hàng bị hỏng/mất'}
                                        {createForm.transactionType === 'STOCKTAKE' && 'Điều chỉnh sau kiểm kê'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nguồn Gốc
                                    </label>
                                    <select
                                        value={createForm.referenceType}
                                        onChange={(e) => handleCreateFormChange('referenceType', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="MANUAL">Thủ công</option>
                                        {createForm.transactionType === 'STOCKTAKE' && <option value="STOCKTAKE">Kiểm kê</option>}
                                    </select>
                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi Chú
                                </label>
                                <textarea
                                    value={createForm.note}
                                    onChange={(e) => handleCreateFormChange('note', e.target.value)}
                                    rows="3"
                                    placeholder="Nhập ghi chú về giao dịch này..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Products */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Danh Sách Sản Phẩm <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="inline-flex items-center px-3 py-1 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Thêm Sản Phẩm
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {createForm.items.map((item, index) => {
                                        const isStocktake = createForm.transactionType === 'STOCKTAKE'
                                        const isIn = createForm.transactionType === 'IN'
                                        const calculatedTotal = item.quantity && item.unitPrice ? item.quantity * parseFloat(item.unitPrice) : 0
                                        
                                        return (
                                            <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-3">
                                                <div className="flex gap-3 items-start">
                                                    <div className="flex-1">
                                                        <ProductSearchableSelect
                                                            value={item.productId}
                                                            onChange={(value) => handleItemChange(index, 'productId', value)}
                                                            placeholder="Tìm và chọn sản phẩm..."
                                                            showStock={true}
                                                            showPrice={true}
                                                        />
                                                    </div>
                                                    
                                                    {/* Change Type for STOCKTAKE */}
                                                    {isStocktake && (
                                                        <div className="w-28">
                                                            <select
                                                                value={item.changeType || 'PLUS'}
                                                                onChange={(e) => handleItemChange(index, 'changeType', e.target.value)}
                                                                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                                required
                                                            >
                                                                <option value="PLUS">+ Tăng</option>
                                                                <option value="MINUS">- Giảm</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                    
                                                    <div className={isStocktake ? 'w-24' : 'w-32'}>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                            min="1"
                                                            placeholder="Số lượng"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            required
                                                        />
                                                    </div>
                                                    
                                                    {/* Unit Price for IN transactions */}
                                                    {isIn && (
                                                        <div className="w-40">
                                                            <input
                                                                type="number"
                                                                value={item.unitPrice}
                                                                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                                                min="0"
                                                                placeholder="Giá nhập (₫)"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                required
                                                            />
                                                        </div>
                                                    )}
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        disabled={createForm.items.length === 1}
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                
                                                {/* Display calculated total for IN transactions */}
                                                {isIn && item.productId && item.quantity && item.unitPrice && (
                                                    <div className="flex justify-end items-center gap-2 text-sm">
                                                        <span className="text-gray-600">Thành tiền:</span>
                                                        <span className="font-semibold text-blue-600">
                                                            {formatCurrency(calculatedTotal)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                
                                {/* Total Amount for IN transactions */}
                                {createForm.transactionType === 'IN' && createForm.items.length > 0 && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-semibold text-gray-700">Tổng giá trị nhập:</span>
                                            <span className="text-xl font-bold text-blue-600">
                                                {formatCurrency(
                                                    createForm.items.reduce((sum, item) => {
                                                        const itemTotal = item.quantity && item.unitPrice ? item.quantity * parseFloat(item.unitPrice) : 0
                                                        return sum + itemTotal
                                                    }, 0)
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false)
                                        resetCreateForm()
                                    }}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Tạo Giao Dịch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminInventory
