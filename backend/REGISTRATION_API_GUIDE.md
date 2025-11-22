# QM Bookstore - Registration API Guide

## Tổng quan

Hệ thống đăng ký tài khoản sử dụng mã OTP gửi qua email để xác thực người dùng. Quy trình gồm 3 bước:

1. **Đăng ký** → Nhận mã OTP qua email
2. **Xác thực OTP** → Kích hoạt tài khoản
3. **Đăng nhập** → Sử dụng tài khoản

---

## API Endpoints

### 1. Đăng ký tài khoản (Register)

**Endpoint:** `POST /api/auth/register`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "phoneNumber": "0123456789",
  "password": "Password123!"
}
```

**Validation Rules:**
- `email`: Định dạng email hợp lệ (bắt buộc)
- `username`: 3-50 ký tự (bắt buộc)
- `phoneNumber`: 10-11 số, bắt đầu bằng 0 (bắt buộc)
- `password`: Tối thiểu 8 ký tự (bắt buộc)

**Response - Success (200):**
```json
{
  "code": 1000,
  "message": "OTP has been sent to your email",
  "result": {
    "email": "user@example.com",
    "expiresIn": "5 minutes"
  }
}
```

**Response - Error:**

*Email đã tồn tại:*
```json
{
  "code": 1002,
  "message": "Email already exists"
}
```

*Username đã tồn tại:*
```json
{
  "code": 1003,
  "message": "Username already exists"
}
```

*Validation error:*
```json
{
  "code": 1001,
  "message": "Invalid input",
  "errors": {
    "email": "Invalid email format",
    "phoneNumber": "Phone number must be 10-11 digits starting with 0"
  }
}
```

*Email gửi thất bại:*
```json
{
  "code": 1013,
  "message": "Failed to send verification email"
}
```

---

### 2. Xác thực OTP (Verify OTP)

**Endpoint:** `POST /api/auth/verify-otp`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

**Validation Rules:**
- `email`: Định dạng email hợp lệ (bắt buộc)
- `otpCode`: 6 chữ số (bắt buộc)

**Response - Success (200):**
```json
{
  "code": 1000,
  "message": "Account verified successfully. You can now login.",
  "result": {
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

**Response - Error:**

*OTP không đúng:*
```json
{
  "code": 1010,
  "message": "Invalid OTP code"
}
```

*OTP hết hạn:*
```json
{
  "code": 1011,
  "message": "OTP has expired. Please request a new one."
}
```

*Không tìm thấy pending user:*
```json
{
  "code": 1012,
  "message": "No pending registration found for this email"
}
```

---

### 3. Gửi lại OTP (Resend OTP)

**Endpoint:** `POST /api/auth/resend-otp`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response - Success (200):**
```json
{
  "code": 1000,
  "message": "New OTP has been sent to your email",
  "result": {
    "email": "user@example.com",
    "expiresIn": "5 minutes"
  }
}
```

**Response - Error:**

*Không tìm thấy pending user:*
```json
{
  "code": 1012,
  "message": "No pending registration found for this email"
}
```

*Email gửi thất bại:*
```json
{
  "code": 1013,
  "message": "Failed to send verification email"
}
```

---

### 4. Đăng nhập (Login)

**Endpoint:** `POST /api/auth/login`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "Password123!"
}
```

**Response - Success (200):**
```json
{
  "code": 1000,
  "message": "Login successful",
  "result": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 36000
  }
}
```

---

## Frontend Implementation Guide

### React Example (với Axios)

#### 1. Setup Axios Instance

```javascript
// src/api/axiosConfig.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
```

#### 2. Registration Service

```javascript
// src/services/authService.js
import axiosInstance from '../api/axiosConfig';

export const authService = {
  // Đăng ký tài khoản
  register: async (data) => {
    try {
      const response = await axiosInstance.post('/api/auth/register', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || { message: 'Network error' }
      };
    }
  },

  // Xác thực OTP
  verifyOtp: async (email, otpCode) => {
    try {
      const response = await axiosInstance.post('/api/auth/verify-otp', {
        email,
        otpCode
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || { message: 'Network error' }
      };
    }
  },

  // Gửi lại OTP
  resendOtp: async (email) => {
    try {
      const response = await axiosInstance.post('/api/auth/resend-otp', { email });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || { message: 'Network error' }
      };
    }
  },

  // Đăng nhập
  login: async (username, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', {
        username,
        password
      });
      
      // Lưu token vào localStorage
      if (response.data.result?.accessToken) {
        localStorage.setItem('accessToken', response.data.result.accessToken);
        localStorage.setItem('refreshToken', response.data.result.refreshToken);
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || { message: 'Network error' }
      };
    }
  }
};
```

#### 3. Registration Component

```jsx
// src/components/RegistrationForm.jsx
import React, { useState } from 'react';
import { authService } from '../services/authService';

const RegistrationForm = () => {
  const [step, setStep] = useState(1); // 1: Register, 2: Verify OTP
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // Step 1: Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const result = await authService.register({
      email: formData.email,
      username: formData.username,
      phoneNumber: formData.phoneNumber,
      password: formData.password
    });

    setLoading(false);

    if (result.success) {
      setSuccess('OTP has been sent to your email!');
      setStep(2); // Move to OTP verification step
    } else {
      setError(result.error.message || 'Registration failed');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otpCode.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);

    const result = await authService.verifyOtp(formData.email, otpCode);

    setLoading(false);

    if (result.success) {
      setSuccess('Account verified successfully! Redirecting to login...');
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else {
      setError(result.error.message || 'OTP verification failed');
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await authService.resendOtp(formData.email);

    setLoading(false);

    if (result.success) {
      setSuccess('New OTP has been sent to your email!');
    } else {
      setError(result.error.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="registration-container">
      <h2>Create Account</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {step === 1 && (
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={50}
              placeholder="johndoe"
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              pattern="0[0-9]{9,10}"
              placeholder="0123456789"
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="Min 8 characters"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter password"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp}>
          <p>We've sent a 6-digit verification code to <strong>{formData.email}</strong></p>
          
          <div className="form-group">
            <label>Enter OTP Code *</label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              placeholder="123456"
              className="otp-input"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div className="resend-section">
            <p>Didn't receive the code?</p>
            <button 
              type="button" 
              onClick={handleResendOtp} 
              disabled={loading}
              className="btn-secondary"
            >
              Resend OTP
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RegistrationForm;
```

#### 4. Login Component

```jsx
// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { authService } from '../services/authService';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authService.login(formData.username, formData.password);

    setLoading(false);

    if (result.success) {
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      setError(result.error.message || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
```

---

## Flow Diagram

```
User
  |
  v
[1] Register (POST /api/auth/register)
  |
  ├─> Email exists? → Error 1002
  ├─> Username exists? → Error 1003
  └─> Success
       |
       v
  [Email sent with 6-digit OTP]
       |
       v
[2] Enter OTP (POST /api/auth/verify-otp)
  |
  ├─> OTP expired? → Error 1011 → Resend OTP
  ├─> OTP invalid? → Error 1010
  └─> Success
       |
       v
  [Account created in users table]
       |
       v
[3] Login (POST /api/auth/login)
  |
  └─> Success → Receive JWT tokens
```

---

## Error Codes Reference

| Code | Message | Description |
|------|---------|-------------|
| 1000 | Success | Thành công |
| 1001 | Invalid input | Dữ liệu không hợp lệ |
| 1002 | Email already exists | Email đã được sử dụng |
| 1003 | Username already exists | Username đã được sử dụng |
| 1010 | Invalid OTP code | Mã OTP không đúng |
| 1011 | OTP has expired | Mã OTP đã hết hạn |
| 1012 | No pending registration found | Không tìm thấy đăng ký chờ xác thực |
| 1013 | Failed to send verification email | Gửi email thất bại |

---

## Testing with Postman/cURL

### 1. Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "phoneNumber": "0123456789",
    "password": "Password123"
  }'
```

### 2. Verify OTP
```bash
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otpCode": "123456"
  }'
```

### 3. Resend OTP
```bash
curl -X POST http://localhost:8080/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### 4. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Password123"
  }'
```

---

## Notes

1. **OTP Expiry:** Mã OTP có hiệu lực trong 5 phút
2. **Password Security:** Mật khẩu được hash bằng BCrypt trước khi lưu
3. **Email Configuration:** Cần cấu hình SMTP trong `application.properties`
4. **Rate Limiting:** Nên implement rate limiting để tránh spam OTP
5. **CORS:** Đã cấu hình cho `localhost:3000` và `localhost:5173`

---

## Email Configuration (Backend)

File: `src/main/resources/application.properties`

```properties
# Email Configuration (Gmail)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

**Lưu ý:** 
- Sử dụng Gmail App Password, không phải mật khẩu thông thường
- Tạo App Password tại: https://myaccount.google.com/apppasswords
