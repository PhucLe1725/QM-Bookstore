# 🔐 Chức năng Đổi Mật Khẩu - Implementation Guide

## 📋 Tổng quan

Tài liệu này hướng dẫn triển khai chức năng đổi mật khẩu cho cả **Customer** và **Admin** trong hệ thống QM Bookstore.

### Phân biệt 2 API:

| Đặc điểm | Customer API | Admin API |
|----------|-------------|-----------|
| **Endpoint** | `POST /api/users/change-password` | `PUT /api/users/update/{id}` |
| **Người dùng** | User tự đổi | Admin đổi cho user khác |
| **Authorization** | Chỉ cần authenticated | `@PreAuthorize("hasRole('ADMIN')")` |
| **Yêu cầu mật khẩu cũ** | ✅ Bắt buộc | ❌ Không cần |
| **Xác nhận mật khẩu mới** | ✅ Bắt buộc | ❌ Không cần |

---

## 🎯 Backend Implementation (Đã hoàn thành)

### 1. DTO Request

**File:** `ChangePasswordRequest.java`

```java
package com.qm.bookstore.qm_bookstore.dto.user.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChangePasswordRequest {
    
    @NotBlank(message = "Current password is required")
    String currentPassword;
    
    @NotBlank(message = "New password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    String newPassword;
    
    @NotBlank(message = "Confirm password is required")
    String confirmPassword;
}
```

### 2. Error Codes

**File:** `ErrorCode.java` (Đã thêm)

```java
WRONG_PASSWORD(1007, "Current password is incorrect"),
PASSWORD_NOT_MATCH(1008, "New password and confirm password do not match"),
```

### 3. Service Layer

**File:** `UserService.java`

```java
public void changePassword(UUID userId, ChangePasswordRequest request) {
    log.info("[changePassword] User {} attempting to change password", userId);
    
    // Tìm user
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    
    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    
    // 1. Verify current password
    if (!encoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
        log.warn("[changePassword] User {} provided incorrect current password", userId);
        throw new AppException(ErrorCode.WRONG_PASSWORD);
    }
    
    // 2. Verify confirm password
    if (!request.getNewPassword().equals(request.getConfirmPassword())) {
        log.warn("[changePassword] User {} password confirmation does not match", userId);
        throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
    }
    
    // 3. Update password
    user.setPasswordHash(encoder.encode(request.getNewPassword()));
    user.setUpdatedAt(LocalDateTime.now());
    userRepository.save(user);
    
    log.info("[changePassword] User {} successfully changed password", userId);
}
```

### 4. Controller Layer

**File:** `UserController.java`

```java
/**
 * Đổi mật khẩu (Customer/User tự đổi)
 * POST /api/users/change-password
 * Requires: JWT token (authenticated user)
 */
@PostMapping("/change-password")
public ApiResponse<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    UUID userId = UUID.fromString(authentication.getName());
    
    log.info("[changePassword] User {} requesting password change", userId);
    userService.changePassword(userId, request);
    
    return ApiResponse.<String>builder()
            .success(true)
            .code(200)
            .message("Password changed successfully")
            .result("Your password has been updated. Please login again with your new password.")
            .build();
}
```

---

## 🎨 Frontend Implementation Guide

### 1. API Service (TypeScript/JavaScript)

```typescript
// services/userService.ts

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  result: T;
}

export const changePassword = async (
  data: ChangePasswordRequest
): Promise<ApiResponse<string>> => {
  const accessToken = localStorage.getItem('accessToken');
  
  const response = await fetch('/api/users/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change password');
  }

  return response.json();
};
```

### 2. React Component Example

```tsx
// components/ChangePasswordForm.tsx
import React, { useState } from 'react';
import { changePassword } from '../services/userService';

export const ChangePasswordForm: React.FC = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await changePassword(formData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Optional: Logout and redirect to login
      setTimeout(() => {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="change-password-form">
      <h2>Change Password</h2>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      {success && (
        <div className="alert alert-success">
          Password changed successfully! Redirecting to login...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
            minLength={6}
            className="form-control"
          />
          <small className="form-text text-muted">
            Password must be at least 6 characters
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};
```

### 3. Vue.js Example

```vue
<!-- components/ChangePasswordForm.vue -->
<template>
  <div class="change-password-form">
    <h2>Đổi mật khẩu</h2>
    
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">
      Đổi mật khẩu thành công! Đang chuyển đến trang đăng nhập...
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="currentPassword">Mật khẩu hiện tại</label>
        <input
          type="password"
          id="currentPassword"
          v-model="form.currentPassword"
          required
          class="form-control"
        />
      </div>

      <div class="form-group">
        <label for="newPassword">Mật khẩu mới</label>
        <input
          type="password"
          id="newPassword"
          v-model="form.newPassword"
          required
          minlength="6"
          class="form-control"
        />
        <small class="form-text text-muted">
          Mật khẩu phải có ít nhất 6 ký tự
        </small>
      </div>

      <div class="form-group">
        <label for="confirmPassword">Xác nhận mật khẩu mới</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="form.confirmPassword"
          required
          class="form-control"
        />
      </div>

      <button 
        type="submit" 
        :disabled="loading"
        class="btn btn-primary"
      >
        {{ loading ? 'Đang xử lý...' : 'Đổi mật khẩu' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { changePassword } from '@/services/userService';
import { useRouter } from 'vue-router';

const router = useRouter();

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const loading = ref(false);
const error = ref('');
const success = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';
  success.value = false;

  try {
    await changePassword(form.value);
    success.value = true;
    
    // Reset form
    form.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    // Redirect to login after 2 seconds
    setTimeout(() => {
      localStorage.removeItem('accessToken');
      router.push('/login');
    }, 2000);

  } catch (err: any) {
    error.value = err.message || 'Đã xảy ra lỗi';
  } finally {
    loading.value = false;
  }
};
</script>
```

---

## 🎯 UI/UX Recommendations

### 1. Đặt nút "Change Password" ở đâu?

**Trang Profile/Settings của Customer:**

```
┌─────────────────────────────────────────┐
│  Customer Dashboard                     │
├─────────────────────────────────────────┤
│                                         │
│  [Profile] [Orders] [Wishlist]          │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Personal Information             │ │
│  │  ─────────────────────────────   │ │
│  │  Name: John Doe                   │ │
│  │  Email: john@example.com          │ │
│  │  Phone: 0123456789                │ │
│  │                                   │ │
│  │  [Edit Profile]                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Security                         │ │
│  │  ─────────────────────────────   │ │
│  │  Password: ••••••••••             │ │
│  │                                   │ │
│  │  [Change Password] ←────────────  │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 2. Validation Rules (Frontend)

```typescript
const validatePassword = (formData: ChangePasswordRequest): string[] => {
  const errors: string[] = [];

  // Check if new password is same as current
  if (formData.newPassword === formData.currentPassword) {
    errors.push('New password must be different from current password');
  }

  // Check password length
  if (formData.newPassword.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  // Check if passwords match
  if (formData.newPassword !== formData.confirmPassword) {
    errors.push('Passwords do not match');
  }

  // Optional: Check password strength
  const hasUpperCase = /[A-Z]/.test(formData.newPassword);
  const hasLowerCase = /[a-z]/.test(formData.newPassword);
  const hasNumber = /\d/.test(formData.newPassword);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    errors.push('Password should contain uppercase, lowercase, and numbers');
  }

  return errors;
};
```

### 3. Error Handling

```typescript
const handleError = (error: any) => {
  const errorCode = error.response?.data?.code;
  
  switch (errorCode) {
    case 1007: // WRONG_PASSWORD
      return 'Current password is incorrect';
    case 1008: // PASSWORD_NOT_MATCH
      return 'New password and confirm password do not match';
    case 1001: // USER_NOT_FOUND
      return 'User not found. Please login again';
    default:
      return 'An error occurred. Please try again';
  }
};
```

---

## 🧪 Testing Guide

### 1. Test với Postman

**Endpoint:** `POST http://localhost:8080/api/users/change-password`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {your_jwt_token}
```

**Body (Success Case):**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456",
  "confirmPassword": "newpassword456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Password changed successfully",
  "result": "Your password has been updated. Please login again with your new password."
}
```

**Body (Wrong Current Password):**
```json
{
  "currentPassword": "wrongpassword",
  "newPassword": "newpassword456",
  "confirmPassword": "newpassword456"
}
```

**Expected Error Response:**
```json
{
  "success": false,
  "code": 1007,
  "message": "Current password is incorrect"
}
```

**Body (Password Mismatch):**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456",
  "confirmPassword": "differentpassword"
}
```

**Expected Error Response:**
```json
{
  "success": false,
  "code": 1008,
  "message": "New password and confirm password do not match"
}
```

### 2. Test Scenarios

| Scenario | Input | Expected Result |
|----------|-------|-----------------|
| ✅ Success | Valid current + matching new passwords | 200 OK |
| ❌ Wrong current password | Incorrect currentPassword | 1007 Error |
| ❌ Passwords don't match | newPassword ≠ confirmPassword | 1008 Error |
| ❌ Password too short | newPassword < 6 chars | Validation error |
| ❌ No authentication | Missing JWT token | 401 Unauthorized |

---

## 🔒 Security Considerations

### 1. Password Requirements (Backend đã có)
- ✅ Minimum 6 characters
- ✅ Must verify current password
- ✅ Passwords are hashed with BCrypt
- ✅ User can only change their own password

### 2. Security Best Practices
- ✅ Always require current password
- ✅ Log password change activities
- ✅ Force re-login after password change
- ✅ Rate limiting (recommend adding)
- ✅ Email notification (recommend adding)

### 3. Recommended Enhancements

```java
// TODO: Add these features later
// 1. Email notification after password change
// 2. Rate limiting (max 3 attempts per 15 minutes)
// 3. Password history (prevent reusing last 5 passwords)
// 4. Password strength meter
```

---

## 📱 Mobile App Integration

### React Native Example

```typescript
import { Alert } from 'react-native';

const handleChangePassword = async (formData: ChangePasswordRequest) => {
  try {
    const response = await changePassword(formData);
    
    Alert.alert(
      'Success',
      'Password changed successfully!',
      [
        {
          text: 'OK',
          onPress: () => {
            // Clear token and navigate to login
            AsyncStorage.removeItem('accessToken');
            navigation.navigate('Login');
          }
        }
      ]
    );
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

---

## 🎉 Summary

### Backend Files Modified/Created:
1. ✅ `ChangePasswordRequest.java` - Created
2. ✅ `ErrorCode.java` - Added 2 new error codes
3. ✅ `UserService.java` - Added `changePassword()` method
4. ✅ `UserController.java` - Added `/change-password` endpoint

### Frontend Tasks:
1. ⏳ Create Change Password Form component
2. ⏳ Add to User Settings/Profile page
3. ⏳ Implement API service call
4. ⏳ Add error handling and validation
5. ⏳ Test all scenarios

### Admin Alternative:
- Admin có thể dùng endpoint cũ: `PUT /api/users/update/{id}` với body `{"password": "new_password"}` để đổi mật khẩu cho user mà không cần mật khẩu cũ.

---

## 📞 Support

Nếu có vấn đề trong quá trình triển khai:
1. Check logs: `backend/logs/application.log`
2. Test with Postman first
3. Verify JWT token is valid
4. Check error codes in response

Good luck! 🚀
