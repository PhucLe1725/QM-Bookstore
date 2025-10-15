# 🍪 Cookie-based Authentication Implementation

## 📋 Tổng quan

Frontend hiện đã được cập nhật để sử dụng **hybrid approach** với `js-cookie`:
- **Cookies**: Lưu trữ access token và refresh token (bảo mật hơn)
- **localStorage**: Backup token và lưu user data (không sensitive)

## 🔧 Cấu hình Cookie

### Token Cookie Settings:
```javascript
Cookies.set('token', accessToken, { 
  expires: 7,                                    // 7 ngày
  secure: window.location.protocol === 'https:', // Chỉ HTTPS trong production
  sameSite: 'strict',                           // Chống CSRF
  path: '/'                                     // Available toàn site
})
```

### Refresh Token Cookie Settings:
```javascript
Cookies.set('refreshToken', refreshToken, {
  expires: 30,        // 30 ngày
  secure: true,       // Chỉ HTTPS
  sameSite: 'strict', // Chống CSRF
  path: '/'
})
```

## 🔄 Cách hoạt động

### 1. **Login Process:**
```javascript
// 1. Gửi credentials đến backend
const response = await api.post('/auth/login', credentials)

// 2. Lưu token vào cookie (primary) và localStorage (backup)
Cookies.set('token', accessToken, options)
localStorage.setItem('token', accessToken)

// 3. Lưu user data trong localStorage
localStorage.setItem('user', JSON.stringify(userResponse))
```

### 2. **Token Retrieval Priority:**
```javascript
const getToken = () => {
  return Cookies.get('token') || localStorage.getItem('token')
}
```

### 3. **Logout Process:**
```javascript
// Xóa cả cookies và localStorage
Cookies.remove('token', { path: '/' })
Cookies.remove('refreshToken', { path: '/' })
localStorage.removeItem('token')
localStorage.removeItem('refreshToken')
localStorage.removeItem('user')
```

## ✅ Ưu điểm của Cookie approach

### 🔒 **Bảo mật tăng cường:**
- **httpOnly cookies** (nếu backend support): Không thể truy cập từ JavaScript
- **Secure flag**: Chỉ gửi qua HTTPS
- **SameSite**: Chống CSRF attacks
- **Auto expiry**: Token tự động hết hạn

### 🔄 **Fallback mechanism:**
- Nếu cookies bị disable, vẫn có localStorage backup
- Tương thích với old browsers

### 🌐 **Cross-subdomain support:**
- Có thể share cookies giữa các subdomain
- Hữu ích cho multi-domain architecture

## ⚙️ API Integration

### WebSocket Authentication:
```javascript
// Update WebSocketContext để sử dụng token từ cookies
const client = new Client({
  brokerURL: 'ws://localhost:8080/ws',
  connectHeaders: {
    'Authorization': `Bearer ${authService.getToken()}`
  }
})
```

### REST API Headers:
```javascript
// api.js interceptor tự động thêm token từ cookies
api.interceptors.request.use((config) => {
  const token = Cookies.get('token') || localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

## 🧪 Testing với Cookies

### Browser DevTools:
1. Mở **Application tab**
2. Chọn **Cookies** → `http://localhost:5173`
3. Xem `token` và `refreshToken` cookies

### Postman Testing:
```javascript
// Pre-request script để lấy token từ cookies
const token = pm.cookies.get('token')
if (token) {
  pm.globals.set('jwt_token', token)
}
```

## 🚀 Production Considerations

### HTTPS Required:
```javascript
// Production env variables
VITE_API_BASE_URL=https://api.qm-bookstore.com
VITE_ENABLE_SECURE_COOKIES=true
```

### Backend CORS Configuration:
```java
// Cho phép credentials trong CORS
@CrossOrigin(origins = "https://qm-bookstore.com", allowCredentials = "true")
```

### Cookie Domain Setup:
```javascript
// Cho subdomain sharing
Cookies.set('token', accessToken, {
  domain: '.qm-bookstore.com',  // Share với subdomain
  secure: true,
  sameSite: 'strict'
})
```

## 🔍 Debugging & Monitoring

### Check Authentication Status:
```javascript
console.log('Cookie token:', Cookies.get('token'))
console.log('LocalStorage token:', localStorage.getItem('token'))
console.log('Is authenticated:', authService.isAuthenticated())
```

### Cookie Expiry Monitoring:
```javascript
// Kiểm tra thời gian expire của cookie
const cookieValue = Cookies.get('token')
if (!cookieValue) {
  console.log('Token cookie has expired or doesn\'t exist')
}
```

## 🛡️ Security Best Practices

### 1. **Token Rotation:**
- Implement refresh token mechanism
- Short-lived access tokens (15-30 mins)
- Long-lived refresh tokens (7-30 days)

### 2. **XSS Protection:**
- Sanitize user inputs
- Use Content Security Policy (CSP)
- Regular security audits

### 3. **CSRF Protection:**
- SameSite cookie attribute
- CSRF tokens for sensitive operations
- Validate Origin headers

## 📝 Migration Notes

### Từ localStorage sang Cookies:
1. ✅ Backup compatibility maintained
2. ✅ No breaking changes cho existing users
3. ✅ Gradual migration approach
4. ✅ Enhanced security

### Testing Checklist:
- [ ] Login/logout functionality
- [ ] Token persistence across browser refresh
- [ ] WebSocket authentication
- [ ] API calls with cookies
- [ ] Cross-browser compatibility
- [ ] HTTPS production deployment

## 🔧 Troubleshooting

### Common Issues:

**Cookie not set:**
- Check browser cookie settings
- Verify HTTPS in production
- Check domain configuration

**Token not found:**
- Fallback to localStorage working
- Check cookie expiry
- Verify secure flag settings

**WebSocket authentication fails:**
- Update connectHeaders with new getToken method
- Check token format in headers
- Verify backend CORS settings