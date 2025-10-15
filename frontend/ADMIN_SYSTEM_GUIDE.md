# 🔐 Admin System Documentation

## 📋 Tổng quan

Hệ thống admin đã được tích hợp vào QM Bookstore với các tính năng:
- **Phân quyền admin**: Chỉ admin mới truy cập được
- **Admin Dashboard**: Giao diện quản lý tổng quan
- **Conditional UI**: Menu "Quản lý" chỉ hiện với admin
- **Protected Routes**: Bảo vệ các route admin

## 🚀 Cách sử dụng

### 1. **Truy cập Admin Dashboard**
```
URL: http://localhost:5173/admin
Hoặc: http://localhost:5173/admin/dashboard
```

### 2. **Điều kiện truy cập**
User phải có một trong các role sau:
- `role: "admin"`
- `role: "ADMIN"`
- `roles: ["admin"]`
- `roles: ["ADMIN"]`
- `isAdmin: true`
- `admin: true`

### 3. **Hiển thị menu Admin**
Menu "Quản lý" sẽ xuất hiện trong dropdown user avatar khi:
- User đã đăng nhập
- User có quyền admin

## 🔧 Cấu trúc Code

### Components:
```
📁 src/
├── 📁 components/
│   └── AdminRoute.jsx          # Protected route cho admin
├── 📁 pages/admin/
│   ├── AdminDashboard.jsx      # Trang chủ admin
│   └── index.js               # Export admin pages
├── 📁 utils/
│   └── adminUtils.js          # Utilities cho admin
└── 📁 layouts/
    └── Header.jsx             # Header với menu admin
```

### Admin Route Protection:
```jsx
<Route path="/admin" element={
  <AdminRoute>
    <AdminDashboard />
  </AdminRoute>
} />
```

### Admin Menu in Header:
```jsx
{isAdmin(user) && (
  <Link to="/admin">
    <span>Quản lý</span>
  </Link>
)}
```

## 🛠️ Admin Utilities

### `isAdmin(user)`
Kiểm tra user có quyền admin:
```javascript
import { isAdmin } from '../utils'

if (isAdmin(user)) {
  // User là admin
}
```

### `hasPermission(user, permission)`
Kiểm tra quyền cụ thể:
```javascript
import { hasPermission } from '../utils'

if (hasPermission(user, 'manage_books')) {
  // User có quyền quản lý sách
}
```

### `formatUserRole(user)`
Format tên role để hiển thị:
```javascript
import { formatUserRole } from '../utils'

const roleDisplay = formatUserRole(user) // "Quản trị viên"
```

## 📊 Admin Dashboard Features

### Statistics Cards:
- Tổng người dùng
- Đơn hàng hôm nay  
- Sách đã bán
- Doanh thu tháng

### Quick Actions:
- Quản lý người dùng
- Quản lý sách
- Đơn hàng
- Tin nhắn hỗ trợ
- Báo cáo & Thống kê
- Cài đặt hệ thống

### Recent Activity:
- Đơn hàng gần đây
- Tin nhắn mới

## 🔐 Security Features

### 1. **Route Protection**
```jsx
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  if (!isAdmin(user)) {
    return <AccessDeniedPage />
  }
  
  return children
}
```

### 2. **Conditional Rendering**
```jsx
// Chỉ hiện menu admin cho admin
{isAdmin(user) && (
  <AdminMenuItems />
)}
```

### 3. **API Integration**
Token admin được tự động gửi trong headers:
```javascript
// api.js
config.headers.Authorization = `Bearer ${token}`
```

## 🧪 Testing Admin Features

### 1. **Test với user thường**
- Không thấy menu "Quản lý"
- Truy cập `/admin` → Trang access denied
- Redirect về trang chủ

### 2. **Test với admin user**
- Thấy menu "Quản lý" trong dropdown
- Truy cập `/admin` → Admin dashboard
- Tất cả admin features hoạt động

### 3. **Test authentication**
- Chưa login → Redirect to `/login`
- Login với user thường → Access denied
- Login với admin → Full access

## 📱 Responsive Design

Admin dashboard responsive trên:
- 📱 Mobile (1 column layout)
- 📟 Tablet (2 columns)
- 💻 Desktop (3-4 columns)

## 🎨 UI/UX Features

### Visual Indicators:
- **Admin badge**: Hiển thị role trong dropdown
- **Shield icon**: Icon bảo mật cho menu admin
- **Color coding**: Màu sắc phân biệt admin/user

### Animations:
- Smooth transitions
- Hover effects
- Loading states

## 🔮 Future Enhancements

### Planned Features:
1. **Role-based permissions**
2. **Admin sub-pages**:
   - User management
   - Book management  
   - Order management
   - Chat management
3. **Advanced analytics**
4. **Admin notifications**
5. **Audit logs**

### API Endpoints (To be implemented):
```
GET /api/admin/stats          # Dashboard statistics
GET /api/admin/users          # User management
GET /api/admin/books          # Book management
GET /api/admin/orders         # Order management
GET /api/admin/messages       # Chat messages
```

## 🐛 Troubleshooting

### Common Issues:

**Menu "Quản lý" không hiện:**
- Kiểm tra user role trong localStorage
- Verify `isAdmin()` function
- Check authentication state

**Access denied khi vào /admin:**
- Kiểm tra AdminRoute component
- Verify role checking logic
- Check API response format

**Admin dashboard không load:**
- Check route configuration
- Verify component imports
- Check browser console for errors

## 📝 Backend Requirements

Để admin system hoạt động hoàn toàn, backend cần:

### 1. **User roles trong JWT token:**
```json
{
  "userId": "123",
  "username": "admin@example.com",
  "role": "admin",
  "permissions": ["admin", "manage_users", "manage_books"]
}
```

### 2. **Admin endpoints protection:**
```java
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/api/admin/stats")
public ResponseEntity<?> getAdminStats() { ... }
```

### 3. **Role validation:**
```java
public boolean isAdmin(User user) {
    return user.getRole().equals("ADMIN") || 
           user.getRoles().contains("ADMIN");
}
```