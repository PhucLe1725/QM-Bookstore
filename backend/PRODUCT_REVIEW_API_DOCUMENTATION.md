# Product Review API Documentation

## Tổng quan

API quản lý đánh giá sản phẩm (Product Review) cho phép khách hàng đánh giá và nhận xét về sản phẩm đã mua. Hệ thống tự động gửi thông báo cho admin/manager khi có đánh giá mới.

**Base URL:** `http://localhost:8080/api/product-reviews`

**Ngày tạo:** 18/11/2025  
**Version:** 1.0

---

## 🎯 Tính năng

### Core Features
- ✅ Customer có thể tạo review cho sản phẩm (1 user chỉ review 1 lần/sản phẩm)
- ✅ Customer có thể cập nhật và xóa review của mình
- ✅ Xem tất cả reviews của một sản phẩm
- ✅ Xem thống kê rating (trung bình, tổng số reviews)
- ✅ Admin/Manager nhận thông báo real-time qua WebSocket
- ✅ Admin/Manager nhận thông báo lưu trong database

### Notification System
- 🔔 **WebSocket Real-time:** Thông báo tức thì khi có review mới
- 💾 **Database Persistence:** Lưu thông báo để xem lại sau
- 📊 **Review Stats:** Tính toán trung bình rating tự động

---

## 📊 Database Schema

### ProductReview Table

```sql
CREATE TABLE product_reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    user_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (product_id, user_id)  -- Mỗi user chỉ review 1 lần/sản phẩm
);

CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_created_at ON product_reviews(created_at);
```

### Notification Type

```java
public enum NotificationType {
    // ... existing types
    NEW_REVIEW("NEW_REVIEW");  // ← MỚI: Khi có review mới từ customer
}
```

---

## 🔐 Authentication & Authorization

### Endpoint Access Control

| Endpoint | Required Auth | Role | Description |
|----------|--------------|------|-------------|
| `POST /api/product-reviews` | ✅ Yes | Customer | Tạo review mới |
| `PUT /api/product-reviews/{id}` | ✅ Yes | Owner | Cập nhật review của mình |
| `DELETE /api/product-reviews/{id}` | ✅ Yes | Owner/Admin | Xóa review |
| `GET /api/product-reviews/product/{productId}` | ❌ No | Public | Xem tất cả reviews của sản phẩm |
| `GET /api/product-reviews/my-reviews` | ✅ Yes | Authenticated | Xem reviews của mình |
| `GET /api/product-reviews/stats/product/{productId}` | ❌ No | Public | Xem thống kê reviews |

---

## 📡 API Endpoints

### 1. Create Review (Tạo đánh giá mới)

**POST** `/api/product-reviews`

**Authentication:** Required (Customer)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": 10,
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "rating": 5,
  "content": "Sản phẩm rất tốt, đóng gói cẩn thận, giao hàng nhanh!"
}
```

**Field Validation:**
- `productId` (required): ID sản phẩm
- `userId` (required): ID người dùng
- `rating` (required): Đánh giá từ 1-5 sao
- `content` (optional): Nội dung review (TEXT)

**Response Success (200):**
```json
{
  "success": true,
  "code": 1000,
  "message": "Success",
  "result": {
    "id": 1,
    "productId": 10,
    "productName": "Spring Boot Complete Guide",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "username": "john_doe",
    "fullName": "John Doe",
    "rating": 5,
    "content": "Sản phẩm rất tốt, đóng gói cẩn thận, giao hàng nhanh!",
    "createdAt": "2025-11-18T10:30:00"
  }
}
```

**Response Error (3102 - Already Reviewed):**
```json
{
  "success": false,
  "code": 3102,
  "message": "You have already reviewed this product"
}
```

**Response Error (3103 - Invalid Rating):**
```json
{
  "success": false,
  "code": 3103,
  "message": "Rating must be between 1 and 5"
}
```

**Side Effects:**
- 📤 Gửi WebSocket notification đến tất cả admin/manager
- 💾 Lưu notification vào database cho từng admin/manager

---

### 2. Update Review (Cập nhật đánh giá)

**PUT** `/api/product-reviews/{id}`

**Authentication:** Required (Owner of review)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (Long): ID của review cần update

**Request Body:**
```json
{
  "rating": 4,
  "content": "Sản phẩm tốt nhưng giao hàng hơi lâu"
}
```

**Note:** Tất cả fields đều optional - chỉ gửi fields cần update

**Response Success (200):**
```json
{
  "success": true,
  "code": 1000,
  "message": "Success",
  "result": {
    "id": 1,
    "productId": 10,
    "productName": "Spring Boot Complete Guide",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "username": "john_doe",
    "fullName": "John Doe",
    "rating": 4,
    "content": "Sản phẩm tốt nhưng giao hàng hơi lâu",
    "createdAt": "2025-11-18T10:30:00"
  }
}
```

**Response Error (3101 - Not Found):**
```json
{
  "success": false,
  "code": 3101,
  "message": "Review not found"
}
```

---

### 3. Delete Review (Xóa đánh giá)

**DELETE** `/api/product-reviews/{id}`

**Authentication:** Required (Owner or Admin)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `id` (Long): ID của review cần xóa

**Response Success (200):**
```json
{
  "success": true,
  "code": 1000,
  "message": "Success",
  "result": "Review deleted successfully"
}
```

---

### 4. Get Review by ID

**GET** `/api/product-reviews/{id}`

**Authentication:** Not required

**Path Parameters:**
- `id` (Long): ID của review

**Response Success (200):**
```json
{
  "success": true,
  "code": 1000,
  "message": "Success",
  "result": {
    "id": 1,
    "productId": 10,
    "productName": "Spring Boot Complete Guide",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "username": "john_doe",
    "fullName": "John Doe",
    "rating": 5,
    "content": "Sản phẩm rất tốt!",
    "createdAt": "2025-11-18T10:30:00"
  }
}
```

---

### 5. Get Reviews by Product ID

**GET** `/api/product-reviews/product/{productId}`

**Authentication:** Not required

**Path Parameters:**
- `productId` (Long): ID của sản phẩm

**Response Success (200):**
```json
{
  "success": true,
  "code": 1000,
  "message": "Success",
  "result": [
    {
      "id": 1,
      "productId": 10,
      "productName": "Spring Boot Complete Guide",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "username": "john_doe",
      "fullName": "John Doe",
      "rating": 5,
      "content": "Sản phẩm rất tốt!",
      "createdAt": "2025-11-18T10:30:00"
    },
    {
      "id": 2,
      "productId": 10,
      "productName": "Spring Boot Complete Guide",
      "userId": "987e6543-e21c-12d3-a456-426614174001",
      "username": "jane_smith",
      "fullName": "Jane Smith",
      "rating": 4,
      "content": "Khá tốt, đáng mua",
      "createdAt": "2025-11-17T15:20:00"
    }
  ]
}
```

**Note:** Reviews được sắp xếp theo `createdAt DESC` (mới nhất trước)

---

### 6. Get Reviews by User ID

**GET** `/api/product-reviews/user/{userId}`

**Authentication:** Not required

**Path Parameters:**
- `userId` (UUID): ID của user

**Response Success (200):**
```json
{
  "success": true,
  "code": 1000,
  "message": "Success",
  "result": [
    {
      "id": 1,
      "productId": 10,
      "productName": "Spring Boot Complete Guide",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "username": "john_doe",
      "fullName": "John Doe",
      "rating": 5,
      "content": "Sản phẩm rất tốt!",
      "createdAt": "2025-11-18T10:30:00"
    },
    {
      "id": 5,
      "productId": 15,
      "productName": "Java Programming Masterclass",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "username": "john_doe",
      "fullName": "John Doe",
      "rating": 4,
      "content": "Nội dung hay và chi tiết",
      "createdAt": "2025-11-16T09:15:00"
    }
  ]
}
```

---

### 7. Get My Reviews

**GET** `/api/product-reviews/my-reviews`

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** Tương tự endpoint 6 (Get Reviews by User ID)

---

### 8. Get Review Statistics

**GET** `/api/product-reviews/stats/product/{productId}`

**Authentication:** Not required

**Path Parameters:**
- `productId` (Long): ID của sản phẩm

**Response Success (200):**
```json
{
  "success": true,
  "code": 1000,
  "message": "Success",
  "result": {
    "productId": 10,
    "totalReviews": 25,
    "averageRating": 4.3
  }
}
```

**Note:** 
- `averageRating` được làm tròn đến 1 chữ số thập phân
- Nếu chưa có review nào, `averageRating` = 0.0

---

### 9. Get My Review for a Product

**GET** `/api/product-reviews/product/{productId}/my-review`

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `productId` (Long): ID của sản phẩm

**Response Success (200):**
```json
{
  "success": true,
  "code": 1000,
  "message": "Success",
  "result": {
    "id": 1,
    "productId": 10,
    "productName": "Spring Boot Complete Guide",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "username": "john_doe",
    "fullName": "John Doe",
    "rating": 5,
    "content": "Sản phẩm rất tốt!",
    "createdAt": "2025-11-18T10:30:00"
  }
}
```

**Response Error (3101 - Not Found):**
```json
{
  "success": false,
  "code": 3101,
  "message": "Review not found"
}
```

**Use Case:** Kiểm tra xem user đã review sản phẩm này chưa

---

## 🔔 Notification System

### WebSocket Topic

Admin/Manager subscribe topic:
```
/user/{userId}/queue/new-review
```

### WebSocket Message Format

```json
{
  "reviewId": 1,
  "productId": 10,
  "productName": "Spring Boot Complete Guide",
  "username": "john_doe",
  "rating": 5,
  "message": "Khách hàng 'john_doe' đã đánh giá 5 sao sản phẩm 'Spring Boot Complete Guide'",
  "timestamp": "2025-11-18T10:30:00"
}
```

### Database Notification

Notification được lưu với:
- **Type:** `NEW_REVIEW`
- **Message:** "Khách hàng 'username' đã đánh giá X sao sản phẩm 'product name'"
- **Anchor:** `/admin/reviews?productId=10&reviewId=1`
- **Status:** `UNREAD`

---

## 💻 Frontend Integration

### React Example - Product Review Component

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    content: ''
  });

  const token = localStorage.getItem('jwt_token');
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    fetchReviews();
    fetchStats();
    if (token) {
      checkMyReview();
    }
  }, [productId]);

  // Fetch all reviews for product
  const fetchReviews = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/product-reviews/product/${productId}`
      );
      if (response.data.success) {
        setReviews(response.data.result);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  // Fetch review statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/product-reviews/stats/product/${productId}`
      );
      if (response.data.success) {
        setStats(response.data.result);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Check if user already reviewed
  const checkMyReview = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/product-reviews/product/${productId}/my-review`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.data.success) {
        setMyReview(response.data.result);
        setFormData({
          rating: response.data.result.rating,
          content: response.data.result.content
        });
      }
    } catch (error) {
      // User hasn't reviewed yet
      setMyReview(null);
    }
  };

  // Create new review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:8080/api/product-reviews',
        {
          productId: productId,
          userId: userId,
          rating: formData.rating,
          content: formData.content
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('Đánh giá thành công!');
        setMyReview(response.data.result);
        setShowReviewForm(false);
        fetchReviews();
        fetchStats();
      }
    } catch (error) {
      if (error.response?.data?.code === 3102) {
        alert('Bạn đã đánh giá sản phẩm này rồi!');
      } else {
        alert('Đánh giá thất bại!');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update existing review
  const handleUpdateReview = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(
        `http://localhost:8080/api/product-reviews/${myReview.id}`,
        {
          rating: formData.rating,
          content: formData.content
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('Cập nhật đánh giá thành công!');
        setMyReview(response.data.result);
        setShowReviewForm(false);
        fetchReviews();
        fetchStats();
      }
    } catch (error) {
      alert('Cập nhật đánh giá thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // Delete review
  const handleDeleteReview = async () => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    try {
      const response = await axios.delete(
        `http://localhost:8080/api/product-reviews/${myReview.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('Xóa đánh giá thành công!');
        setMyReview(null);
        setFormData({ rating: 5, content: '' });
        fetchReviews();
        fetchStats();
      }
    } catch (error) {
      alert('Xóa đánh giá thất bại!');
    }
  };

  // Render star rating
  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={star <= rating ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="product-reviews">
      <h3>Đánh giá sản phẩm</h3>

      {/* Review Statistics */}
      {stats && (
        <div className="review-stats">
          <div className="average-rating">
            <span className="rating-number">{stats.averageRating}</span>
            {renderStars(Math.round(stats.averageRating))}
            <span className="total-reviews">({stats.totalReviews} đánh giá)</span>
          </div>
        </div>
      )}

      {/* User's Review or Review Button */}
      {token && (
        <div className="my-review-section">
          {myReview && !showReviewForm ? (
            <div className="my-review-card">
              <h4>Đánh giá của bạn</h4>
              {renderStars(myReview.rating)}
              <p>{myReview.content}</p>
              <div className="review-actions">
                <button onClick={() => setShowReviewForm(true)}>Chỉnh sửa</button>
                <button onClick={handleDeleteReview} className="btn-danger">Xóa</button>
              </div>
            </div>
          ) : !myReview && !showReviewForm ? (
            <button onClick={() => setShowReviewForm(true)} className="btn-review">
              Viết đánh giá
            </button>
          ) : null}
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={myReview ? handleUpdateReview : handleSubmitReview} className="review-form">
          <h4>{myReview ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}</h4>
          
          <div className="form-group">
            <label>Đánh giá:</label>
            <div className="star-input">
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  className={star <= formData.rating ? 'star filled clickable' : 'star clickable'}
                  onClick={() => setFormData({...formData, rating: star})}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Nội dung:</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              rows="4"
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : myReview ? 'Cập nhật' : 'Gửi đánh giá'}
            </button>
            <button type="button" onClick={() => setShowReviewForm(false)}>
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* All Reviews List */}
      <div className="reviews-list">
        <h4>Tất cả đánh giá ({reviews.length})</h4>
        {reviews.map(review => (
          <div key={review.id} className="review-card">
            <div className="review-header">
              <span className="reviewer-name">{review.fullName || review.username}</span>
              {renderStars(review.rating)}
              <span className="review-date">
                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <p className="review-content">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductReviews;
```

### CSS Styling

```css
.product-reviews {
  max-width: 800px;
  margin: 24px auto;
  padding: 24px;
}

.review-stats {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.average-rating {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating-number {
  font-size: 36px;
  font-weight: bold;
  color: #f59e0b;
}

.stars {
  display: flex;
  gap: 4px;
}

.star {
  font-size: 24px;
  color: #d1d5db;
}

.star.filled {
  color: #f59e0b;
}

.star.clickable {
  cursor: pointer;
  transition: transform 0.2s;
}

.star.clickable:hover {
  transform: scale(1.2);
}

.total-reviews {
  color: #6b7280;
  font-size: 14px;
}

.my-review-section {
  margin-bottom: 24px;
}

.my-review-card {
  background: #eff6ff;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.my-review-card h4 {
  margin: 0 0 8px 0;
  color: #1e40af;
}

.review-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn-review {
  background: #3b82f6;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.btn-review:hover {
  background: #2563eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.review-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.review-form h4 {
  margin-top: 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
}

.star-input {
  display: flex;
  gap: 8px;
  font-size: 32px;
}

.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.form-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.form-actions button[type="submit"] {
  background: #10b981;
  color: white;
}

.form-actions button[type="submit"]:hover:not(:disabled) {
  background: #059669;
}

.form-actions button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions button[type="button"] {
  background: #6b7280;
  color: white;
}

.reviews-list {
  margin-top: 32px;
}

.reviews-list h4 {
  margin-bottom: 16px;
  color: #111827;
}

.review-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.reviewer-name {
  font-weight: 600;
  color: #111827;
}

.review-date {
  margin-left: auto;
  font-size: 14px;
  color: #6b7280;
}

.review-content {
  color: #374151;
  line-height: 1.6;
  margin: 0;
}
```

### WebSocket Integration for Admin (React)

```jsx
import { useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { toast } from 'react-toastify';

function useReviewNotifications(userId) {
  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);

    client.connect(
      { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` },
      () => {
        // Subscribe to new review notifications
        client.subscribe(`/user/${userId}/queue/new-review`, (message) => {
          const notification = JSON.parse(message.body);
          
          // Show toast notification
          toast.info(
            <div>
              <strong>⭐ Đánh giá mới!</strong>
              <p>{notification.message}</p>
              <small>{notification.username} - {notification.rating} sao</small>
            </div>,
            {
              onClick: () => {
                window.location.href = `/admin/reviews?productId=${notification.productId}&reviewId=${notification.reviewId}`;
              }
            }
          );
        });
      }
    );

    return () => {
      if (client && client.connected) {
        client.disconnect();
      }
    };
  }, [userId]);
}

export default useReviewNotifications;
```

---

## 🧪 Testing

### Using cURL

#### 1. Create Review
```bash
curl -X POST http://localhost:8080/api/product-reviews \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 10,
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "rating": 5,
    "content": "Sản phẩm rất tốt!"
  }'
```

#### 2. Get Reviews by Product
```bash
curl -X GET http://localhost:8080/api/product-reviews/product/10
```

#### 3. Get Review Stats
```bash
curl -X GET http://localhost:8080/api/product-reviews/stats/product/10
```

#### 4. Update Review
```bash
curl -X PUT http://localhost:8080/api/product-reviews/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "content": "Cập nhật nội dung đánh giá"
  }'
```

#### 5. Delete Review
```bash
curl -X DELETE http://localhost:8080/api/product-reviews/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ⚠️ Business Rules

### 1. One Review Per User Per Product
- Mỗi user chỉ được review 1 lần cho 1 sản phẩm
- Constraint: `UNIQUE (product_id, user_id)`
- Nếu đã review, phải update hoặc delete review cũ

### 2. Rating Validation
- Rating phải từ 1 đến 5
- Frontend nên hiển thị UI star picker
- Backend validate và throw error nếu không hợp lệ

### 3. Review Ownership
- User chỉ có thể update/delete review của chính họ
- Admin có thể delete bất kỳ review nào
- Cần implement authorization check trong controller

### 4. Notification Recipients
- Chỉ admin và manager nhận thông báo
- Customer không nhận thông báo về reviews của người khác
- Notifications có cả WebSocket (real-time) và Database (history)

---

## 📊 Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 1000 | Success | Request thành công |
| 3001 | Product not found | Không tìm thấy sản phẩm |
| 3101 | Review not found | Không tìm thấy review |
| 3102 | You have already reviewed this product | Đã review sản phẩm này rồi |
| 3103 | Rating must be between 1 and 5 | Rating không hợp lệ |
| 1005 | User not found | Không tìm thấy user |
| 401 | Unauthorized | Token không hợp lệ |

---

## 🚀 Deployment Checklist

- [x] ProductReview entity với User relationship
- [x] ProductReviewRepository với custom queries
- [x] ProductReviewService với notification integration
- [x] ProductReviewController với tất cả endpoints
- [x] ProductReviewMapper cho DTO mapping
- [x] Error codes cho review validation
- [x] NEW_REVIEW notification type
- [x] WebSocket notification cho admin/manager
- [x] Database persistence cho notifications
- [ ] Frontend review component
- [ ] Authorization checks trong controller
- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing

---

## 📚 Related Documentation

- `PRODUCT_API_DOCUMENTATION.md` - Product API documentation
- `COMMENT_NOTIFICATION_DATABASE_INTEGRATION.md` - Comment notification system
- `USER_PROFILE_API_DOCUMENTATION.md` - User profile APIs

---

## 🔄 Future Enhancements

### Potential Features
1. **Review Images:** Cho phép upload ảnh kèm review
2. **Helpful Votes:** User vote review có hữu ích không
3. **Review Replies:** Shop owner reply review của customer
4. **Review Verification:** Chỉ customer đã mua mới review được
5. **Review Moderation:** Admin approve/reject review
6. **Review Analytics:** Dashboard thống kê reviews theo thời gian

---

## 📝 Version History

**Version 1.0** (18/11/2025)
- ✅ CRUD operations cho ProductReview
- ✅ One review per user per product constraint
- ✅ Rating 1-5 validation
- ✅ WebSocket notifications cho admin/manager
- ✅ Database notification persistence
- ✅ Review statistics (average rating, total reviews)
- ✅ Public endpoints cho viewing reviews
- ✅ Authenticated endpoints cho create/update/delete

---

## 📄 License

Internal Documentation - QM Bookstore Project
