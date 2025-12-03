# Order API Documentation

## Overview
API documentation for Order and Checkout functionality. Tất cả endpoints yêu cầu authentication (JWT token trong header).

---

## Table of Contents
1. [Checkout - Tạo đơn hàng](#1-checkout---tạo-đơn-hàng)
2. [Get My Orders - Lấy danh sách đơn hàng](#2-get-my-orders---lấy-danh-sách-đơn-hàng)
3. [Get Order Detail - Chi tiết đơn hàng](#3-get-order-detail---chi-tiết-đơn-hàng)
4. [Cancel Order - Hủy đơn hàng](#4-cancel-order---hủy-đơn-hàng)
5. [Reorder - Đặt lại đơn hàng](#5-reorder---đặt-lại-đơn-hàng)
6. [Update Order Status - Admin](#6-update-order-status---admin)
7. [Get All Orders - Admin](#7-get-all-orders---admin)
8. [Data Models](#data-models)
9. [Status Values Reference](#status-values-reference)

---

## 1. Checkout - Tạo đơn hàng

Tạo đơn hàng mới từ các sản phẩm đã chọn trong giỏ hàng.

### Endpoint
```
POST /api/orders/checkout
```

### Headers
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Request Body
```json
{
  "paymentMethod": "prepaid",           // Required: "prepaid" | "cod"
  "fulfillmentMethod": "delivery",      // Required: "delivery" | "pickup"
  "voucherCode": "BLACKFRIDAY2024",     // Optional
  "receiverName": "Nguyễn Văn A",       // Optional (required if delivery)
  "receiverPhone": "0123456789",        // Optional (required if delivery, pattern: 0[0-9]{9,10})
  "receiverAddress": "123 Đường ABC, Quận 1, TP.HCM",  // Optional (required if delivery)
  "shippingFee": 21000.00,              // Optional (calculated from frontend based on distance)
  "note": "Giao hàng giờ hành chính"    // Optional
}
```

### Validation Rules
- `paymentMethod`: Bắt buộc, phải là `"prepaid"` hoặc `"cod"`
- `fulfillmentMethod`: Bắt buộc, phải là `"delivery"` hoặc `"pickup"`
- `receiverPhone`: Nếu có, phải match pattern `0[0-9]{9,10}` (10-11 số, bắt đầu bằng 0)
- Nếu `fulfillmentMethod = "delivery"`: `receiverName`, `receiverPhone`, `receiverAddress` là bắt buộc
- `shippingFee`: Optional, được tính từ frontend dựa trên khoảng cách (15,000đ cho ≤5km, +3,000đ/km sau đó)
- Giỏ hàng phải có ít nhất 1 sản phẩm được chọn
- Sản phẩm phải còn đủ tồn kho

### Response (Success - 200)
```json
{
  "code": 1000,
  "message": "Order created successfully",
  "result": {
    "orderId": 123,
    "subtotalAmount": 500000.00,        // Tổng tiền sản phẩm
    "discountAmount": 50000.00,         // Giảm từ voucher
    "shippingFee": 25000.00,            // Phí vận chuyển
    "totalAmount": 475000.00,           // = subtotal - discount + shipping
    "paymentStatus": "pending",         // pending | paid | failed | refunded
    "fulfillmentStatus": "shipping",    // shipping | delivered | pickup | returned
    "orderStatus": "confirmed",         // confirmed | cancelled | closed
    "paymentMethod": "prepaid",         // prepaid | cod
    "fulfillmentMethod": "delivery",    // delivery | pickup
    "receiverName": "Nguyễn Văn A",     // Tên người nhận (nếu delivery)
    "receiverPhone": "0123456789",      // SĐT người nhận (nếu delivery)
    "receiverAddress": "123 Đường ABC, Quận 1, TP.HCM",  // Địa chỉ (nếu delivery)
    "note": "Giao hàng giờ hành chính", // Ghi chú
    "paymentUrl": "https://payment.vnpay.vn/order/123",  // Null nếu COD
    "createdAt": "2024-11-29T10:30:00"
  }
}
```

### Error Responses
```json
// Giỏ hàng trống
{
  "code": 4001,
  "message": "Cart is empty"
}

// Sản phẩm không đủ tồn kho
{
  "code": 4002,
  "message": "Insufficient stock"
}

// Voucher không hợp lệ
{
  "code": 4003,
  "message": "Voucher is invalid or expired"
}
```

### Business Logic
1. Lấy tất cả cart items đã được chọn của user
2. Validate tồn kho
3. Tính `subtotalAmount` (tổng tiền sản phẩm)
4. Apply voucher → tính `discountAmount`
5. Tính `shippingFee`:
   - Nếu `fulfillmentMethod = "delivery"`: 
     * Sử dụng `shippingFee` từ frontend (calculated based on distance: 15,000đ cho ≤5km, +3,000đ/km)
     * Nếu không có, mặc định 25,000đ
   - Nếu `fulfillmentMethod = "pickup"`: 0đ
6. Tính `totalAmount = subtotalAmount - discountAmount + shippingFee`
7. Tạo order với:
   - `paymentStatus = "pending"`
   - `orderStatus = "confirmed"`
   - `fulfillmentStatus = "shipping"` (nếu delivery) hoặc `"pickup"` (nếu pickup)
   - `expectedDeliveryTime` (3 ngày từ hiện tại nếu delivery)
8. Lưu order items (snapshot giá & category)
9. Trừ tồn kho sản phẩm
10. Xóa cart items đã chọn
11. Nếu `paymentMethod = "prepaid"`: Generate payment URL

---

## 2. Get My Orders - Lấy danh sách đơn hàng

Lấy danh sách đơn hàng của user hiện tại với phân trang và filter.

### Endpoint
```
GET /api/orders/my-orders
```

### Headers
```
Authorization: Bearer {JWT_TOKEN}
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `paymentStatus` | String | No | Filter: `pending`, `paid`, `failed`, `refunded` |
| `fulfillmentStatus` | String | No | Filter: `shipping`, `delivered`, `pickup`, `returned` |
| `orderStatus` | String | No | Filter: `confirmed`, `cancelled`, `closed` |
| `page` | Integer | No | Page number (default: 0) |
| `size` | Integer | No | Page size (default: 10) |

### Example Request
```
GET /api/orders/my-orders?paymentStatus=paid&orderStatus=confirmed&page=0&size=10
```

### Response (Success - 200)
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "content": [
      {
        "orderId": 123,
        "subtotalAmount": 500000.00,
        "discountAmount": 50000.00,
        "shippingFee": 25000.00,
        "totalAmount": 475000.00,
        "paymentStatus": "paid",
        "fulfillmentStatus": "shipping",
        "orderStatus": "confirmed",
        "paymentMethod": "prepaid",
        "fulfillmentMethod": "delivery",
        "itemCount": 3,
        "createdAt": "2024-11-29T10:30:00",
        "items": [
          {
            "productId": 1,
            "productName": "Sách ABC",
            "categoryId": 10,
            "categoryName": "Văn học",
            "quantity": 2,
            "unitPrice": 150000.00,
            "lineTotal": 300000.00,
            "thumbnail": "https://example.com/image.jpg"
          }
        ]
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": {
        "sorted": true,
        "unsorted": false,
        "empty": false
      }
    },
    "totalElements": 50,
    "totalPages": 5,
    "last": false,
    "first": true,
    "size": 10,
    "number": 0,
    "numberOfElements": 10,
    "empty": false
  }
}
```

### Frontend Implementation Tips
```javascript
// Example: Filter orders by status
const fetchOrders = async (filters = {}) => {
  const params = new URLSearchParams({
    page: filters.page || 0,
    size: filters.size || 10,
    ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
    ...(filters.fulfillmentStatus && { fulfillmentStatus: filters.fulfillmentStatus }),
    ...(filters.orderStatus && { orderStatus: filters.orderStatus })
  });
  
  const response = await fetch(`/api/orders/my-orders?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Usage examples:
// fetchOrders({ paymentStatus: 'pending' })  // Đơn chưa thanh toán
// fetchOrders({ orderStatus: 'confirmed' })  // Đơn đã xác nhận
// fetchOrders({ fulfillmentStatus: 'shipping' })  // Đơn đang giao
```

---

## 3. Get Order Detail - Chi tiết đơn hàng

Lấy thông tin chi tiết của một đơn hàng.

### Endpoint
```
GET /api/orders/{orderId}
```

### Headers
```
Authorization: Bearer {JWT_TOKEN}
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | Long | Yes | ID của đơn hàng |

### Example Request
```
GET /api/orders/123
```

### Response (Success - 200)
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "orderId": 123,
    "subtotalAmount": 500000.00,
    "discountAmount": 50000.00,
    "shippingFee": 25000.00,
    "totalAmount": 475000.00,
    "paymentStatus": "paid",
    "fulfillmentStatus": "shipping",
    "orderStatus": "confirmed",
    "paymentMethod": "prepaid",
    "fulfillmentMethod": "delivery",
    "voucher": {
      "code": "BLACKFRIDAY2024",
      "discountPercent": 10,
      "discountAmount": 50000.00
    },
    "receiver": {
      "name": "Nguyễn Văn A",
      "phone": "0123456789",
      "address": "123 Đường ABC, Quận 1, TP.HCM"
    },
    "items": [
      {
        "productId": 1,
        "productName": "Sách ABC",
        "categoryId": 10,
        "categoryName": "Văn học",
        "quantity": 2,
        "unitPrice": 150000.00,
        "lineTotal": 300000.00,
        "thumbnail": "https://example.com/image.jpg"
      },
      {
        "productId": 2,
        "productName": "Sách XYZ",
        "categoryId": 11,
        "categoryName": "Khoa học",
        "quantity": 1,
        "unitPrice": 200000.00,
        "lineTotal": 200000.00,
        "thumbnail": "https://example.com/image2.jpg"
      }
    ],
    "createdAt": "2024-11-29T10:30:00",
    "updatedAt": "2024-11-29T11:00:00"
  }
}
```

### Error Responses
```json
// Đơn hàng không tồn tại
{
  "code": 4004,
  "message": "Order not found"
}

// Không có quyền truy cập
{
  "code": 4005,
  "message": "Access denied to this order"
}
```

---

## 4. Cancel Order - Hủy đơn hàng

User hủy đơn hàng của mình.

### Endpoint
```
POST /api/orders/{orderId}/cancel
```

### Headers
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | Long | Yes | ID của đơn hàng cần hủy |

### Request Body
```json
{
  "reason": "Đổi ý không mua nữa"  // Required
}
```

### Response (Success - 200)
```json
{
  "code": 1000,
  "message": "Order cancelled successfully"
}
```

### Error Responses
```json
// Không thể hủy đơn
{
  "code": 4006,
  "message": "Cannot cancel this order"
}
```

### Business Rules
- Chỉ hủy được khi:
  - `orderStatus = "confirmed"`
  - `paymentStatus != "paid"`
- Sau khi hủy:
  - `orderStatus` → `"cancelled"`
  - Hoàn lại tồn kho sản phẩm

---

## 5. Reorder - Đặt lại đơn hàng

Thêm các sản phẩm từ đơn hàng cũ vào giỏ hàng.

### Endpoint
```
POST /api/orders/{orderId}/reorder
```

### Headers
```
Authorization: Bearer {JWT_TOKEN}
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | Long | Yes | ID của đơn hàng cần đặt lại |

### Response (Success - 200)
```json
{
  "code": 1000,
  "message": "Products added to cart successfully",
  "result": {
    "cartItemsAdded": 2,
    "unavailableProducts": [
      "Sách ABC (hết hàng)"
    ]
  }
}
```

### Business Logic
- Lấy tất cả sản phẩm từ đơn hàng cũ
- Thêm vào giỏ hàng (nếu còn tồn kho)
- Trả về danh sách sản phẩm không thể thêm (hết hàng hoặc không còn bán)

---

## 6. Update Order Status - Admin

Admin/Manager cập nhật trạng thái đơn hàng.

### Endpoint
```
PATCH /api/orders/{orderId}/status
```

### Headers
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Required Roles
- `ROLE_ADMIN`
- `ROLE_MANAGER`

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | Long | Yes | ID của đơn hàng |

### Request Body
```json
{
  "paymentStatus": "paid",         // Optional: pending | paid | failed | refunded
  "fulfillmentStatus": "delivered", // Optional: shipping | delivered | pickup | returned
  "orderStatus": "closed",         // Optional: confirmed | cancelled | closed
  "note": "Ghi chú cập nhật"       // Optional
}
```

**Lưu ý**: Cả 3 trường status đều optional, chỉ cập nhật những trường được gửi lên.

### Response (Success - 200)
```json
{
  "code": 1000,
  "message": "Order status updated successfully"
}
```

### Example Use Cases
```json
// Xác nhận thanh toán
{
  "paymentStatus": "paid"
}

// Cập nhật đã giao hàng
{
  "fulfillmentStatus": "delivered"
}

// Đóng đơn hàng sau khi hoàn tất
{
  "orderStatus": "closed"
}

// Cập nhật nhiều status cùng lúc
{
  "paymentStatus": "paid",
  "fulfillmentStatus": "delivered",
  "orderStatus": "closed"
}
```

---

## 7. Get All Orders - Admin

Admin/Manager xem tất cả đơn hàng trong hệ thống.

### Endpoint
```
GET /api/orders/manage
```

### Headers
```
Authorization: Bearer {JWT_TOKEN}
```

### Required Roles
- `ROLE_ADMIN`
- `ROLE_MANAGER`

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `paymentStatus` | String | No | Filter: `pending`, `paid`, `failed`, `refunded` |
| `fulfillmentStatus` | String | No | Filter: `shipping`, `delivered`, `pickup`, `returned` |
| `orderStatus` | String | No | Filter: `confirmed`, `cancelled`, `closed` |
| `page` | Integer | No | Page number (default: 0) |
| `size` | Integer | No | Page size (default: 20) |

### Example Request
```
GET /api/orders/manage?orderStatus=confirmed&paymentStatus=pending&page=0&size=20
```

### Response (Success - 200)
Response format giống với [Get My Orders](#2-get-my-orders---lấy-danh-sách-đơn-hàng), nhưng bao gồm đơn hàng của tất cả users.

---

## Data Models

### OrderItemResponse
```typescript
interface OrderItemResponse {
  productId: number;
  productName: string;
  categoryId: number;
  categoryName: string;
  quantity: number;
  unitPrice: number;      // Giá tại thời điểm đặt hàng (snapshot)
  lineTotal: number;      // unitPrice * quantity
  thumbnail: string;
}
```

### VoucherInfo
```typescript
interface VoucherInfo {
  code: string;
  discountPercent?: number;    // % giảm giá (nếu voucher theo %)
  discountAmount: number;      // Số tiền giảm thực tế
}
```

### ReceiverInfo
```typescript
interface ReceiverInfo {
  name: string;
  phone: string;
  address: string;
}
```

---

## Status Values Reference

### Payment Status (Trạng thái thanh toán)
| Value | Description | Frontend Display |
|-------|-------------|------------------|
| `pending` | Chưa thanh toán | "Chờ thanh toán" |
| `paid` | Đã thanh toán | "Đã thanh toán" |
| `failed` | Thanh toán thất bại | "Thanh toán thất bại" |
| `refunded` | Đã hoàn tiền | "Đã hoàn tiền" |

### Fulfillment Status (Trạng thái giao hàng)
| Value | Description | Frontend Display |
|-------|-------------|------------------|
| `shipping` | Đang giao hàng | "Đang giao hàng" |
| `delivered` | Đã giao hàng | "Đã giao hàng" |
| `pickup` | Tự lấy hàng | "Tự lấy hàng" |
| `returned` | Đã trả hàng | "Đã trả hàng" |

### Order Status (Trạng thái đơn hàng)
| Value | Description | Frontend Display |
|-------|-------------|------------------|
| `confirmed` | Đã xác nhận | "Đã xác nhận" |
| `cancelled` | Đã hủy | "Đã hủy" |
| `closed` | Đã đóng | "Hoàn thành" |

### Payment Method (Phương thức thanh toán)
| Value | Description | Frontend Display |
|-------|-------------|------------------|
| `prepaid` | Thanh toán trước | "Chuyển khoản/VNPAY" |
| `cod` | Thanh toán khi nhận hàng | "COD (Thanh toán khi nhận hàng)" |

### Fulfillment Method (Phương thức nhận hàng)
| Value | Description | Frontend Display |
|-------|-------------|------------------|
| `delivery` | Giao hàng tận nơi | "Giao hàng tận nơi" |
| `pickup` | Tự đến lấy | "Tự đến lấy hàng" |

---

## Frontend Integration Examples

### React/TypeScript Example

```typescript
// types/order.ts
export interface CheckoutRequest {
  paymentMethod: 'prepaid' | 'cod';
  fulfillmentMethod: 'delivery' | 'pickup';
  voucherCode?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  shippingFee?: number;
  note?: string;
}

export interface CheckoutResponse {
  orderId: number;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  fulfillmentStatus: 'shipping' | 'delivered' | 'pickup' | 'returned';
  orderStatus: 'confirmed' | 'cancelled' | 'closed';
  paymentMethod: 'prepaid' | 'cod';
  fulfillmentMethod: 'delivery' | 'pickup';
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  note?: string;
  paymentUrl?: string;
  createdAt: string;
}

export interface OrderResponse {
  orderId: number;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  fulfillmentStatus: 'shipping' | 'delivered' | 'pickup' | 'returned';
  orderStatus: 'confirmed' | 'cancelled' | 'closed';
  paymentMethod: 'prepaid' | 'cod';
  fulfillmentMethod: 'delivery' | 'pickup';
  itemCount: number;
  createdAt: string;
  items: OrderItemResponse[];
}

// services/orderService.ts
export const orderService = {
  checkout: async (data: CheckoutRequest): Promise<CheckoutResponse> => {
    const response = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const result = await response.json();
    return result.result;
  },
  
  getMyOrders: async (filters: OrderFilters, page: number = 0): Promise<Page<OrderResponse>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: '10',
      ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
      ...(filters.orderStatus && { orderStatus: filters.orderStatus })
    });
    
    const response = await fetch(`/api/orders/my-orders?${params}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    
    const result = await response.json();
    return result.result;
  },
  
  getOrderDetail: async (orderId: number): Promise<OrderDetailResponse> => {
    const response = await fetch(`/api/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    
    const result = await response.json();
    return result.result;
  },
  
  cancelOrder: async (orderId: number, reason: string): Promise<void> => {
    await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
  }
};
```

### Vue.js Example

```javascript
// composables/useOrders.js
import { ref } from 'vue';

export function useOrders() {
  const orders = ref([]);
  const loading = ref(false);
  const error = ref(null);
  
  const fetchOrders = async (filters = {}) => {
    loading.value = true;
    try {
      const params = new URLSearchParams({
        page: filters.page || 0,
        size: filters.size || 10,
        ...filters
      });
      
      const response = await fetch(`/api/orders/my-orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      orders.value = result.result.content;
      return result.result;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };
  
  const checkout = async (checkoutData) => {
    loading.value = true;
    try {
      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkoutData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      const result = await response.json();
      return result.result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  return {
    orders,
    loading,
    error,
    fetchOrders,
    checkout
  };
}
```

---

## Common Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 1000 | Success | Thành công |
| 4001 | Cart is empty | Giỏ hàng trống |
| 4002 | Insufficient stock | Sản phẩm không đủ tồn kho |
| 4003 | Voucher is invalid or expired | Voucher không hợp lệ hoặc hết hạn |
| 4004 | Order not found | Không tìm thấy đơn hàng |
| 4005 | Access denied to this order | Không có quyền truy cập đơn hàng này |
| 4006 | Cannot cancel this order | Không thể hủy đơn hàng này |
| 4007 | Product not found | Không tìm thấy sản phẩm |
| 401 | Unauthorized | Chưa đăng nhập hoặc token hết hạn |
| 403 | Forbidden | Không có quyền truy cập |

---

## Notes for Frontend Developers

### 1. Price Calculation Display
```javascript
// Hiển thị giá cho user
const displayPrice = {
  subtotal: order.subtotalAmount.toLocaleString('vi-VN') + 'đ',
  discount: order.discountAmount.toLocaleString('vi-VN') + 'đ',
  shipping: order.shippingFee.toLocaleString('vi-VN') + 'đ',
  total: order.totalAmount.toLocaleString('vi-VN') + 'đ'
};
```

### 2. Order Status Badge Colors
```javascript
const getStatusColor = (status, type) => {
  const colors = {
    paymentStatus: {
      pending: 'warning',  // Vàng
      paid: 'success',     // Xanh lá
      failed: 'danger',    // Đỏ
      refunded: 'info'     // Xanh dương
    },
    orderStatus: {
      confirmed: 'success',
      cancelled: 'danger',
      closed: 'secondary'
    },
    fulfillmentStatus: {
      shipping: 'primary',
      delivered: 'success',
      pickup: 'info',
      returned: 'warning'
    }
  };
  
  return colors[type]?.[status] || 'secondary';
};
```

### 3. Conditional Form Fields
```javascript
// Checkout form - Show receiver fields only if delivery
if (checkoutForm.fulfillmentMethod === 'delivery') {
  // Show: receiverName, receiverPhone, receiverAddress
  // Make them required
} else {
  // Hide receiver fields
}

// Show payment URL only if prepaid
if (checkoutResponse.paymentMethod === 'prepaid' && checkoutResponse.paymentUrl) {
  // Redirect to payment URL or show QR code
}
```

### 4. Order Filtering UI
```javascript
// Tab filter example
const orderTabs = [
  { label: 'Tất cả', filter: {} },
  { label: 'Chờ thanh toán', filter: { paymentStatus: 'pending' } },
  { label: 'Đã thanh toán', filter: { paymentStatus: 'paid' } },
  { label: 'Đang giao', filter: { fulfillmentStatus: 'shipping' } },
  { label: 'Đã giao', filter: { fulfillmentStatus: 'delivered' } },
  { label: 'Đã hủy', filter: { orderStatus: 'cancelled' } }
];
```

### 5. Cancel Order Confirmation
```javascript
// Always confirm before canceling
const handleCancelOrder = async (orderId) => {
  const confirmed = window.confirm('Bạn có chắc muốn hủy đơn hàng này?');
  if (!confirmed) return;
  
  const reason = prompt('Lý do hủy đơn:');
  if (!reason) return;
  
  try {
    await orderService.cancelOrder(orderId, reason);
    alert('Hủy đơn hàng thành công');
    // Refresh order list
  } catch (error) {
    alert(error.message);
  }
};
```

---

## Changelog

### Version 1.0 (2024-11-29)
- Initial release
- Implemented checkout flow
- Order management (list, detail, cancel, reorder)
- Admin order management
- 3-axis status system (payment, fulfillment, order)
