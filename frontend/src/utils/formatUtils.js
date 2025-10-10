// Định dạng số tiền VND
export const formatCurrency = (amount, currency = 'VND') => {
  if (amount === null || amount === undefined) return '0đ'
  
  const number = Number(amount)
  if (isNaN(number)) return '0đ'
  
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number).replace('₫', 'đ')
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency
  }).format(number)
}

// Định dạng số với dấu phẩy phân cách
export const formatNumber = (number, options = {}) => {
  if (number === null || number === undefined) return '0'
  
  const num = Number(number)
  if (isNaN(num)) return '0'
  
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(num)
}

// Định dạng phần trăm
export const formatPercentage = (number, decimals = 1) => {
  if (number === null || number === undefined) return '0%'
  
  const num = Number(number)
  if (isNaN(num)) return '0%'
  
  return `${num.toFixed(decimals)}%`
}

// Rút gọn số lớn (1000 -> 1K, 1000000 -> 1M)
export const formatCompactNumber = (number) => {
  if (number === null || number === undefined) return '0'
  
  const num = Number(number)
  if (isNaN(num)) return '0'
  
  return new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num)
}

// Chuyển đổi string thành number
export const parseNumber = (str) => {
  if (!str) return 0
  
  // Loại bỏ các ký tự không phải số
  const cleaned = str.toString().replace(/[^\d.-]/g, '')
  const number = parseFloat(cleaned)
  
  return isNaN(number) ? 0 : number
}

// Tính phần trăm
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0
  return (value / total) * 100
}

// Làm tròn số
export const roundToDecimal = (number, decimals = 2) => {
  if (number === null || number === undefined) return 0
  
  const num = Number(number)
  if (isNaN(num)) return 0
  
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}