import React, { useState, useEffect } from 'react'
import { QrCode, Copy, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { generateVietQRUrl, getVietQRConfig } from '../utils/systemConfig'

/**
 * VietQR Payment Component
 * Displays QR code for banking transfer payment
 * 
 * @param {Object} props
 * @param {number} props.amount - Payment amount in VND
 * @param {string} props.orderCode - Order code for payment tracking (e.g., "QMORD12")
 * @param {Function} props.onPaymentSuccess - Callback when payment is verified
 * @param {boolean} props.showInstructions - Show payment instructions (default: true)
 */
const QRPayment = ({ 
  amount, 
  orderCode, 
  onPaymentSuccess,
  showInstructions = true 
}) => {
  const [qrUrl, setQrUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [vietQRConfig, setVietQRConfig] = useState({
    bankId: 'sacombank',
    accountNo: '17251725',
    accountName: 'LE XUAN PHUC',
    template: 'compact2'
  })

  useEffect(() => {
    loadQRConfig()
  }, [amount, orderCode])

  const loadQRConfig = async () => {
    try {
      setLoading(true)
      const config = await getVietQRConfig()
      setVietQRConfig(config)
      
      const url = generateVietQRUrl(
        amount,
        orderCode,
        config.accountName,
        config.accountNo,
        config.bankId,
        config.template
      )
      setQrUrl(url)
    } catch (error) {
      console.error('Failed to load QR config:', error)
      // Fallback to default config
      const url = generateVietQRUrl(amount, orderCode)
      setQrUrl(url)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="qr-payment-container bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <QrCode className="w-8 h-8 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">Thanh toán QR</h2>
        </div>
        <p className="text-gray-600">Quét mã QR để chuyển khoản</p>
      </div>

      {/* QR Code */}
      <div className="qr-code-wrapper bg-white border-4 border-blue-100 rounded-lg p-4 mb-6">
        <img 
          src={qrUrl} 
          alt="VietQR Payment Code"
          className="w-full max-w-sm mx-auto"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3EQR Code Error%3C/text%3E%3C/svg%3E'
          }}
        />
      </div>

      {/* Payment Information */}
      <div className="payment-info space-y-3 mb-6">
        <div className="info-row flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600 font-medium">Số tiền:</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(amount)}
            </span>
            <button
              onClick={() => copyToClipboard(amount.toString(), 'amount')}
              className="p-1 hover:bg-gray-200 rounded transition"
              title="Copy số tiền"
            >
              {copied === 'amount' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        <div className="info-row flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600 font-medium">Nội dung CK:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-gray-800">
              {orderCode}
            </span>
            <button
              onClick={() => copyToClipboard(orderCode, 'orderCode')}
              className="p-1 hover:bg-gray-200 rounded transition"
              title="Copy nội dung"
            >
              {copied === 'orderCode' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        <div className="info-row flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600 font-medium">Ngân hàng:</span>
          <span className="font-semibold text-gray-800 uppercase">
            {vietQRConfig.bankId}
          </span>
        </div>

        <div className="info-row flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600 font-medium">Số TK:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-gray-800">
              {vietQRConfig.accountNo}
            </span>
            <button
              onClick={() => copyToClipboard(vietQRConfig.accountNo, 'accountNo')}
              className="p-1 hover:bg-gray-200 rounded transition"
              title="Copy số tài khoản"
            >
              {copied === 'accountNo' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        <div className="info-row flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600 font-medium">Chủ TK:</span>
          <span className="font-semibold text-gray-800">
            {vietQRConfig.accountName}
          </span>
        </div>
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div className="instructions bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Hướng dẫn thanh toán
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-900">
            <li>Mở ứng dụng Banking (hỗ trợ VietQR)</li>
            <li>Chọn chức năng "Quét mã QR" hoặc "Chuyển khoản"</li>
            <li>Quét mã QR hoặc nhập thông tin chuyển khoản</li>
            <li><strong>Kiểm tra kỹ nội dung chuyển khoản: {orderCode}</strong></li>
            <li>Xác nhận và hoàn tất giao dịch</li>
          </ol>
        </div>
      )}

      {/* Warning */}
      <div className="warning bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Vui lòng chuyển khoản <strong>đúng số tiền</strong></li>
              <li>Nhập <strong>đúng nội dung</strong>: <code className="bg-yellow-100 px-1 rounded">{orderCode}</code></li>
              <li>Đơn hàng sẽ được xác nhận sau khi nhận được thanh toán</li>
              <li>Thời gian xử lý: 5-15 phút (trong giờ hành chính)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRPayment
