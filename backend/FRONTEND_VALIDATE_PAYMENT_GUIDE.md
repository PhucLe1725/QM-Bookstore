# 🔐 Hướng Dẫn Tích Hợp API Xác Thực Thanh Toán

## 📋 Tổng Quan

API này cho phép xác thực giao dịch chuyển khoản ngân hàng với đơn hàng, tự động so khớp số tiền và nội dung chuyển khoản để xác nhận thanh toán.

---

## 🔗 API Endpoint

### POST `/api/orders/{orderId}/validate-payment`

**Mô tả:** Xác thực thanh toán đơn hàng bằng cách tìm giao dịch khớp với `transferContent`, số tiền và thời gian.

---

## 📥 Request

### Headers
```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Path Parameters
| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| `orderId` | Long | ✅ | ID đơn hàng cần xác thực thanh toán |

### Body Parameters
Không cần body (hoặc `{}` nếu backend yêu cầu)

---

## 📤 Response

### Success Response (200 OK)
```json
{
  "code": 1000,
  "message": "Đã xác nhận thanh toán thành công",
  "result": {
    "id": 22,
    "userId": "77f57037-9eb2-4983-b8bf-f1878583ef13",
    "orderStatus": "CONFIRMED",
    "paymentStatus": "PAID",
    "paymentMethod": "BANK_TRANSFER",
    "fulfillmentMethod": "DELIVERY",
    "fulfillmentStatus": "PENDING",
    "receiverName": "Nguyễn Văn A",
    "receiverPhone": "0912345678",
    "receiverAddress": "123 Đường ABC, Quận 1, TP.HCM",
    "subtotalAmount": 500000.00,
    "shippingFee": 30000.00,
    "discountAmount": 0.00,
    "totalAmount": 530000.00,
    "transferContent": "QM-ORD22",
    "transactionId": 45,
    "note": null,
    "cancelReason": null,
    "expectedDeliveryTime": "2025-12-10T14:30:00",
    "createdAt": "2025-12-06T10:15:30",
    "updatedAt": "2025-12-06T12:33:16",
    "items": [
      {
        "id": 55,
        "productId": 12,
        "productName": "Sách Lập Trình Java",
        "quantity": 2,
        "unitPrice": 250000.00,
        "lineTotal": 500000.00
      }
    ]
  }
}
```

### Error Responses

#### 404 - Đơn hàng không tồn tại
```json
{
  "code": 1006,
  "message": "Đơn hàng không tồn tại"
}
```

#### 403 - Không có quyền truy cập
```json
{
  "code": 1007,
  "message": "Bạn không có quyền truy cập đơn hàng này"
}
```

#### 400 - Không tìm thấy giao dịch
```json
{
  "code": 1008,
  "message": "Không tìm thấy giao dịch khớp với đơn hàng này trong 24 giờ qua"
}
```

#### 400 - Đơn hàng đã xác nhận
```json
{
  "code": 1009,
  "message": "Đơn hàng đã được xác nhận thanh toán trước đó"
}
```

---

## 💻 Frontend Implementation

### 1. Service Layer (API Client)

```typescript
// services/orderService.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface ValidatePaymentResponse {
  code: number;
  message: string;
  result: {
    id: number;
    orderStatus: string;
    paymentStatus: string;
    totalAmount: number;
    transactionId: number | null;
    // ... các field khác
  };
}

export const validatePayment = async (
  orderId: number,
  accessToken: string
): Promise<ValidatePaymentResponse> => {
  const response = await axios.post(
    `${API_BASE_URL}/orders/${orderId}/validate-payment`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
};
```

### 2. React Component với Manual Validation

```tsx
// components/OrderPaymentValidator.tsx
'use client';

import { useState } from 'react';
import { validatePayment } from '@/services/orderService';
import { useAuth } from '@/hooks/useAuth'; // Hook lấy accessToken

interface Props {
  orderId: number;
  onSuccess?: () => void;
}

export default function OrderPaymentValidator({ orderId, onSuccess }: Props) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleValidate = async () => {
    if (!accessToken) {
      setError('Bạn chưa đăng nhập');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await validatePayment(orderId, accessToken);
      
      if (response.code === 1000) {
        setSuccess(true);
        setError(null);
        
        // Gọi callback để refresh dữ liệu
        if (onSuccess) {
          onSuccess();
        }

        // Redirect sau 2 giây
        setTimeout(() => {
          window.location.href = `/orders/${orderId}`;
        }, 2000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi xác thực thanh toán';
      setError(errorMsg);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-validator">
      <button
        onClick={handleValidate}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Đang kiểm tra...' : 'Xác nhận đã thanh toán'}
      </button>

      {success && (
        <div className="alert alert-success mt-3">
          ✅ Thanh toán đã được xác nhận thành công! Đang chuyển hướng...
        </div>
      )}

      {error && (
        <div className="alert alert-danger mt-3">
          ❌ {error}
        </div>
      )}
    </div>
  );
}
```

### 3. Auto Polling Component (Tự Động Kiểm Tra)

```tsx
// components/AutoPaymentChecker.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { validatePayment } from '@/services/orderService';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  orderId: number;
  intervalMs?: number; // Khoảng thời gian polling (mặc định 10 giây)
  maxAttempts?: number; // Số lần thử tối đa (mặc định 20 lần)
  onSuccess?: () => void;
}

export default function AutoPaymentChecker({ 
  orderId, 
  intervalMs = 10000,
  maxAttempts = 20,
  onSuccess 
}: Props) {
  const { accessToken } = useAuth();
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<'checking' | 'success' | 'failed' | 'timeout'>('checking');
  const [message, setMessage] = useState('Đang chờ xác nhận thanh toán...');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!accessToken || attempts >= maxAttempts) {
      return;
    }

    const checkPayment = async () => {
      try {
        const response = await validatePayment(orderId, accessToken);
        
        if (response.code === 1000) {
          setStatus('success');
          setMessage('✅ Thanh toán đã được xác nhận!');
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          if (onSuccess) {
            onSuccess();
          }
        }
      } catch (err: any) {
        const errorCode = err.response?.data?.code;
        
        // Nếu đơn hàng đã xác nhận trước đó
        if (errorCode === 1009) {
          setStatus('success');
          setMessage('Đơn hàng đã được xác nhận thanh toán');
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return;
        }

        // Tiếp tục polling cho các lỗi khác
        setAttempts(prev => prev + 1);
      }
    };

    // Chạy lần đầu ngay lập tức
    checkPayment();

    // Setup interval
    intervalRef.current = setInterval(() => {
      checkPayment();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [orderId, accessToken, attempts, maxAttempts, intervalMs, onSuccess]);

  useEffect(() => {
    if (attempts >= maxAttempts && status === 'checking') {
      setStatus('timeout');
      setMessage('⏱️ Đã hết thời gian chờ. Vui lòng kiểm tra lại sau.');
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [attempts, maxAttempts, status]);

  return (
    <div className="auto-payment-checker">
      <div className={`alert ${
        status === 'success' ? 'alert-success' :
        status === 'timeout' ? 'alert-warning' :
        'alert-info'
      }`}>
        {status === 'checking' && (
          <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span>{message} (Lần thử: {attempts}/{maxAttempts})</span>
          </div>
        )}
        {status !== 'checking' && <span>{message}</span>}
      </div>

      {status === 'timeout' && (
        <button 
          onClick={() => {
            setAttempts(0);
            setStatus('checking');
            setMessage('Đang chờ xác nhận thanh toán...');
          }}
          className="btn btn-secondary"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
```

### 4. Page Usage Example

```tsx
// app/orders/[id]/payment/page.tsx
'use client';

import { useParams } from 'next/navigation';
import OrderPaymentValidator from '@/components/OrderPaymentValidator';
import AutoPaymentChecker from '@/components/AutoPaymentChecker';

export default function PaymentPage() {
  const params = useParams();
  const orderId = Number(params.id);

  const handlePaymentSuccess = () => {
    console.log('Payment validated successfully!');
    // Refresh order data, show notification, etc.
  };

  return (
    <div className="container py-5">
      <h2>Xác Nhận Thanh Toán Đơn Hàng #{orderId}</h2>
      
      <div className="card mt-4">
        <div className="card-body">
          <h5>Thông tin chuyển khoản</h5>
          <p>Số tiền: 530.000đ</p>
          <p>Nội dung: QM-ORD{orderId}</p>
          
          {/* Tự động kiểm tra mỗi 10 giây */}
          <AutoPaymentChecker 
            orderId={orderId}
            intervalMs={10000}
            maxAttempts={30}
            onSuccess={handlePaymentSuccess}
          />
          
          {/* Hoặc nút xác nhận thủ công */}
          <div className="mt-3">
            <OrderPaymentValidator 
              orderId={orderId}
              onSuccess={handlePaymentSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔄 Business Logic Flow

```
1. User tạo đơn hàng → Nhận transferContent (VD: QM-ORD22)
2. User chuyển khoản ngân hàng với nội dung QM-ORD22
3. Backend nhận email webhook → Parse transaction → Lưu vào DB
4. Frontend gọi validate-payment API
5. Backend tìm transaction:
   - transferContent LIKE %QM-ORD22%
   - amount = totalAmount
   - transactionDate >= order.createdAt - 1 giờ
6. Nếu tìm thấy:
   - Cập nhật order.paymentStatus = PAID
   - Cập nhật order.orderStatus = CONFIRMED
   - Liên kết transaction với order
7. Return order đã cập nhật
```

---

## ⚙️ Configuration

### Environment Variables (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_POLLING_INTERVAL=10000
NEXT_PUBLIC_MAX_POLLING_ATTEMPTS=30
```

---

## 🧪 Testing

### Postman Request
```bash
curl -X POST http://localhost:8080/api/orders/22/validate-payment \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### Frontend Testing Checklist
- [ ] Test với đơn hàng chưa thanh toán
- [ ] Test với đơn hàng đã thanh toán (should return 1009)
- [ ] Test với orderId không tồn tại (should return 1006)
- [ ] Test với user không sở hữu đơn hàng (should return 1007)
- [ ] Test polling timeout scenario
- [ ] Test network error handling

---

## 📊 State Management (Optional - Redux/Zustand)

```typescript
// store/orderStore.ts (Zustand example)
import { create } from 'zustand';
import { validatePayment } from '@/services/orderService';

interface OrderStore {
  validating: boolean;
  error: string | null;
  validateOrderPayment: (orderId: number, token: string) => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set) => ({
  validating: false,
  error: null,
  
  validateOrderPayment: async (orderId, token) => {
    set({ validating: true, error: null });
    
    try {
      await validatePayment(orderId, token);
      set({ validating: false });
    } catch (error: any) {
      set({ 
        validating: false, 
        error: error.response?.data?.message || 'Validation failed' 
      });
    }
  }
}));
```

---

## 🎨 UI/UX Recommendations

1. **Loading State**: Hiển thị spinner khi đang validate
2. **Success State**: Thông báo xanh + redirect sau 2-3 giây
3. **Error State**: Thông báo đỏ với hướng dẫn cụ thể
4. **Auto-refresh**: Polling mỗi 10 giây, timeout sau 5 phút
5. **Manual Button**: Nút "Tôi đã chuyển khoản" để trigger validate ngay

---

## 🔐 Security Notes

- ✅ Luôn gửi `Authorization: Bearer {token}` header
- ✅ Backend verify user ownership (user chỉ validate được đơn của mình)
- ✅ Backend validate amount, transferContent, timeframe
- ✅ Transaction chỉ được link với 1 order duy nhất

---

## 📞 Support

Nếu có vấn đề, kiểm tra:
1. Backend logs: `Hibernate: select ... from transactions`
2. Transaction có tồn tại trong DB với `transfer_content` khớp không?
3. `transactionDate` có nằm trong khoảng 1 giờ trước `order.createdAt` không?
4. User token có hợp lệ và khớp với `order.userId` không?
