# User Profile API Documentation

## Tổng quan

API cho phép người dùng (customer, admin, manager) quản lý thông tin cá nhân của họ. Các endpoint profile cho phép user xem và cập nhật một số trường thông tin được phép thay đổi.

**Base URL:** `http://localhost:8080/api/users`

---

## 🔐 Authentication

Tất cả endpoint `/api/users/profile/**` yêu cầu JWT token trong header:

```
Authorization: Bearer <jwt_token>
```

---

## 📋 API Endpoints

### 1. Get My Profile

Lấy thông tin profile của user hiện tại.

**Endpoint:** `GET /api/users/profile/me`

**Authentication:** Required (tất cả user đã đăng nhập)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "code": 1000,
  "message": "Success",
  "result": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "john_doe",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "0912345678",
    "address": "123 Main St, Hanoi",
    "roleId": 1,
    "roleName": "customer",
    "status": true,
    "points": 150,
    "balance": 500000.00,
    "totalPurchase": 2500000.00,
    "membershipLevel": "SILVER",
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-11-17T14:20:00"
  }
}
```

**Response Error (401 Unauthorized):**
```json
{
  "success": false,
  "code": 401,
  "message": "Unauthorized - Invalid or missing token"
}
```

**Response Error (404 Not Found):**
```json
{
  "success": false,
  "code": 1005,
  "message": "User not found"
}
```

---

### 2. Update My Profile

Cập nhật thông tin profile của user hiện tại. Chỉ cho phép cập nhật các trường: `fullName`, `phoneNumber`, `address`, `email`.

**Endpoint:** `PUT /api/users/profile/update`

**Authentication:** Required (tất cả user đã đăng nhập)

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "John Doe Updated",
  "phoneNumber": "0987654321",
  "address": "456 New Street, Ho Chi Minh City",
  "email": "john.updated@example.com"
}
```

**Notes:**
- Tất cả các trường đều optional - chỉ gửi các trường cần update
- Không thể thay đổi: `username`, `password`, `roleId`, `status`, `points`, `balance`, `totalPurchase`, `membershipLevel`
- Nếu muốn thay đổi mật khẩu, cần API riêng (change password)

**Example - Update only phone and address:**
```json
{
  "phoneNumber": "0901234567",
  "address": "789 Another Road, Da Nang"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "code": 1000,
  "message": "Success",
  "result": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "john_doe",
    "fullName": "John Doe Updated",
    "email": "john.updated@example.com",
    "phoneNumber": "0987654321",
    "address": "456 New Street, Ho Chi Minh City",
    "roleId": 1,
    "roleName": "customer",
    "status": true,
    "points": 150,
    "balance": 500000.00,
    "totalPurchase": 2500000.00,
    "membershipLevel": "SILVER",
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-11-17T15:30:00"
  }
}
```

**Response Error (401 Unauthorized):**
```json
{
  "success": false,
  "code": 401,
  "message": "Unauthorized - Invalid or missing token"
}
```

**Response Error (404 Not Found):**
```json
{
  "success": false,
  "code": 1005,
  "message": "User not found"
}
```

---

## 🔒 Security Configuration

### Endpoint Access Control

```java
// In SecurityConfig.java
.requestMatchers("/api/users/profile/**").authenticated()  // Tất cả user đã login
.requestMatchers("/api/users/**").hasRole("admin")         // Các endpoint khác chỉ admin
```

### Authorization Rules

| Endpoint Pattern | Required Role | Description |
|-----------------|---------------|-------------|
| `/api/users/profile/me` | Any authenticated user | Get own profile |
| `/api/users/profile/update` | Any authenticated user | Update own profile |
| `/api/users/**` (other) | ADMIN only | Admin user management |

---

## 💻 Frontend Integration Examples

### React/JavaScript Example

#### 1. Get My Profile

```javascript
import axios from 'axios';

const getMyProfile = async () => {
  try {
    const token = localStorage.getItem('jwt_token');
    const response = await axios.get(
      'http://localhost:8080/api/users/profile/me',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (response.data.success) {
      console.log('User Profile:', response.data.result);
      return response.data.result;
    }
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
  }
};
```

#### 2. Update My Profile

```javascript
const updateMyProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('jwt_token');
    const response = await axios.put(
      'http://localhost:8080/api/users/profile/update',
      profileData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('Profile updated successfully:', response.data.result);
      return response.data.result;
    }
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};

// Usage
updateMyProfile({
  fullName: 'John Doe Updated',
  phoneNumber: '0987654321',
  address: '456 New Street, HCMC'
});
```

#### 3. Complete Profile Component (React)

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    email: ''
  });

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await axios.get(
        'http://localhost:8080/api/users/profile/me',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        const userData = response.data.result;
        setProfile(userData);
        setFormData({
          fullName: userData.fullName || '',
          phoneNumber: userData.phoneNumber || '',
          address: userData.address || '',
          email: userData.email || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      alert('Không thể tải thông tin profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await axios.put(
        'http://localhost:8080/api/users/profile/update',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setProfile(response.data.result);
        setEditing(false);
        alert('Cập nhật profile thành công!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Cập nhật profile thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original profile data
    setFormData({
      fullName: profile.fullName || '',
      phoneNumber: profile.phoneNumber || '',
      address: profile.address || '',
      email: profile.email || ''
    });
    setEditing(false);
  };

  if (loading && !profile) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="user-profile">
      <h2>Thông tin cá nhân</h2>

      {!editing ? (
        // View Mode
        <div className="profile-view">
          <div className="profile-item">
            <label>Username:</label>
            <span>{profile?.username}</span>
          </div>
          <div className="profile-item">
            <label>Họ và tên:</label>
            <span>{profile?.fullName || 'Chưa cập nhật'}</span>
          </div>
          <div className="profile-item">
            <label>Email:</label>
            <span>{profile?.email || 'Chưa cập nhật'}</span>
          </div>
          <div className="profile-item">
            <label>Số điện thoại:</label>
            <span>{profile?.phoneNumber || 'Chưa cập nhật'}</span>
          </div>
          <div className="profile-item">
            <label>Địa chỉ:</label>
            <span>{profile?.address || 'Chưa cập nhật'}</span>
          </div>
          <div className="profile-item">
            <label>Vai trò:</label>
            <span className="role-badge">{profile?.roleName}</span>
          </div>
          <div className="profile-item">
            <label>Điểm tích lũy:</label>
            <span>{profile?.points} điểm</span>
          </div>
          <div className="profile-item">
            <label>Hạng thành viên:</label>
            <span className="membership-badge">{profile?.membershipLevel}</span>
          </div>

          <button
            className="btn-edit"
            onClick={() => setEditing(true)}
          >
            Chỉnh sửa thông tin
          </button>
        </div>
      ) : (
        // Edit Mode
        <form onSubmit={handleSubmit} className="profile-edit">
          <div className="form-group">
            <label>Username (không thể thay đổi):</label>
            <input
              type="text"
              value={profile?.username}
              disabled
              className="input-disabled"
            />
          </div>

          <div className="form-group">
            <label>Họ và tên:</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Nhập họ và tên"
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Nhập email"
            />
          </div>

          <div className="form-group">
            <label>Số điện thoại:</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Nhập số điện thoại (10-15 số)"
              pattern="[0-9]{10,15}"
            />
          </div>

          <div className="form-group">
            <label>Địa chỉ:</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Nhập địa chỉ"
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-save"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default UserProfile;
```

#### 4. CSS Styling

```css
.user-profile {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-profile h2 {
  margin-bottom: 24px;
  color: #333;
  font-size: 24px;
}

.profile-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.profile-item label {
  font-weight: 600;
  color: #666;
  min-width: 150px;
}

.profile-item span {
  color: #333;
  text-align: right;
}

.role-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.membership-badge {
  background: #fff3e0;
  color: #f57c00;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.btn-edit {
  margin-top: 24px;
  padding: 12px 24px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.btn-edit:hover {
  background: #1565c0;
}

.profile-edit {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1976d2;
}

.input-disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-save,
.btn-cancel {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.btn-save {
  background: #4caf50;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #45a049;
}

.btn-cancel {
  background: #f44336;
  color: white;
}

.btn-cancel:hover:not(:disabled) {
  background: #da190b;
}

.btn-save:disabled,
.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 48px;
  color: #666;
}
```

---

## 🔍 Testing

### Using cURL

#### 1. Get My Profile
```bash
curl -X GET http://localhost:8080/api/users/profile/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Update My Profile
```bash
curl -X PUT http://localhost:8080/api/users/profile/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe Updated",
    "phoneNumber": "0987654321",
    "address": "456 New Street, HCMC",
    "email": "john.updated@example.com"
  }'
```

### Using Postman

#### Setup
1. Create a new request collection for "User Profile"
2. Add environment variable: `jwt_token`
3. Set base URL: `http://localhost:8080`

#### Get My Profile
- **Method:** GET
- **URL:** `{{baseUrl}}/api/users/profile/me`
- **Headers:**
  - `Authorization: Bearer {{jwt_token}}`

#### Update My Profile
- **Method:** PUT
- **URL:** `{{baseUrl}}/api/users/profile/update`
- **Headers:**
  - `Authorization: Bearer {{jwt_token}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "fullName": "Test User Updated",
  "phoneNumber": "0901234567",
  "address": "Test Address"
}
```

---

## ⚠️ Important Notes

### Fields That CAN Be Updated
- ✅ `fullName` - Họ và tên
- ✅ `phoneNumber` - Số điện thoại
- ✅ `address` - Địa chỉ
- ✅ `email` - Email

### Fields That CANNOT Be Updated via Profile Update
- ❌ `username` - Username (không thể thay đổi)
- ❌ `password` - Mật khẩu (cần API riêng: change password)
- ❌ `roleId` / `roleName` - Vai trò (chỉ admin có thể thay đổi)
- ❌ `status` - Trạng thái tài khoản (chỉ admin)
- ❌ `points` - Điểm tích lũy (tự động tính từ hệ thống)
- ❌ `balance` - Số dư (thông qua payment)
- ❌ `totalPurchase` - Tổng mua hàng (tự động tính từ orders)
- ❌ `membershipLevel` - Hạng thành viên (tự động tính từ totalPurchase)

### Security Considerations

1. **Authentication Required:** Tất cả endpoint đều yêu cầu JWT token hợp lệ
2. **User Isolation:** User chỉ có thể xem và cập nhật profile của chính họ
3. **Admin Separation:** Admin có endpoints riêng tại `/api/users/**` (không phải `/profile/**`)
4. **Token Validation:** Server tự động lấy username từ JWT token, không dựa vào client input

---

## 🔄 Related APIs

### For Admin Users

Admin có thể sử dụng các endpoint sau để quản lý users:

- `GET /api/users/getAll` - Lấy tất cả users
- `GET /api/users/getById/{id}` - Lấy user theo ID
- `PUT /api/users/update/{id}` - Cập nhật toàn bộ thông tin user (bao gồm role, status, points, etc.)
- `DELETE /api/users/delete/{id}` - Xóa user

### For Password Change

Nếu cần API đổi mật khẩu, cần tạo endpoint riêng:
- `PUT /api/users/profile/change-password`

Request body:
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password",
  "confirmPassword": "new_password"
}
```

---

## 📊 Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 1000 | Success | Request thành công |
| 1005 | User not found | Không tìm thấy user |
| 401 | Unauthorized | Token không hợp lệ hoặc hết hạn |
| 403 | Forbidden | Không có quyền truy cập |
| 500 | Internal Server Error | Lỗi server |

---

## 📝 Version History

**Version 1.0** (17/11/2024)
- ✅ Created profile endpoints for authenticated users
- ✅ GET /api/users/profile/me - Get own profile
- ✅ PUT /api/users/profile/update - Update allowed fields only
- ✅ Security configuration updated
- ✅ Separated customer profile APIs from admin user management APIs

---

## 📄 License

Internal Documentation - QM Bookstore Project
