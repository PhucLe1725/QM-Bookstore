/**
 * JWT Utilities
 * Helper functions to decode and inspect JWT tokens
 */

/**
 * Decode JWT token (without verification - for debugging only)
 * @param {string} token - JWT token string
 * @returns {object|null} Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  if (!token) return null
  
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    // Decode base64url to base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Get user roles from JWT token
 * @param {string} token - JWT token string
 * @returns {string[]} Array of role names (e.g., ['ROLE_ADMIN', 'ROLE_USER'])
 */
export const getUserRoles = (token) => {
  const payload = decodeJWT(token)
  if (!payload) return []
  
  // Check common JWT claims for roles
  return payload.scope?.split(' ') || payload.roles || []
}

/**
 * Check if token has specific role
 * @param {string} token - JWT token string
 * @param {string} role - Role to check (e.g., 'ROLE_ADMIN')
 * @returns {boolean}
 */
export const hasRole = (token, role) => {
  const roles = getUserRoles(token)
  return roles.includes(role)
}

/**
 * Log token details for debugging
 * @param {string} token - JWT token string
 */
export const logTokenDetails = (token) => {
  const payload = decodeJWT(token)
  if (payload) {
    console.log('🔐 JWT Token Details:')
    console.log('  User ID:', payload.sub)
    console.log('  Roles:', getUserRoles(token))
    console.log('  Issued At:', new Date(payload.iat * 1000).toLocaleString())
    console.log('  Expires At:', new Date(payload.exp * 1000).toLocaleString())
    console.log('  Full Payload:', payload)
  } else {
    console.error('❌ Invalid JWT token')
  }
}
