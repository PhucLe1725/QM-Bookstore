import systemConfigService from '../services/systemConfigService'

// Cache cho system configs để tránh fetch nhiều lần
const configCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 phút

/**
 * Lấy giá trị config theo key
 * @param {string} key - Config key (e.g., 'store_address')
 * @param {*} defaultValue - Giá trị mặc định nếu không tìm thấy
 * @returns {Promise<string>} Giá trị config
 */
export const getConfigValue = async (key, defaultValue = '') => {
  try {
    // Kiểm tra cache
    const cached = configCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.value
    }

    // Fetch từ API
    const response = await systemConfigService.getByKey(key)
    
    if (response.success && response.result) {
      const value = response.result.configValue
      
      // Lưu vào cache
      configCache.set(key, {
        value,
        timestamp: Date.now()
      })
      
      return value
    }
    
    return defaultValue
  } catch (error) {
    console.warn(`Failed to fetch config "${key}":`, error)
    return defaultValue
  }
}

/**
 * Lấy giá trị config dạng số
 */
export const getConfigValueAsNumber = async (key, defaultValue = 0) => {
  const value = await getConfigValue(key, String(defaultValue))
  return Number(value) || defaultValue
}

/**
 * Lấy giá trị config dạng boolean
 */
export const getConfigValueAsBoolean = async (key, defaultValue = false) => {
  const value = await getConfigValue(key, String(defaultValue))
  return value === 'true' || value === '1'
}

/**
 * Lấy giá trị config dạng JSON
 */
export const getConfigValueAsJSON = async (key, defaultValue = {}) => {
  try {
    const value = await getConfigValue(key, JSON.stringify(defaultValue))
    return JSON.parse(value)
  } catch (error) {
    console.warn(`Failed to parse JSON config "${key}":`, error)
    return defaultValue
  }
}

/**
 * Clear cache (dùng khi admin cập nhật config)
 */
export const clearConfigCache = (key = null) => {
  if (key) {
    configCache.delete(key)
  } else {
    configCache.clear()
  }
}

/**
 * Preload một số configs quan trọng
 */
export const preloadConfigs = async (keys = []) => {
  const promises = keys.map(key => getConfigValue(key))
  await Promise.all(promises)
}

/**
 * Lấy tọa độ cửa hàng từ config (có cache)
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const getStoreLocation = async () => {
  try {
    const [lat, lng] = await Promise.all([
      getConfigValueAsNumber(CONFIG_KEYS.STORE_LATITUDE, 21.028511), // Mặc định: Hoàn Kiếm, Hà Nội
      getConfigValueAsNumber(CONFIG_KEYS.STORE_LONGITUDE, 105.804817)
    ])
    
    return { lat, lng }
  } catch (error) {
    console.warn('Failed to fetch store location, using default:', error)
    return { lat: 21.028511, lng: 105.804817 }
  }
}

// Export các config keys thường dùng
export const CONFIG_KEYS = {
  STORE_ADDRESS: 'store_address',
  STORE_NAME: 'store_name',
  STORE_PHONE: 'store_phone',
  STORE_LATITUDE: 'store_latitude',
  STORE_LONGITUDE: 'store_longitude',
  DEFAULT_SHIPPING_FEE: 'default_shipping_fee',
  FREE_SHIPPING_THRESHOLD: 'free_shipping_threshold',
  TAX_RATE: 'tax_rate',
  MAX_CART_ITEMS: 'max_cart_items',
  MAINTENANCE_MODE: 'maintenance_mode',
  // VietQR Payment Configuration
  VIETQR_BANK_ID: 'vietqr_bank_id',
  VIETQR_ACCOUNT_NO: 'vietqr_account_no',
  VIETQR_ACCOUNT_NAME: 'vietqr_account_name',
  VIETQR_TEMPLATE: 'vietqr_template'
}

// Helper function to generate VietQR URL
export const generateVietQRUrl = (amount, orderCode, accountName = null, accountNo = null, bankId = null, template = null) => {
  const bank = bankId || 'sacombank'
  const account = accountNo || '17251725'
  const name = accountName || 'LE XUAN PHUC'
  const qrTemplate = template || 'compact2'
  
  const baseUrl = `https://img.vietqr.io/image/${bank}-${account}-${qrTemplate}.png`
  const params = new URLSearchParams({
    amount: amount,
    addInfo: orderCode,
    accountName: name
  })
  
  return `${baseUrl}?${params.toString()}`
}

// Helper function to get VietQR config from system config
export const getVietQRConfig = async () => {
  try {
    const [bankId, accountNo, accountName, template] = await Promise.all([
      getConfigValue(CONFIG_KEYS.VIETQR_BANK_ID),
      getConfigValue(CONFIG_KEYS.VIETQR_ACCOUNT_NO),
      getConfigValue(CONFIG_KEYS.VIETQR_ACCOUNT_NAME),
      getConfigValue(CONFIG_KEYS.VIETQR_TEMPLATE)
    ])
    
    return {
      bankId: bankId || 'sacombank',
      accountNo: accountNo || '17251725',
      accountName: accountName || 'LE XUAN PHUC',
      template: template || 'compact2'
    }
  } catch (error) {
    console.warn('Failed to fetch VietQR config, using defaults:', error)
    return {
      bankId: 'sacombank',
      accountNo: '17251725',
      accountName: 'LE XUAN PHUC',
      template: 'compact2'
    }
  }
}
