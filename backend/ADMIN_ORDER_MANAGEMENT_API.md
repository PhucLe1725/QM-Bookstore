# Order Management API - Admin Documentation

## Overview
Tài liệu này cung cấp thông tin chi tiết về các API quản lý đơn hàng dành cho Admin/Manager trong hệ thống QM Bookstore. API cho phép theo dõi và cập nhật trạng thái đơn hàng thông qua 3 trục trạng thái độc lập.

**Base URL**: `http://localhost:8080/api/orders`  
**Authentication**: Required - JWT Bearer Token  
**Authorization**: Admin/Manager role required (`ROLE_ADMIN` hoặc `ROLE_MANAGER`)

---

## Table of Contents
1. [Hệ thống trạng thái đơn hàng](#hệ-thống-trạng-thái-đơn-hàng)
2. [API Endpoints cho Admin](#api-endpoints-cho-admin)
3. [TypeScript Interfaces](#typescript-interfaces)
4. [API Service Implementation](#api-service-implementation)
5. [React Components Examples](#react-components-examples)
6. [State Management](#state-management)
7. [Filtering và Searching](#filtering-và-searching)
8. [Error Handling](#error-handling)

---

## Hệ thống trạng thái đơn hàng

Hệ thống sử dụng **3 trục trạng thái độc lập** để quản lý đơn hàng một cách linh hoạt:

### 1. Payment Status (Trạng thái thanh toán)
Theo dõi trạng thái thanh toán của đơn hàng.

| Trạng thái | Mô tả | Khi nào sử dụng |
|------------|-------|-----------------|
| `pending` | Chờ thanh toán | Đơn prepaid chưa thanh toán hoặc COD chưa nhận tiền |
| `paid` | Đã thanh toán | Đã xác nhận thanh toán thành công |
| `failed` | Thanh toán thất bại | Giao dịch bị từ chối hoặc lỗi |
| `refunded` | Đã hoàn tiền | Đã hoàn tiền cho khách hàng |

**Luồng thông thường**:
- **Prepaid**: `pending` → `paid` hoặc `failed`
- **COD**: `pending` → `paid` (khi giao hàng thành công)
- **Refund**: `paid` → `refunded` (khi hủy đơn hoặc trả hàng)

---

### 2. Fulfillment Status (Trạng thái thực hiện)
Theo dõi trạng thái giao/nhận hàng.

| Trạng thái | Mô tả | Khi nào sử dụng |
|------------|-------|-----------------|
| `shipping` | Đang vận chuyển | Đơn delivery đang được giao |
| `delivered` | Đã giao hàng | Khách hàng đã nhận hàng |
| `pickup` | Đã lấy hàng | Khách đã đến lấy tại cửa hàng |
| `returned` | Đã trả hàng | Hàng bị trả lại |

**Luồng theo fulfillment method**:
- **Delivery**: `shipping` → `delivered` hoặc `returned`
- **Pickup**: `null` → `pickup` (khi khách đến lấy)

---

### 3. Order Status (Trạng thái đơn hàng)
Trạng thái tổng thể của đơn hàng.

| Trạng thái | Mô tả | Khi nào sử dụng |
|------------|-------|-----------------|
| `confirmed` | Đã xác nhận | Đơn hàng đã được tạo và xác nhận |
| `cancelled` | Đã hủy | Đơn hàng bị hủy bởi khách hoặc admin |
| `closed` | Đã đóng | Đơn hàng hoàn tất (giao thành công hoặc xử lý xong) |

**Luồng thông thường**:
- **Thành công**: `confirmed` → `closed`
- **Hủy đơn**: `confirmed` → `cancelled`

---

### Ví dụ về các kịch bản thực tế

#### Kịch bản 1: Đơn hàng COD giao thành công
```
Payment Status: pending → paid
Fulfillment Status: shipping → delivered
Order Status: confirmed → closed
```

#### Kịch bản 2: Đơn hàng Prepaid bị hủy trước khi giao
```
Payment Status: paid → refunded
Fulfillment Status: null
Order Status: confirmed → cancelled
```

#### Kịch bản 3: Đơn pickup tại cửa hàng
```
Payment Status: pending → paid
Fulfillment Status: null → pickup
Order Status: confirmed → closed
```

#### Kịch bản 4: Giao hàng thất bại, khách trả lại
```
Payment Status: paid → refunded
Fulfillment Status: shipping → returned
Order Status: confirmed → cancelled
```

---

## API Endpoints cho Admin

### 1. Get All Orders (với filters)
**Endpoint**: `GET /api/orders/manage`  
**Description**: Lấy danh sách tất cả đơn hàng với khả năng filter theo 3 trục trạng thái  
**Authorization**: Admin hoặc Manager

**Query Parameters**:
- `paymentStatus` (String, optional): Filter theo trạng thái thanh toán
  - Values: `pending`, `paid`, `failed`, `refunded`
- `fulfillmentStatus` (String, optional): Filter theo trạng thái thực hiện
  - Values: `shipping`, `delivered`, `pickup`, `returned`
- `orderStatus` (String, optional): Filter theo trạng thái đơn hàng
  - Values: `confirmed`, `cancelled`, `closed`
- `page` (Integer, default: 0): Số trang
- `size` (Integer, default: 20): Số đơn hàng mỗi trang

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Request Examples**:

1. **Lấy tất cả đơn hàng chờ thanh toán**:
```
GET /api/orders/manage?paymentStatus=pending
```

2. **Lấy đơn hàng đang giao**:
```
GET /api/orders/manage?fulfillmentStatus=shipping
```

3. **Lấy đơn hàng đã hủy cần hoàn tiền**:
```
GET /api/orders/manage?orderStatus=cancelled&paymentStatus=paid
```

4. **Lấy đơn COD đã giao thành công**:
```
GET /api/orders/manage?fulfillmentStatus=delivered&paymentStatus=paid
```

5. **Kết hợp nhiều filter với phân trang**:
```
GET /api/orders/manage?paymentStatus=pending&fulfillmentStatus=shipping&page=0&size=50
```

**Response** (200 OK):
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "content": [
      {
        "orderId": 1234,
        "subtotalAmount": 500000,
        "discountAmount": 50000,
        "shippingFee": 30000,
        "totalAmount": 480000,
        "paymentStatus": "pending",
        "fulfillmentStatus": "shipping",
        "orderStatus": "confirmed",
        "paymentMethod": "cod",
        "fulfillmentMethod": "delivery",
        "itemCount": 3,
        "createdAt": "2025-12-10T14:30:00",
        "items": [
          {
            "orderItemId": 5678,
            "productId": 10,
            "productName": "Clean Code",
            "productImage": "https://example.com/images/clean-code.jpg",
            "quantity": 2,
            "unitPrice": 200000,
            "subtotal": 400000
          }
        ]
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": {
        "sorted": true,
        "unsorted": false,
        "empty": false
      }
    },
    "totalElements": 150,
    "totalPages": 8,
    "last": false,
    "first": true,
    "size": 20,
    "number": 0,
    "numberOfElements": 20
  }
}
```

---

### 2. Update Order Status
**Endpoint**: `PATCH /api/orders/{orderId}/status`  
**Description**: Cập nhật trạng thái đơn hàng (một hoặc nhiều trục trạng thái)  
**Authorization**: Admin hoặc Manager

**Path Parameters**:
- `orderId` (Long): ID của đơn hàng cần cập nhật

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "paymentStatus": "paid",
  "fulfillmentStatus": "delivered",
  "orderStatus": "closed",
  "note": "Khách hàng đã nhận hàng và thanh toán"
}
```

**Note**: 
- Tất cả các field đều optional. Chỉ gửi các field cần cập nhật
- `note`: Ghi chú về lý do thay đổi (optional)

**Request Examples**:

1. **Xác nhận đã thanh toán (chỉ update payment)**:
```json
{
  "paymentStatus": "paid"
}
```

2. **Cập nhật trạng thái giao hàng**:
```json
{
  "fulfillmentStatus": "delivered",
  "note": "Đã giao hàng lúc 14:30"
}
```

3. **Xử lý đơn hủy và hoàn tiền**:
```json
{
  "paymentStatus": "refunded",
  "orderStatus": "cancelled",
  "note": "Hoàn tiền do khách hàng yêu cầu hủy"
}
```

4. **Đóng đơn hàng COD thành công**:
```json
{
  "paymentStatus": "paid",
  "fulfillmentStatus": "delivered",
  "orderStatus": "closed",
  "note": "Hoàn thành đơn COD"
}
```

**Response** (200 OK):
```json
{
  "code": 1000,
  "message": "Order status updated successfully"
}
```

**Error Responses**:

**404 Not Found** (Đơn hàng không tồn tại):
```json
{
  "code": 1005,
  "message": "Order not found"
}
```

**400 Bad Request** (Trạng thái không hợp lệ):
```json
{
  "code": 1003,
  "message": "Invalid status value"
}
```

---

### 3. Get Order Detail (Admin view)
**Endpoint**: `GET /api/orders/{orderId}`  
**Description**: Xem chi tiết đơn hàng (Admin có thể xem tất cả đơn)  
**Authorization**: Authenticated (Admin có thể xem mọi đơn)

**Path Parameters**:
- `orderId` (Long): ID của đơn hàng

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "orderId": 1234,
    "subtotalAmount": 500000,
    "discountAmount": 50000,
    "shippingFee": 30000,
    "totalAmount": 480000,
    "paymentStatus": "paid",
    "fulfillmentStatus": "shipping",
    "orderStatus": "confirmed",
    "paymentMethod": "prepaid",
    "fulfillmentMethod": "delivery",
    "voucher": {
      "code": "SUMMER2025",
      "discountType": "PERCENT",
      "discountAmount": 50000
    },
    "receiver": {
      "name": "Nguyễn Văn A",
      "phone": "0912345678",
      "address": "123 Đường ABC, Quận 1, TP.HCM"
    },
    "items": [
      {
        "orderItemId": 5678,
        "productId": 10,
        "productName": "Clean Code",
        "productImage": "https://example.com/images/clean-code.jpg",
        "quantity": 2,
        "unitPrice": 200000,
        "subtotal": 400000
      },
      {
        "orderItemId": 5679,
        "productId": 15,
        "productName": "Design Patterns",
        "productImage": "https://example.com/images/design-patterns.jpg",
        "quantity": 1,
        "unitPrice": 150000,
        "subtotal": 150000
      }
    ],
    "createdAt": "2025-12-10T14:30:00",
    "updatedAt": "2025-12-11T09:15:00"
  }
}
```

---

## TypeScript Interfaces

```typescript
// types/order.types.ts

/**
 * Order response interface
 */
export interface OrderResponse {
  orderId: number;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus | null;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  fulfillmentMethod: FulfillmentMethod;
  itemCount: number;
  createdAt: string;
  items: OrderItemResponse[];
}

/**
 * Order detail response interface
 */
export interface OrderDetailResponse {
  orderId: number;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus | null;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  fulfillmentMethod: FulfillmentMethod;
  voucher?: VoucherInfo;
  receiver: ReceiverInfo;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Order item interface
 */
export interface OrderItemResponse {
  orderItemId: number;
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/**
 * Voucher info interface
 */
export interface VoucherInfo {
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountAmount: number;
}

/**
 * Receiver info interface
 */
export interface ReceiverInfo {
  name: string;
  phone: string;
  address: string;
}

/**
 * Update order status request
 */
export interface UpdateOrderStatusRequest {
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  orderStatus?: OrderStatus;
  note?: string;
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/**
 * Fulfillment status enum
 */
export enum FulfillmentStatus {
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  PICKUP = 'pickup',
  RETURNED = 'returned',
}

/**
 * Order status enum
 */
export enum OrderStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

/**
 * Payment method enum
 */
export enum PaymentMethod {
  PREPAID = 'prepaid',
  COD = 'cod',
}

/**
 * Fulfillment method enum
 */
export enum FulfillmentMethod {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
}

/**
 * Order filter interface
 */
export interface OrderFilter {
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  orderStatus?: OrderStatus;
  page?: number;
  size?: number;
}

/**
 * Paginated response interface
 */
export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  result?: T;
}
```

---

## API Service Implementation

```typescript
// services/adminOrderService.ts

import axios, { AxiosInstance } from 'axios';
import {
  OrderResponse,
  OrderDetailResponse,
  UpdateOrderStatusRequest,
  OrderFilter,
  PageResponse,
  ApiResponse,
} from '../types/order.types';

class AdminOrderService {
  private api: AxiosInstance;
  private readonly BASE_URL = '/api/orders';

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add JWT token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Get all orders with filters (Admin/Manager only)
   */
  async getAllOrders(filter: OrderFilter = {}): Promise<PageResponse<OrderResponse>> {
    const params = new URLSearchParams();
    
    if (filter.paymentStatus) params.append('paymentStatus', filter.paymentStatus);
    if (filter.fulfillmentStatus) params.append('fulfillmentStatus', filter.fulfillmentStatus);
    if (filter.orderStatus) params.append('orderStatus', filter.orderStatus);
    if (filter.page !== undefined) params.append('page', filter.page.toString());
    if (filter.size !== undefined) params.append('size', filter.size.toString());

    const response = await this.api.get<ApiResponse<PageResponse<OrderResponse>>>(
      `${this.BASE_URL}/manage?${params.toString()}`
    );
    
    return response.data.result!;
  }

  /**
   * Get order detail by ID
   */
  async getOrderDetail(orderId: number): Promise<OrderDetailResponse> {
    const response = await this.api.get<ApiResponse<OrderDetailResponse>>(
      `${this.BASE_URL}/${orderId}`
    );
    return response.data.result!;
  }

  /**
   * Update order status (Admin/Manager only)
   */
  async updateOrderStatus(
    orderId: number,
    data: UpdateOrderStatusRequest
  ): Promise<void> {
    await this.api.patch<ApiResponse<void>>(
      `${this.BASE_URL}/${orderId}/status`,
      data
    );
  }

  /**
   * Get orders by payment status
   */
  async getOrdersByPaymentStatus(
    status: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<OrderResponse>> {
    return this.getAllOrders({ paymentStatus: status as any, page, size });
  }

  /**
   * Get orders by fulfillment status
   */
  async getOrdersByFulfillmentStatus(
    status: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<OrderResponse>> {
    return this.getAllOrders({ fulfillmentStatus: status as any, page, size });
  }

  /**
   * Get orders by order status
   */
  async getOrdersByOrderStatus(
    status: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<OrderResponse>> {
    return this.getAllOrders({ orderStatus: status as any, page, size });
  }

  /**
   * Quick filters for common scenarios
   */
  async getPendingPayments(page = 0, size = 20): Promise<PageResponse<OrderResponse>> {
    return this.getAllOrders({ paymentStatus: 'pending' as any, page, size });
  }

  async getShippingOrders(page = 0, size = 20): Promise<PageResponse<OrderResponse>> {
    return this.getAllOrders({ fulfillmentStatus: 'shipping' as any, page, size });
  }

  async getCancelledOrders(page = 0, size = 20): Promise<PageResponse<OrderResponse>> {
    return this.getAllOrders({ orderStatus: 'cancelled' as any, page, size });
  }

  async getNeedRefund(page = 0, size = 20): Promise<PageResponse<OrderResponse>> {
    return this.getAllOrders({
      orderStatus: 'cancelled' as any,
      paymentStatus: 'paid' as any,
      page,
      size,
    });
  }
}

export default new AdminOrderService();
```

---

## React Components Examples

### 1. Order List Component with Filters

```typescript
// components/admin/OrderManagement.tsx

import React, { useEffect, useState } from 'react';
import {
  OrderResponse,
  OrderFilter,
  PaymentStatus,
  FulfillmentStatus,
  OrderStatus,
} from '../../types/order.types';
import adminOrderService from '../../services/adminOrderService';
import { toast } from 'react-toastify';
import { formatCurrency, formatDate } from '../../utils/formatters';

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filter, setFilter] = useState<OrderFilter>({
    page: 0,
    size: 20,
  });

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await adminOrderService.getAllOrders(filter);
      setOrders(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      toast.error('Không thể tải danh sách đơn hàng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof OrderFilter, value: any) => {
    setFilter((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 0, // Reset to first page when filter changes
    }));
  };

  const clearFilters = () => {
    setFilter({ page: 0, size: 20 });
  };

  const getStatusBadgeClass = (status: string, type: 'payment' | 'fulfillment' | 'order') => {
    const baseClass = 'px-3 py-1 rounded-full text-xs font-semibold';
    
    if (type === 'payment') {
      switch (status) {
        case 'pending': return `${baseClass} bg-yellow-100 text-yellow-800`;
        case 'paid': return `${baseClass} bg-green-100 text-green-800`;
        case 'failed': return `${baseClass} bg-red-100 text-red-800`;
        case 'refunded': return `${baseClass} bg-purple-100 text-purple-800`;
        default: return baseClass;
      }
    }
    
    if (type === 'fulfillment') {
      switch (status) {
        case 'shipping': return `${baseClass} bg-blue-100 text-blue-800`;
        case 'delivered': return `${baseClass} bg-green-100 text-green-800`;
        case 'pickup': return `${baseClass} bg-indigo-100 text-indigo-800`;
        case 'returned': return `${baseClass} bg-red-100 text-red-800`;
        default: return `${baseClass} bg-gray-100 text-gray-800`;
      }
    }
    
    if (type === 'order') {
      switch (status) {
        case 'confirmed': return `${baseClass} bg-blue-100 text-blue-800`;
        case 'cancelled': return `${baseClass} bg-red-100 text-red-800`;
        case 'closed': return `${baseClass} bg-gray-100 text-gray-800`;
        default: return baseClass;
      }
    }
    
    return baseClass;
  };

  const getStatusLabel = (status: string, type: 'payment' | 'fulfillment' | 'order'): string => {
    const labels: Record<string, Record<string, string>> = {
      payment: {
        pending: 'Chờ thanh toán',
        paid: 'Đã thanh toán',
        failed: 'Thất bại',
        refunded: 'Đã hoàn tiền',
      },
      fulfillment: {
        shipping: 'Đang giao',
        delivered: 'Đã giao',
        pickup: 'Đã lấy',
        returned: 'Đã trả',
      },
      order: {
        confirmed: 'Đã xác nhận',
        cancelled: 'Đã hủy',
        closed: 'Đã đóng',
      },
    };
    return labels[type]?.[status] || status;
  };

  if (loading && orders.length === 0) {
    return <div className="text-center p-8">Đang tải...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Quản lý đơn hàng</h1>
        <p className="text-gray-600">Tổng số đơn hàng: {totalElements}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Bộ lọc</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Payment Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái thanh toán
            </label>
            <select
              value={filter.paymentStatus || ''}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value={PaymentStatus.PENDING}>Chờ thanh toán</option>
              <option value={PaymentStatus.PAID}>Đã thanh toán</option>
              <option value={PaymentStatus.FAILED}>Thất bại</option>
              <option value={PaymentStatus.REFUNDED}>Đã hoàn tiền</option>
            </select>
          </div>

          {/* Fulfillment Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái giao hàng
            </label>
            <select
              value={filter.fulfillmentStatus || ''}
              onChange={(e) => handleFilterChange('fulfillmentStatus', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value={FulfillmentStatus.SHIPPING}>Đang giao</option>
              <option value={FulfillmentStatus.DELIVERED}>Đã giao</option>
              <option value={FulfillmentStatus.PICKUP}>Đã lấy</option>
              <option value={FulfillmentStatus.RETURNED}>Đã trả</option>
            </select>
          </div>

          {/* Order Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái đơn hàng
            </label>
            <select
              value={filter.orderStatus || ''}
              onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value={OrderStatus.CONFIRMED}>Đã xác nhận</option>
              <option value={OrderStatus.CANCELLED}>Đã hủy</option>
              <option value={OrderStatus.CLOSED}>Đã đóng</option>
            </select>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter({ paymentStatus: PaymentStatus.PENDING as any, page: 0, size: 20 })}
            className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm"
          >
            Chờ thanh toán
          </button>
          <button
            onClick={() => setFilter({ fulfillmentStatus: FulfillmentStatus.SHIPPING as any, page: 0, size: 20 })}
            className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-sm"
          >
            Đang giao hàng
          </button>
          <button
            onClick={() => setFilter({ 
              orderStatus: OrderStatus.CANCELLED as any, 
              paymentStatus: PaymentStatus.PAID as any, 
              page: 0, 
              size: 20 
            })}
            className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-sm"
          >
            Cần hoàn tiền
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã ĐH
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thanh toán
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giao hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.orderId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{order.orderId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(order.totalAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadgeClass(order.paymentStatus, 'payment')}>
                    {getStatusLabel(order.paymentStatus, 'payment')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.fulfillmentStatus ? (
                    <span className={getStatusBadgeClass(order.fulfillmentStatus, 'fulfillment')}>
                      {getStatusLabel(order.fulfillmentStatus, 'fulfillment')}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadgeClass(order.orderStatus, 'order')}>
                    {getStatusLabel(order.orderStatus, 'order')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {/* Navigate to detail */}}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Xem
                  </button>
                  <button
                    onClick={() => {/* Open update modal */}}
                    className="text-green-600 hover:text-green-900"
                  >
                    Cập nhật
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Không tìm thấy đơn hàng nào
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
            <div className="text-sm text-gray-700">
              Trang {(filter.page || 0) + 1} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('page', (filter.page || 0) - 1)}
                disabled={(filter.page || 0) === 0}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Trước
              </button>
              <button
                onClick={() => handleFilterChange('page', (filter.page || 0) + 1)}
                disabled={(filter.page || 0) >= totalPages - 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
```

---

### 2. Update Order Status Modal

```typescript
// components/admin/UpdateOrderStatusModal.tsx

import React, { useState } from 'react';
import {
  UpdateOrderStatusRequest,
  PaymentStatus,
  FulfillmentStatus,
  OrderStatus,
  OrderDetailResponse,
} from '../../types/order.types';
import adminOrderService from '../../services/adminOrderService';
import { toast } from 'react-toastify';

interface Props {
  order: OrderDetailResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateOrderStatusModal: React.FC<Props> = ({ order, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<UpdateOrderStatusRequest>({
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus || undefined,
    orderStatus: order.orderStatus,
    note: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await adminOrderService.updateOrderStatus(order.orderId, formData);
      toast.success('Cập nhật trạng thái đơn hàng thành công');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Không thể cập nhật trạng thái');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Cập nhật trạng thái đơn #{order.orderId}</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Payment Status */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái thanh toán
            </label>
            <select
              value={formData.paymentStatus || ''}
              onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={PaymentStatus.PENDING}>Chờ thanh toán</option>
              <option value={PaymentStatus.PAID}>Đã thanh toán</option>
              <option value={PaymentStatus.FAILED}>Thất bại</option>
              <option value={PaymentStatus.REFUNDED}>Đã hoàn tiền</option>
            </select>
          </div>

          {/* Fulfillment Status */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái giao hàng
            </label>
            <select
              value={formData.fulfillmentStatus || ''}
              onChange={(e) => setFormData({ ...formData, fulfillmentStatus: e.target.value as any || undefined })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chưa xác định</option>
              <option value={FulfillmentStatus.SHIPPING}>Đang giao</option>
              <option value={FulfillmentStatus.DELIVERED}>Đã giao</option>
              <option value={FulfillmentStatus.PICKUP}>Đã lấy</option>
              <option value={FulfillmentStatus.RETURNED}>Đã trả</option>
            </select>
          </div>

          {/* Order Status */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái đơn hàng
            </label>
            <select
              value={formData.orderStatus || ''}
              onChange={(e) => setFormData({ ...formData, orderStatus: e.target.value as any })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={OrderStatus.CONFIRMED}>Đã xác nhận</option>
              <option value={OrderStatus.CANCELLED}>Đã hủy</option>
              <option value={OrderStatus.CLOSED}>Đã đóng</option>
            </select>
          </div>

          {/* Note */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Lý do thay đổi trạng thái..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateOrderStatusModal;
```

---

## State Management

```typescript
// store/slices/adminOrderSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  OrderResponse,
  OrderDetailResponse,
  OrderFilter,
  PageResponse,
  UpdateOrderStatusRequest,
} from '../../types/order.types';
import adminOrderService from '../../services/adminOrderService';

interface AdminOrderState {
  orders: OrderResponse[];
  selectedOrder: OrderDetailResponse | null;
  totalPages: number;
  totalElements: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  filter: OrderFilter;
}

const initialState: AdminOrderState = {
  orders: [],
  selectedOrder: null,
  totalPages: 0,
  totalElements: 0,
  currentPage: 0,
  loading: false,
  error: null,
  filter: {
    page: 0,
    size: 20,
  },
};

// Async thunks
export const fetchAllOrders = createAsyncThunk(
  'adminOrders/fetchAll',
  async (filter: OrderFilter) => {
    return await adminOrderService.getAllOrders(filter);
  }
);

export const fetchOrderDetail = createAsyncThunk(
  'adminOrders/fetchDetail',
  async (orderId: number) => {
    return await adminOrderService.getOrderDetail(orderId);
  }
);

export const updateOrderStatus = createAsyncThunk(
  'adminOrders/updateStatus',
  async ({ orderId, data }: { orderId: number; data: UpdateOrderStatusRequest }) => {
    await adminOrderService.updateOrderStatus(orderId, data);
    return orderId;
  }
);

const adminOrderSlice = createSlice({
  name: 'adminOrders',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<OrderFilter>) => {
      state.filter = action.payload;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all orders
    builder
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllOrders.fulfilled,
        (state, action: PayloadAction<PageResponse<OrderResponse>>) => {
          state.loading = false;
          state.orders = action.payload.content;
          state.totalPages = action.payload.totalPages;
          state.totalElements = action.payload.totalElements;
          state.currentPage = action.payload.number;
        }
      )
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      });

    // Fetch order detail
    builder
      .addCase(fetchOrderDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchOrderDetail.fulfilled,
        (state, action: PayloadAction<OrderDetailResponse>) => {
          state.loading = false;
          state.selectedOrder = action.payload;
        }
      )
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch order detail';
      });

    // Update order status
    builder
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update order status';
      });
  },
});

export const { setFilter, clearSelectedOrder, clearError } = adminOrderSlice.actions;
export default adminOrderSlice.reducer;
```

---

## Filtering và Searching

### Common Filter Scenarios

```typescript
// utils/orderFilters.ts

import { OrderFilter } from '../types/order.types';

/**
 * Các kịch bản filter phổ biến cho admin
 */
export const commonOrderFilters = {
  // 1. Đơn hàng cần xử lý thanh toán
  pendingPayments: (): OrderFilter => ({
    paymentStatus: 'pending' as any,
    page: 0,
    size: 50,
  }),

  // 2. Đơn hàng đang giao
  shipping: (): OrderFilter => ({
    fulfillmentStatus: 'shipping' as any,
    orderStatus: 'confirmed' as any,
    page: 0,
    size: 50,
  }),

  // 3. Đơn hàng cần hoàn tiền
  needRefund: (): OrderFilter => ({
    orderStatus: 'cancelled' as any,
    paymentStatus: 'paid' as any,
    page: 0,
    size: 50,
  }),

  // 4. Đơn COD đã giao thành công
  codDelivered: (): OrderFilter => ({
    paymentMethod: 'cod' as any,
    fulfillmentStatus: 'delivered' as any,
    paymentStatus: 'pending' as any,
    page: 0,
    size: 50,
  }),

  // 5. Đơn hàng hoàn tất (closed)
  completed: (): OrderFilter => ({
    orderStatus: 'closed' as any,
    page: 0,
    size: 50,
  }),

  // 6. Đơn hàng bị hủy
  cancelled: (): OrderFilter => ({
    orderStatus: 'cancelled' as any,
    page: 0,
    size: 50,
  }),

  // 7. Đơn prepaid chưa xác nhận thanh toán
  prepaidPending: (): OrderFilter => ({
    paymentMethod: 'prepaid' as any,
    paymentStatus: 'pending' as any,
    page: 0,
    size: 50,
  }),

  // 8. Đơn hàng bị trả lại
  returned: (): OrderFilter => ({
    fulfillmentStatus: 'returned' as any,
    page: 0,
    size: 50,
  }),
};
```

---

## Error Handling

### Error Code Reference

| Code | Message | Description | Handling |
|------|---------|-------------|----------|
| 1000 | Success | Request successful | Display success message |
| 1001 | Uncategorized exception | Unexpected error | Show generic error, log details |
| 1003 | Invalid validation | Validation failed | Display field errors |
| 1005 | Order not found | Order doesn't exist | Show "Not Found" message |
| 1006 | Unauthenticated | No valid JWT token | Redirect to login |
| 1007 | Unauthorized | User lacks required role | Show 403 page |

---

## Utility Functions

```typescript
// utils/formatters.ts

/**
 * Format currency in VND
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format date time
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Get status label in Vietnamese
 */
export const getStatusLabel = (
  status: string,
  type: 'payment' | 'fulfillment' | 'order'
): string => {
  const labels: Record<string, Record<string, string>> = {
    payment: {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thất bại',
      refunded: 'Đã hoàn tiền',
    },
    fulfillment: {
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      pickup: 'Đã lấy',
      returned: 'Đã trả',
    },
    order: {
      confirmed: 'Đã xác nhận',
      cancelled: 'Đã hủy',
      closed: 'Đã đóng',
    },
  };
  return labels[type]?.[status] || status;
};
```

---

## Notes và Best Practices

### 1. Quy trình cập nhật trạng thái

**Đơn hàng COD giao thành công**:
```
1. Khi shipper giao hàng thành công:
   - fulfillmentStatus: null → "delivered"
   - paymentStatus: "pending" → "paid"
   - orderStatus: "confirmed" → "closed"
```

**Đơn hàng Prepaid bị hủy**:
```
1. Khi khách hàng yêu cầu hủy:
   - orderStatus: "confirmed" → "cancelled"
2. Xử lý hoàn tiền:
   - paymentStatus: "paid" → "refunded"
```

**Đơn hàng bị trả lại**:
```
1. Khi khách trả hàng:
   - fulfillmentStatus: "delivered" → "returned"
   - orderStatus: "confirmed" → "cancelled"
2. Xử lý hoàn tiền:
   - paymentStatus: "paid" → "refunded"
```

### 2. Validation Rules

- Không thể update order status của đơn đã `closed`
- Không thể change `paymentStatus` từ `refunded` sang trạng thái khác
- Nên yêu cầu `note` khi update để tracking lịch sử

### 3. Performance Tips

- Sử dụng pagination với size phù hợp (10-50 records)
- Cache danh sách orders để giảm API calls
- Sử dụng debounce cho search/filter
- Load order detail on-demand

### 4. Security

- Chỉ Admin/Manager được phép cập nhật trạng thái
- Validate JWT token trên mọi request
- Log tất cả thay đổi trạng thái để audit

---

## Quick Start Checklist

- [ ] Copy TypeScript interfaces to project
- [ ] Implement AdminOrderService with axios
- [ ] Create OrderManagement component with filters
- [ ] Create UpdateOrderStatusModal component
- [ ] Add Redux slice for state management
- [ ] Implement utility functions (formatters, status labels)
- [ ] Add routes to React Router
- [ ] Configure JWT authentication
- [ ] Test all filter combinations
- [ ] Implement error handling
- [ ] Add loading states and spinners
- [ ] Test update status functionality

---

**Last Updated**: December 12, 2025  
**API Version**: 1.0  
**Backend Version**: Spring Boot 3.5.4  
**Database**: PostgreSQL 17.6
