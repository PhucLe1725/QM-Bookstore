# SHIPPING REFACTORING - SUMMARY

## ✅ Đã hoàn thành

### 1. Backend Documentation
**File:** `/backend/SHIPPING-AND-GOONG-API-SPEC.md`

Chi tiết đầy đủ về:
- API endpoints cần implement
- Request/Response format
- Business logic và công thức tính phí
- DTOs và models
- Configuration
- Implementation steps
- Error codes
- Testing guidelines

### 2. Frontend Service Layer
**File:** `/frontend/src/services/shippingService.js` ✨ MỚI

Service wrapper để gọi backend shipping API:
```javascript
shippingService.calculateShippingFee({ receiverAddress, subtotal })
```

**File:** `/frontend/src/services/index.js`
- Đã export shippingService

### 3. Code Cleanup - Checkout.jsx
**File:** `/frontend/src/pages/Checkout.jsx`

**Đã xóa/comment:**
- ❌ `geocodeAndCalculateRoute()` - Direct Goong API calls
- ❌ `calculateShippingFee()` - Frontend shipping calculation

**Đã thay thế:**
- ✅ `calculateShippingFeeFromBackend()` - Gọi backend API
- ✅ `handleAddressChange()` - Sử dụng shippingService
- ✅ `calculateSummary()` - Dùng shipping fee từ backend

**Đã thêm:**
- Import `shippingService`
- Import `useToast` để hiển thị lỗi
- Error handling khi API call fails

### 4. Documentation Updates
**File:** `/frontend/src/components/AddressSelector.jsx`

Đã thêm comment block warning:
```javascript
/**
 * ⚠️ NOTE: This component currently uses GoongAPI directly
 * TODO: Refactor to use backend APIs
 * See: /backend/SHIPPING-AND-GOONG-API-SPEC.md
 */
```

---

## 🎯 Kiến trúc mới

### Trước (❌ SAI):
```
Frontend → GoongAPI (trực tiếp)
Frontend → Tính phí ship (business logic)
```

### Sau (✅ ĐÚNG):
```
Frontend → Backend API → GoongAPI
Backend → Tính phí ship (business logic)
Frontend → Chỉ hiển thị kết quả
```

---

## 📋 Backend cần implement

### 1. Controller: `ShippingController.java`
```java
@RestController
@RequestMapping("/api/shipping")
public class ShippingController {
    
    @PostMapping("/calculate")
    public ResponseObject<ShippingCalculationResponse> calculateShippingFee(
        @RequestBody @Valid ShippingCalculationRequest request
    ) {
        // Implementation here
    }
}
```

### 2. Service: `GoongService.java`
```java
@Service
public class GoongService {
    public Coordinates geocodeAddress(String address) { }
    public RouteInfo calculateRoute(Coordinates origin, Coordinates destination) { }
}
```

### 3. Service: `ShippingService.java`
```java
@Service
public class ShippingService {
    public ShippingCalculationResponse calculateShippingFee(ShippingCalculationRequest request) {
        // 1. Geocode address
        // 2. Calculate route distance
        // 3. Apply business rules
        // 4. Check free shipping threshold
    }
}
```

### 4. DTOs trong `dto/shipping/`
- `ShippingCalculationRequest.java`
- `ShippingCalculationResponse.java`
- `ShippingFeeDetails.java`
- `Coordinates.java`
- `RouteInfo.java`
- Goong API response DTOs

### 5. Error Codes
```java
GEOCODING_FAILED(6001, "..."),
ROUTE_CALCULATION_FAILED(6002, "..."),
INVALID_ADDRESS(6003, "..."),
...
```

### 6. System Config
```sql
INSERT INTO system_config VALUES
('store_latitude', '10.762622', 'Vĩ độ của cửa hàng'),
('store_longitude', '106.660172', 'Kinh độ của cửa hàng'),
('free_shipping_threshold', '500000', 'Miễn phí ship cho đơn trên giá trị này');
```

---

## 🔐 Bảo mật đã cải thiện

### Trước:
- ❌ GOONG_API_KEY exposed trong frontend `.env`
- ❌ API key gửi từ browser (có thể bị lộ)
- ❌ Business logic (công thức tính phí) trong frontend (có thể bị reverse engineer)

### Sau:
- ✅ API key chỉ trong backend `application.properties`
- ✅ Frontend không biết API key
- ✅ Business logic được bảo vệ trong backend
- ✅ Frontend chỉ gọi internal API

---

## 🧪 Testing Plan

### Backend Tests
1. **Unit Tests:**
   - `GoongService.geocodeAddress()` - với valid/invalid addresses
   - `GoongService.calculateRoute()` - với coordinates
   - `ShippingService.calculateShippingFee()` - business logic
   - Free shipping threshold logic

2. **Integration Tests:**
   - End-to-end: address → shipping fee
   - Mock Goong API responses
   - Test error scenarios (API timeout, invalid address)

### Frontend Tests
1. **Component Tests:**
   - Checkout component với delivery method
   - Address change triggers API call
   - Error handling displays toast

2. **Manual Testing:**
   - Nhập địa chỉ → verify shipping fee calculated
   - Change address → verify fee updates
   - Pickup method → verify shipping fee = 0
   - Free shipping threshold → verify fee = 0

---

## 📊 API Contract

### Request Example:
```json
POST /api/shipping/calculate
{
  "receiverAddress": "123 Nguyễn Huệ, Quận 1, TP.HCM",
  "subtotal": 500000
}
```

### Response Example:
```json
{
  "success": true,
  "code": 200,
  "result": {
    "shippingFee": 25000,
    "distance": 8.5,
    "duration": 25,
    "freeShipping": false,
    "details": {
      "baseFee": 15000,
      "additionalFee": 10000,
      "calculation": "15000 (5km đầu) + 10000 (3.5km x 3000đ/km)"
    }
  }
}
```

### Error Response:
```json
{
  "success": false,
  "code": 6003,
  "message": "Địa chỉ không hợp lệ"
}
```

---

## 🚀 Deployment Checklist

### Backend:
- [ ] Implement all services và DTOs
- [ ] Add error codes to ErrorCode.java
- [ ] Configure `application.properties` với Goong API keys
- [ ] Add system_config data (store location)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test với real Goong API
- [ ] Deploy backend

### Frontend:
- [ ] Xóa GOONG_API_KEY khỏi `.env` (sau khi backend ready)
- [ ] Test shipping calculation flow
- [ ] Test error scenarios
- [ ] Verify toast notifications
- [ ] Deploy frontend

### Optional Future Enhancements:
- [ ] Cache geocoding results (24h)
- [ ] Cache route calculations
- [ ] Add rate limiting
- [ ] Monitor Goong API usage
- [ ] Fallback to default fee nếu API fails
- [ ] Batch calculate multiple addresses

---

## 📝 Notes

1. **AddressSelector.jsx** vẫn dùng GoongAPI trực tiếp cho map display và place autocomplete
   - Có thể refactor sau nếu cần
   - Ưu tiên cao: shipping calculation (đã xong)
   - Ưu tiên thấp: map UI components

2. **Backward Compatibility**
   - Frontend đã sẵn sàng cho backend API
   - Nếu backend chưa ready, API call sẽ fail và show toast error
   - User vẫn có thể checkout với pickup method (không cần shipping calculation)

3. **Environment Variables**
   - Frontend vẫn giữ GOONG_API_KEY cho map display (tạm thời)
   - Sau khi refactor AddressSelector → có thể xóa hoàn toàn

---

## 📚 References

- Backend Spec: `/backend/SHIPPING-AND-GOONG-API-SPEC.md`
- Frontend Service: `/frontend/src/services/shippingService.js`
- Modified Files:
  - `/frontend/src/pages/Checkout.jsx`
  - `/frontend/src/components/AddressSelector.jsx` (chỉ thêm comment)
  - `/frontend/src/services/index.js`

---

**Status:** ✅ Frontend refactoring hoàn tất - Đang chờ backend implementation
