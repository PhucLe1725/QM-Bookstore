import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  AlertCircle
} from 'lucide-react'
import transactionService from '../../services/transactionService'
import orderService from '../../services/orderService'
import { useToast } from '../../contexts/ToastContext'
import AdminPageHeader from '../../components/AdminPageHeader'

const AdminTransactions = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [maxEmails, setMaxEmails] = useState(10)
  const [searchOrderCode, setSearchOrderCode] = useState('')
  const [filter, setFilter] = useState('all') // all | verified | unverified
  const [verifying, setVerifying] = useState({})

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const response = await transactionService.getAllTransactions()
      if (response.success) {
        setTransactions(response.result || [])
      } else {
        showToast('error', 'Không thể tải danh sách giao dịch')
      }
    } catch (error) {
      console.error('Failed to load transactions:', error)
      showToast('error', 'Lỗi khi tải danh sách giao dịch')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchEmails = async () => {
    setFetching(true)
    try {
      const response = await transactionService.fetchFromEmail(maxEmails)
      if (response.success) {
        const newTransactions = response.result || []
        showToast('Fetch email giao dịch thành công', `Đã fetch ${newTransactions.length} giao dịch từ email`)
        await loadTransactions() // Reload all transactions
      } else {
        showToast('Có lỗi xảy ra', 'Không thể fetch email')
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error)
      showToast('Có lỗi xảy ra', 'Lỗi khi fetch email: ' + (error.message || 'Unknown error'))
    } finally {
      setFetching(false)
    }
  }

  const handleSearch = async () => {
    if (!searchOrderCode.trim()) {
      loadTransactions()
      return
    }

    setLoading(true)
    try {
      const response = await transactionService.searchByOrderCode(searchOrderCode.trim())
      if (response.success) {
        setTransactions(response.result || [])
        showToast('info', `Tìm thấy ${response.result?.length || 0} giao dịch`)
      }
    } catch (error) {
      console.error('Search failed:', error)
      showToast('Có lỗi xảy ra', 'Lỗi khi tìm kiếm')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (transaction) => {
    // Extract order ID from payment details (format: "QMORD123" or "QMORD123")
    const match = transaction.paymentDetails?.match(/QMORD(\d+)/i)
    if (!match) {
      showToast('error', 'Không tìm thấy mã đơn hàng trong nội dung chuyển khoản')
      return
    }

    const orderId = match[1]
    const orderCode = `QMORD${orderId}`

    setVerifying(prev => ({ ...prev, [transaction.id]: true }))

    try {
      const verifyResponse = await transactionService.verifyTransaction({
        transactionId: transaction.id,
        expectedAmount: transaction.amount,
        orderCode: orderCode
      })

      if (verifyResponse.success && verifyResponse.result?.verified) {
        // Update order payment status to 'paid'
        try {
          await orderService.updateOrderStatus(orderId, {
            paymentStatus: 'paid'
          })

          showToast('Thành công', `✅ Đã xác nhận thanh toán và cập nhật đơn hàng #${orderId}`)
          await loadTransactions()
        } catch (orderError) {
          console.error('Failed to update order:', orderError)
          showToast('warning', 'Giao dịch đã verify nhưng không cập nhật được đơn hàng')
        }
      } else {
        showToast('error', verifyResponse.result?.message || 'Xác thực thất bại')
      }
    } catch (error) {
      console.error('Verification failed:', error)
      showToast('Có lỗi xảy ra', 'Lỗi khi xác thực: ' + (error.message || 'Unknown error'))
    } finally {
      setVerifying(prev => ({ ...prev, [transaction.id]: false }))
    }
  }

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'verified') return t.verified
    if (filter === 'unverified') return !t.verified
    return true
  })

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (transactionDate) => {
    const hours = (new Date() - new Date(transactionDate)) / (1000 * 60 * 60)
    return hours > 24
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader
        title="Quản Lý Giao Dịch Banking"
        description="Fetch email, verify giao dịch và cập nhật thanh toán đơn hàng"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fetch Emails */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={maxEmails}
                onChange={(e) => setMaxEmails(parseInt(e.target.value) || 10)}
                min="1"
                max="50"
                className="w-20 px-3 py-2 border rounded-lg"
                placeholder="10"
              />
              <button
                onClick={handleFetchEmails}
                disabled={fetching}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {fetching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Fetch Emails
                  </>
                )}
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchOrderCode}
                onChange={(e) => setSearchOrderCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm theo mã đơn (QMORD123)"
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            {/* <div className="flex items-center gap-2">
            <button
              onClick={loadTransactions}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div> */}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-4">
            <Filter className="w-4 h-4 text-gray-600" />
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Tất cả ({transactions.length})
            </button>
            <button
              onClick={() => setFilter('unverified')}
              className={`px-3 py-1 rounded ${filter === 'unverified' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
            >
              Chưa verify ({transactions.filter(t => !t.verified).length})
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-3 py-1 rounded ${filter === 'verified' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
            >
              Đã verify ({transactions.filter(t => t.verified).length})
            </button>
          </div>
        </div>

        {/* Transaction List */}
        {loading && !fetching ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Không có giao dịch nào</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTransactions.map(transaction => (
              <div
                key={transaction.id}
                className={`bg-white rounded-lg shadow p-4 border-l-4 ${transaction.verified
                    ? 'border-green-500'
                    : isExpired(transaction.transactionDate)
                      ? 'border-red-500'
                      : 'border-yellow-500'
                  }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Transaction Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">ID:</span>
                      <span className="font-semibold">#{transaction.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Thời gian GD:</span>
                      <span className="text-sm">{formatDate(transaction.transactionDate)}</span>
                    </div>
                    {/* <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Mã GD:</span>
                    <span className="text-sm font-mono">{transaction.orderNumber}</span>
                  </div> */}
                  </div>

                  {/* Sender/Amount Info */}
                  <div className="space-y-2">
                    {/* <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Từ:</span>
                    <span className="text-sm font-semibold">{transaction.remitterName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">TK:</span>
                    <span className="text-sm font-mono">{transaction.debitAccount}</span>
                  </div> */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Số tiền:</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Details & Actions */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Nội dung:</span>
                      <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1">
                        {transaction.paymentDetails}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {transaction.verified ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-semibold">Đã verify</span>
                        </div>
                      ) : isExpired(transaction.transactionDate) ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="w-5 h-5" />
                          <span className="font-semibold">Hết hạn (&gt;24h)</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleVerify(transaction)}
                          disabled={verifying[transaction.id]}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                        >
                          {verifying[transaction.id] ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Verify & Update Order
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminTransactions
