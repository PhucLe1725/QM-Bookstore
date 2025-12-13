# Hệ Thống Báo Cáo và Thống Kê (Reports & Statistics API)

## Tổng Quan
Hệ thống báo cáo và thống kê cung cấp các API để Admin và Manager theo dõi hiệu suất kinh doanh, phân tích dữ liệu và xuất báo cáo. Tất cả các endpoint đều yêu cầu quyền ADMIN hoặc MANAGER.

### Base URL
```
http://localhost:8080/api/reports
```

### Authorization
Tất cả các endpoint yêu cầu:
- **Header**: `Authorization: Bearer <JWT_TOKEN>`
- **Role**: ADMIN hoặc MANAGER

---

## 1. API Endpoints

### 1.1. Báo Cáo Doanh Thu (Revenue Report)

**GET** `/api/reports/revenue`

Lấy báo cáo doanh thu chi tiết theo khoảng thời gian với các phân tích theo ngày, phương thức thanh toán và danh mục sản phẩm.

#### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| startDate | date | Yes | Ngày bắt đầu (ISO format) | 2025-01-01 |
| endDate | date | Yes | Ngày kết thúc (ISO format) | 2025-12-31 |

#### Request Example
```http
GET /api/reports/revenue?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response Example (200 OK)
```json
{
  "totalRevenue": 125000000.0,
  "totalDiscount": 12500000.0,
  "netRevenue": 112500000.0,
  "totalShippingFee": 2500000.0,
  "totalOrders": 350,
  "paidOrders": 320,
  "pendingOrders": 20,
  "failedOrders": 10,
  "revenueByDate": [
    {
      "date": "2025-01-01",
      "revenue": 3500000.0,
      "orderCount": 12,
      "averageOrderValue": 291666.67
    },
    {
      "date": "2025-01-02",
      "revenue": 4200000.0,
      "orderCount": 15,
      "averageOrderValue": 280000.0
    }
  ],
  "revenueByPaymentMethod": [
    {
      "paymentMethod": "COD",
      "revenue": 45000000.0,
      "orderCount": 150,
      "percentage": 36.0
    },
    {
      "paymentMethod": "BANK_TRANSFER",
      "revenue": 80000000.0,
      "orderCount": 200,
      "percentage": 64.0
    }
  ],
  "revenueByCategory": [
    {
      "categoryId": 1,
      "categoryName": "Văn học",
      "revenue": 35000000.0,
      "orderCount": 120,
      "percentage": 28.0
    },
    {
      "categoryId": 2,
      "categoryName": "Kinh tế",
      "revenue": 45000000.0,
      "orderCount": 110,
      "percentage": 36.0
    }
  ]
}
```

---

### 1.2. Thống Kê Đơn Hàng (Order Statistics)

**GET** `/api/reports/orders`

Lấy thống kê đơn hàng theo các trạng thái (payment, fulfillment, order status) với phân tích theo ngày.

#### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| startDate | date | Yes | Ngày bắt đầu | 2025-01-01 |
| endDate | date | Yes | Ngày kết thúc | 2025-12-31 |

#### Request Example
```http
GET /api/reports/orders?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response Example (200 OK)
```json
{
  "totalOrders": 450,
  "ordersByPaymentStatus": {
    "PENDING": 50,
    "PAID": 350,
    "FAILED": 30,
    "REFUNDED": 20
  },
  "ordersByFulfillmentStatus": {
    "SHIPPING": 80,
    "DELIVERED": 300,
    "PICKUP": 50,
    "RETURNED": 20
  },
  "ordersByOrderStatus": {
    "CONFIRMED": 380,
    "CANCELLED": 50,
    "CLOSED": 20
  },
  "ordersByDate": [
    {
      "date": "2025-01-01",
      "totalOrders": 15,
      "paidOrders": 12,
      "deliveredOrders": 10,
      "cancelledOrders": 2
    },
    {
      "date": "2025-01-02",
      "totalOrders": 18,
      "paidOrders": 16,
      "deliveredOrders": 14,
      "cancelledOrders": 1
    }
  ],
  "ordersByStatus": [
    {
      "status": "PAID",
      "count": 350,
      "percentage": 77.78
    },
    {
      "status": "DELIVERED",
      "count": 300,
      "percentage": 66.67
    }
  ]
}
```

---

### 1.3. Sản Phẩm Bán Chạy (Top Selling Products)

**GET** `/api/reports/products/top-selling`

Lấy danh sách sản phẩm bán chạy nhất theo khoảng thời gian.

#### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| startDate | date | Yes | Ngày bắt đầu | 2025-01-01 |
| endDate | date | Yes | Ngày kết thúc | 2025-12-31 |
| limit | integer | No | Số lượng sản phẩm (default: 10) | 20 |

#### Request Example
```http
GET /api/reports/products/top-selling?startDate=2025-01-01&endDate=2025-12-31&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response Example (200 OK)
```json
[
  {
    "productId": 5,
    "productName": "Đắc Nhân Tâm",
    "categoryName": "Kỹ năng sống",
    "totalQuantitySold": 250,
    "totalRevenue": 18750000.0,
    "orderCount": 180,
    "averagePrice": 75000.0
  },
  {
    "productId": 12,
    "productName": "Nhà Giả Kim",
    "categoryName": "Văn học",
    "totalQuantitySold": 220,
    "totalRevenue": 15400000.0,
    "orderCount": 160,
    "averagePrice": 70000.0
  },
  {
    "productId": 8,
    "productName": "Tuổi Trẻ Đáng Giá Bao Nhiêu",
    "categoryName": "Kỹ năng sống",
    "totalQuantitySold": 200,
    "totalRevenue": 16000000.0,
    "orderCount": 150,
    "averagePrice": 80000.0
  }
]
```

---

### 1.4. Thống Kê Người Dùng (User Statistics)

**GET** `/api/reports/users`

Lấy thống kê người dùng theo khoảng thời gian, bao gồm phân tích tăng trưởng và phân bố theo vai trò.

#### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| startDate | date | Yes | Ngày bắt đầu | 2025-01-01 |
| endDate | date | Yes | Ngày kết thúc | 2025-12-31 |

#### Request Example
```http
GET /api/reports/users?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response Example (200 OK)
```json
{
  "totalUsers": 1250,
  "activeUsers": 850,
  "inactiveUsers": 400,
  "newUsersInPeriod": 120,
  "usersByDate": [
    {
      "date": "2025-01-01",
      "newUsers": 5,
      "cumulativeUsers": 1130
    },
    {
      "date": "2025-01-02",
      "newUsers": 8,
      "cumulativeUsers": 1138
    }
  ],
  "usersByRole": [
    {
      "roleId": 1,
      "roleName": "CUSTOMER",
      "userCount": 1200,
      "percentage": 96.0
    },
    {
      "roleId": 2,
      "roleName": "ADMIN",
      "userCount": 30,
      "percentage": 2.4
    },
    {
      "roleId": 3,
      "roleName": "MANAGER",
      "userCount": 20,
      "percentage": 1.6
    }
  ]
}
```

---

### 1.5. Báo Cáo Voucher (Voucher Report)

**GET** `/api/reports/vouchers`

Lấy báo cáo hiệu quả sử dụng voucher theo khoảng thời gian.

#### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| startDate | date | Yes | Ngày bắt đầu | 2025-01-01 |
| endDate | date | Yes | Ngày kết thúc | 2025-12-31 |

#### Request Example
```http
GET /api/reports/vouchers?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response Example (200 OK)
```json
[
  {
    "voucherId": 3,
    "code": "SUMMER2025",
    "discountType": "PERCENTAGE",
    "discountValue": 15.0,
    "totalUsageCount": 85,
    "totalDiscountGiven": 6375000.0,
    "uniqueUsers": 65,
    "isActive": true,
    "startDate": "2025-06-01T00:00:00",
    "endDate": "2025-08-31T23:59:59"
  },
  {
    "voucherId": 5,
    "code": "NEWYEAR2025",
    "discountType": "FIXED",
    "discountValue": 50000.0,
    "totalUsageCount": 120,
    "totalDiscountGiven": 6000000.0,
    "uniqueUsers": 100,
    "isActive": false,
    "startDate": "2025-01-01T00:00:00",
    "endDate": "2025-01-15T23:59:59"
  }
]
```

---

### 1.6. Dashboard Tổng Quan (Dashboard Summary)

**GET** `/api/reports/dashboard`

Lấy tổng quan nhanh về các chỉ số kinh doanh quan trọng (mặc định 30 ngày gần nhất).

#### Request Example
```http
GET /api/reports/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response Example (200 OK)
```json
{
  "revenueData": {
    "totalRevenue": 35000000.0,
    "netRevenue": 32000000.0,
    "totalDiscount": 3000000.0,
    "totalOrders": 120,
    "averageOrderValue": 291666.67,
    "growthRate": 15.5
  },
  "orderData": {
    "totalOrders": 120,
    "paidOrders": 105,
    "pendingOrders": 10,
    "failedOrders": 5,
    "deliveredOrders": 95,
    "cancelledOrders": 8
  },
  "userData": {
    "totalUsers": 1250,
    "newUsers": 35,
    "activeUsers": 280,
    "growthRate": 2.8
  },
  "topProducts": [
    {
      "productId": 5,
      "productName": "Đắc Nhân Tâm",
      "totalQuantitySold": 45,
      "totalRevenue": 3375000.0
    },
    {
      "productId": 12,
      "productName": "Nhà Giả Kim",
      "totalQuantitySold": 38,
      "totalRevenue": 2660000.0
    }
  ],
  "period": {
    "startDate": "2024-11-12T00:00:00",
    "endDate": "2024-12-12T23:59:59",
    "days": 30
  }
}
```

---

## 2. TypeScript Interfaces

```typescript
// ==================== REVENUE REPORT ====================
export interface RevenueReportResponse {
  totalRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  totalShippingFee: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  revenueByDate: RevenueByDate[];
  revenueByPaymentMethod: RevenueByPaymentMethod[];
  revenueByCategory: RevenueByCategory[];
}

export interface RevenueByDate {
  date: string; // ISO date string
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface RevenueByPaymentMethod {
  paymentMethod: 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD';
  revenue: number;
  orderCount: number;
  percentage: number;
}

export interface RevenueByCategory {
  categoryId: number;
  categoryName: string;
  revenue: number;
  orderCount: number;
  percentage: number;
}

// ==================== ORDER STATISTICS ====================
export interface OrderStatisticsResponse {
  totalOrders: number;
  ordersByPaymentStatus: {
    PENDING: number;
    PAID: number;
    FAILED: number;
    REFUNDED: number;
  };
  ordersByFulfillmentStatus: {
    SHIPPING: number;
    DELIVERED: number;
    PICKUP: number;
    RETURNED: number;
  };
  ordersByOrderStatus: {
    CONFIRMED: number;
    CANCELLED: number;
    CLOSED: number;
  };
  ordersByDate: OrdersByDate[];
  ordersByStatus: OrdersByStatus[];
}

export interface OrdersByDate {
  date: string;
  totalOrders: number;
  paidOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
  percentage: number;
}

// ==================== PRODUCT REPORT ====================
export interface ProductReportResponse {
  productId: number;
  productName: string;
  categoryName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  orderCount: number;
  averagePrice: number;
}

// ==================== USER STATISTICS ====================
export interface UserStatisticsResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersInPeriod: number;
  usersByDate: UsersByDate[];
  usersByRole: UsersByRole[];
}

export interface UsersByDate {
  date: string;
  newUsers: number;
  cumulativeUsers: number;
}

export interface UsersByRole {
  roleId: number;
  roleName: string;
  userCount: number;
  percentage: number;
}

// ==================== VOUCHER REPORT ====================
export interface VoucherReportResponse {
  voucherId: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  totalUsageCount: number;
  totalDiscountGiven: number;
  uniqueUsers: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

// ==================== DASHBOARD SUMMARY ====================
export interface DashboardSummaryResponse {
  revenueData: {
    totalRevenue: number;
    netRevenue: number;
    totalDiscount: number;
    totalOrders: number;
    averageOrderValue: number;
    growthRate: number;
  };
  orderData: {
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    failedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  userData: {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    growthRate: number;
  };
  topProducts: Array<{
    productId: number;
    productName: string;
    totalQuantitySold: number;
    totalRevenue: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

// ==================== DATE RANGE PARAMS ====================
export interface DateRangeParams {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface TopProductsParams extends DateRangeParams {
  limit?: number; // Default: 10
}
```

---

## 3. API Service Implementation

```typescript
import axios, { AxiosInstance } from 'axios';
import {
  RevenueReportResponse,
  OrderStatisticsResponse,
  ProductReportResponse,
  UserStatisticsResponse,
  VoucherReportResponse,
  DashboardSummaryResponse,
  DateRangeParams,
  TopProductsParams
} from './types';

class ReportService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:8080/api/reports',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add JWT token to all requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(params: DateRangeParams): Promise<RevenueReportResponse> {
    const response = await this.api.get<RevenueReportResponse>('/revenue', { params });
    return response.data;
  }

  /**
   * Get order statistics
   */
  async getOrderStatistics(params: DateRangeParams): Promise<OrderStatisticsResponse> {
    const response = await this.api.get<OrderStatisticsResponse>('/orders', { params });
    return response.data;
  }

  /**
   * Get top selling products
   */
  async getTopSellingProducts(params: TopProductsParams): Promise<ProductReportResponse[]> {
    const response = await this.api.get<ProductReportResponse[]>('/products/top-selling', { params });
    return response.data;
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(params: DateRangeParams): Promise<UserStatisticsResponse> {
    const response = await this.api.get<UserStatisticsResponse>('/users', { params });
    return response.data;
  }

  /**
   * Get voucher report
   */
  async getVoucherReport(params: DateRangeParams): Promise<VoucherReportResponse[]> {
    const response = await this.api.get<VoucherReportResponse[]>('/vouchers', { params });
    return response.data;
  }

  /**
   * Get dashboard summary (last 30 days)
   */
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    const response = await this.api.get<DashboardSummaryResponse>('/dashboard');
    return response.data;
  }
}

export const reportService = new ReportService();
```

---

## 4. React Components

### 4.1. Dashboard Component

```typescript
import React, { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import { DashboardSummaryResponse } from '../types';
import { Card, Row, Col, Statistic, Table, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, ShoppingOutlined, UserOutlined } from '@ant-design/icons';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const result = await reportService.getDashboardSummary();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <Spin size="large" />;
  }

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Số lượng bán',
      dataIndex: 'totalQuantitySold',
      key: 'totalQuantitySold',
    },
    {
      title: 'Doanh thu',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      render: (value: number) => `${value.toLocaleString('vi-VN')} đ`,
    },
  ];

  return (
    <div className="dashboard">
      <h1>Dashboard Tổng Quan</h1>
      
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Doanh thu (30 ngày)"
              value={data.revenueData.totalRevenue}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="đ"
            />
            <Statistic
              value={data.revenueData.growthRate}
              precision={1}
              valueStyle={{ color: data.revenueData.growthRate >= 0 ? '#3f8600' : '#cf1322' }}
              prefix={data.revenueData.growthRate >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix="%"
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="Đơn hàng"
              value={data.orderData.totalOrders}
              prefix={<ShoppingOutlined />}
            />
            <div style={{ marginTop: 16, fontSize: 14 }}>
              <div>Đã thanh toán: {data.orderData.paidOrders}</div>
              <div>Đã giao: {data.orderData.deliveredOrders}</div>
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="Người dùng"
              value={data.userData.totalUsers}
              prefix={<UserOutlined />}
            />
            <Statistic
              value={data.userData.growthRate}
              precision={1}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Card title="Top 5 Sản Phẩm Bán Chạy" style={{ marginTop: 16 }}>
        <Table
          dataSource={data.topProducts}
          columns={columns}
          pagination={false}
          rowKey="productId"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
```

### 4.2. Revenue Report Component with Charts

```typescript
import React, { useState } from 'react';
import { Card, DatePicker, Button, Row, Col, Statistic, Spin } from 'antd';
import { Line, Pie } from '@ant-design/plots';
import { reportService } from '../services/reportService';
import { RevenueReportResponse } from '../types';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

const RevenueReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [data, setData] = useState<RevenueReportResponse | null>(null);

  const fetchRevenueReport = async () => {
    setLoading(true);
    try {
      const result = await reportService.getRevenueReport({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      });
      setData(result);
    } catch (error) {
      console.error('Failed to fetch revenue report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Line chart config
  const lineConfig = {
    data: data?.revenueByDate || [],
    xField: 'date',
    yField: 'revenue',
    point: {
      size: 5,
      shape: 'diamond',
    },
    label: {
      style: {
        fill: '#aaa',
      },
    },
  };

  // Pie chart config for payment methods
  const pieConfig = {
    data: data?.revenueByPaymentMethod || [],
    angleField: 'revenue',
    colorField: 'paymentMethod',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [{ type: 'element-active' }],
  };

  return (
    <div className="revenue-report">
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col>
            <Button type="primary" onClick={fetchRevenueReport} loading={loading}>
              Tạo báo cáo
            </Button>
          </Col>
        </Row>
      </Card>

      {loading && <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />}

      {data && (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng doanh thu"
                  value={data.totalRevenue}
                  precision={0}
                  suffix="đ"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Doanh thu thuần"
                  value={data.netRevenue}
                  precision={0}
                  suffix="đ"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng đơn hàng"
                  value={data.totalOrders}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Đơn đã thanh toán"
                  value={data.paidOrders}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Biểu đồ doanh thu theo ngày" style={{ marginTop: 16 }}>
            <Line {...lineConfig} />
          </Card>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Card title="Doanh thu theo phương thức thanh toán">
                <Pie {...pieConfig} />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Doanh thu theo danh mục">
                <Pie
                  {...{
                    ...pieConfig,
                    data: data.revenueByCategory,
                    colorField: 'categoryName',
                  }}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default RevenueReport;
```

### 4.3. Order Statistics Component

```typescript
import React, { useState } from 'react';
import { Card, DatePicker, Button, Row, Col, Spin, Table } from 'antd';
import { Column } from '@ant-design/plots';
import { reportService } from '../services/reportService';
import { OrderStatisticsResponse } from '../types';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

const OrderStatistics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [data, setData] = useState<OrderStatisticsResponse | null>(null);

  const fetchOrderStatistics = async () => {
    setLoading(true);
    try {
      const result = await reportService.getOrderStatistics({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      });
      setData(result);
    } catch (error) {
      console.error('Failed to fetch order statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Số lượng',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: 'Tỷ lệ',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (value: number) => `${value.toFixed(2)}%`,
    },
  ];

  // Column chart config
  const columnConfig = {
    data: data?.ordersByDate || [],
    xField: 'date',
    yField: 'totalOrders',
    label: {
      position: 'middle' as const,
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
  };

  return (
    <div className="order-statistics">
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col>
            <Button type="primary" onClick={fetchOrderStatistics} loading={loading}>
              Tạo báo cáo
            </Button>
          </Col>
        </Row>
      </Card>

      {loading && <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />}

      {data && (
        <>
          <Card title="Biểu đồ đơn hàng theo ngày" style={{ marginTop: 16 }}>
            <Column {...columnConfig} />
          </Card>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Card title="Trạng thái thanh toán">
                <div>Chờ thanh toán: {data.ordersByPaymentStatus.PENDING}</div>
                <div>Đã thanh toán: {data.ordersByPaymentStatus.PAID}</div>
                <div>Thất bại: {data.ordersByPaymentStatus.FAILED}</div>
                <div>Hoàn tiền: {data.ordersByPaymentStatus.REFUNDED}</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="Trạng thái vận chuyển">
                <div>Đang giao: {data.ordersByFulfillmentStatus.SHIPPING}</div>
                <div>Đã giao: {data.ordersByFulfillmentStatus.DELIVERED}</div>
                <div>Lấy tại cửa hàng: {data.ordersByFulfillmentStatus.PICKUP}</div>
                <div>Trả hàng: {data.ordersByFulfillmentStatus.RETURNED}</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="Trạng thái đơn hàng">
                <div>Đã xác nhận: {data.ordersByOrderStatus.CONFIRMED}</div>
                <div>Đã hủy: {data.ordersByOrderStatus.CANCELLED}</div>
                <div>Đã đóng: {data.ordersByOrderStatus.CLOSED}</div>
              </Card>
            </Col>
          </Row>

          <Card title="Phân bố trạng thái" style={{ marginTop: 16 }}>
            <Table
              dataSource={data.ordersByStatus}
              columns={columns}
              pagination={false}
              rowKey="status"
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default OrderStatistics;
```

### 4.4. Top Selling Products Component

```typescript
import React, { useState } from 'react';
import { Card, DatePicker, Button, Row, Col, Spin, Table, InputNumber } from 'antd';
import { reportService } from '../services/reportService';
import { ProductReportResponse } from '../types';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

const TopSellingProducts: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState<ProductReportResponse[]>([]);

  const fetchTopProducts = async () => {
    setLoading(true);
    try {
      const result = await reportService.getTopSellingProducts({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        limit,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to fetch top selling products:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      render: (_: any, __: any, index: number) => index + 1,
      width: 60,
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Danh mục',
      dataIndex: 'categoryName',
      key: 'categoryName',
    },
    {
      title: 'Số lượng bán',
      dataIndex: 'totalQuantitySold',
      key: 'totalQuantitySold',
      sorter: (a: ProductReportResponse, b: ProductReportResponse) => 
        b.totalQuantitySold - a.totalQuantitySold,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      render: (value: number) => `${value.toLocaleString('vi-VN')} đ`,
      sorter: (a: ProductReportResponse, b: ProductReportResponse) => 
        b.totalRevenue - a.totalRevenue,
    },
    {
      title: 'Số đơn hàng',
      dataIndex: 'orderCount',
      key: 'orderCount',
    },
    {
      title: 'Giá trung bình',
      dataIndex: 'averagePrice',
      key: 'averagePrice',
      render: (value: number) => `${value.toLocaleString('vi-VN')} đ`,
    },
  ];

  return (
    <div className="top-selling-products">
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col>
            <InputNumber
              min={1}
              max={100}
              value={limit}
              onChange={(value) => value && setLimit(value)}
              addonBefore="Top"
            />
          </Col>
          <Col>
            <Button type="primary" onClick={fetchTopProducts} loading={loading}>
              Tạo báo cáo
            </Button>
          </Col>
        </Row>
      </Card>

      {loading && <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />}

      {data.length > 0 && (
        <Card title={`Top ${limit} Sản Phẩm Bán Chạy`} style={{ marginTop: 16 }}>
          <Table
            dataSource={data}
            columns={columns}
            pagination={false}
            rowKey="productId"
          />
        </Card>
      )}
    </div>
  );
};

export default TopSellingProducts;
```

---

## 5. Export Functionality

### 5.1. Export to CSV

```typescript
import { RevenueReportResponse, ProductReportResponse, OrderStatisticsResponse } from '../types';

export class ExportService {
  /**
   * Export revenue report to CSV
   */
  static exportRevenueToCSV(data: RevenueReportResponse) {
    let csv = 'Date,Revenue,Order Count,Average Order Value\n';
    
    data.revenueByDate.forEach(row => {
      csv += `${row.date},${row.revenue},${row.orderCount},${row.averageOrderValue}\n`;
    });

    csv += '\n\nPayment Method,Revenue,Order Count,Percentage\n';
    data.revenueByPaymentMethod.forEach(row => {
      csv += `${row.paymentMethod},${row.revenue},${row.orderCount},${row.percentage}\n`;
    });

    csv += '\n\nCategory,Revenue,Order Count,Percentage\n';
    data.revenueByCategory.forEach(row => {
      csv += `${row.categoryName},${row.revenue},${row.orderCount},${row.percentage}\n`;
    });

    this.downloadCSV(csv, 'revenue-report.csv');
  }

  /**
   * Export top products to CSV
   */
  static exportProductsToCSV(data: ProductReportResponse[]) {
    let csv = 'Product Name,Category,Quantity Sold,Revenue,Order Count,Average Price\n';
    
    data.forEach(row => {
      csv += `${row.productName},${row.categoryName},${row.totalQuantitySold},${row.totalRevenue},${row.orderCount},${row.averagePrice}\n`;
    });

    this.downloadCSV(csv, 'top-products.csv');
  }

  /**
   * Download CSV file
   */
  private static downloadCSV(csv: string, filename: string) {
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
```

### 5.2. Usage in Component

```typescript
import { ExportService } from '../services/exportService';

// Inside your component
const handleExport = () => {
  if (data) {
    ExportService.exportRevenueToCSV(data);
  }
};

// Add export button
<Button onClick={handleExport} icon={<DownloadOutlined />}>
  Xuất CSV
</Button>
```

---

## 6. Error Handling

```typescript
// In your API service
this.api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden - insufficient permissions
          message.error('Bạn không có quyền truy cập tính năng này');
          break;
        case 404:
          message.error('Không tìm thấy dữ liệu');
          break;
        case 500:
          message.error('Lỗi server, vui lòng thử lại sau');
          break;
        default:
          message.error('Đã xảy ra lỗi, vui lòng thử lại');
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 7. Notes

### Performance Considerations
- Báo cáo doanh thu tính toán từ các đơn hàng đã thanh toán (PAID status)
- Các thống kê phức tạp sử dụng Java Stream API để xử lý trong bộ nhớ
- Nên giới hạn khoảng thời gian không quá 1 năm để tránh performance issues
- Top selling products có limit mặc định là 10, có thể tùy chỉnh

### Data Accuracy
- Tất cả tính toán dựa trên `createdAt` của đơn hàng
- Doanh thu thuần = Tổng doanh thu - Giảm giá
- Active users: Người dùng có ít nhất 1 đơn hàng
- Phần trăm được tính toán với 2 chữ số thập phân

### Security
- Tất cả endpoints yêu cầu JWT token hợp lệ
- Chỉ ADMIN và MANAGER có quyền truy cập
- Không có rate limiting hiện tại (nên thêm trong production)

### Future Enhancements
- Export to Excel với formatting
- Real-time dashboard với WebSocket
- Email scheduled reports
- Custom date ranges (last 7 days, last 30 days, this month, etc.)
- More detailed analytics (conversion rate, customer lifetime value, etc.)
- Caching layer cho các báo cáo thường xuyên

---

## 8. Testing

### 8.1. Manual Testing với Postman

```bash
# 1. Login to get JWT token
POST http://localhost:8080/api/auth/login
Body: {
  "username": "admin",
  "password": "admin123"
}

# 2. Test Revenue Report
GET http://localhost:8080/api/reports/revenue?startDate=2025-01-01&endDate=2025-12-31
Headers: Authorization: Bearer <token>

# 3. Test Dashboard
GET http://localhost:8080/api/reports/dashboard
Headers: Authorization: Bearer <token>
```

### 8.2. Frontend Testing Checklist

- [ ] Dashboard loads correctly with last 30 days data
- [ ] Date range picker works properly
- [ ] Charts render correctly with data
- [ ] Export CSV functionality works
- [ ] Loading states display properly
- [ ] Error messages display for API failures
- [ ] Unauthorized access redirects to login
- [ ] Data formatting (currency, percentages) displays correctly
- [ ] Responsive design on mobile devices
- [ ] Table sorting works correctly

---

## Contact & Support

Để biết thêm chi tiết hoặc có thắc mắc, vui lòng liên hệ team Backend hoặc tham khảo:
- [ROLE_MANAGEMENT_API.md](./ROLE_MANAGEMENT_API.md)
- [ADMIN_ORDER_MANAGEMENT_API.md](./ADMIN_ORDER_MANAGEMENT_API.md)

---

**Lưu ý**: Tài liệu này được tạo cho phiên bản API v1.0. Các phiên bản sau có thể có thay đổi.
