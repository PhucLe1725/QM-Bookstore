// Admin role utilities

/**
 * Kiểm tra xem user có quyền admin không
 * @param {Object} user - User object từ authentication
 * @returns {boolean} - true nếu user là admin
 */
export const isAdmin = (user) => {
  if (!user) return false
  
  // Kiểm tra nhiều format role khác nhau
  return (
    user.role === 'admin' ||
    user.role === 'ADMIN' ||
    user.roleName === 'admin' ||  // Thêm check cho roleName
    user.roleName === 'ADMIN' ||  // Thêm check cho roleName viết hoa
    user.roles?.includes('admin') ||
    user.roles?.includes('ADMIN') ||
    user.isAdmin === true ||
    user.admin === true
  )
}

/**
 * Kiểm tra xem user có quyền admin hoặc manager không
 * @param {Object} user - User object từ authentication
 * @returns {boolean} - true nếu user là admin hoặc manager
 */
export const isAdminOrManager = (user) => {
  if (!user) return false
  
  // Kiểm tra nhiều format role khác nhau (admin hoặc manager)
  return (
    user.role === 'admin' ||
    user.role === 'ADMIN' ||
    user.role === 'manager' ||
    user.role === 'MANAGER' ||
    user.roleName === 'admin' ||
    user.roleName === 'ADMIN' ||
    user.roleName === 'manager' ||
    user.roleName === 'MANAGER' ||
    user.roles?.includes('admin') ||
    user.roles?.includes('ADMIN') ||
    user.roles?.includes('manager') ||
    user.roles?.includes('MANAGER') ||
    user.isAdmin === true ||
    user.admin === true
  )
}

/**
 * Kiểm tra quyền của user
 * @param {Object} user - User object
 * @param {string} permission - Permission cần kiểm tra
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user) return false
  
  // Admin có tất cả quyền
  if (isAdmin(user)) return true
  
  // Kiểm tra permission cụ thể
  return user.permissions?.includes(permission) || false
}

/**
 * Lấy danh sách quyền của user
 * @param {Object} user - User object
 * @returns {Array} - Danh sách permissions
 */
export const getUserPermissions = (user) => {
  if (!user) return []
  
  if (isAdmin(user)) {
    return ['admin', 'read', 'write', 'delete', 'manage_users', 'manage_books', 'manage_orders']
  }
  
  return user.permissions || []
}

/**
 * Kiểm tra user có thể truy cập admin dashboard không
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canAccessAdminDashboard = (user) => {
  return isAdmin(user) || hasPermission(user, 'admin_dashboard')
}

/**
 * Format role name để hiển thị
 * @param {Object} user - User object
 * @returns {string} - Formatted role name
 */
export const formatUserRole = (user) => {
  if (!user) return 'Khách'
  
  const role = user.role || user.roleName || ''
  
  if (isAdmin(user)) return 'Quản trị viên'
  if (role === 'manager') return 'Quản lý'
  if (role === 'staff') return 'Nhân viên'
  if (role === 'user') return 'Người dùng'
  
  return role || 'Người dùng'
}