# Hướng dẫn Fix OffsetDateTime sang LocalDateTime

## Vấn đề
Hiện tại trong codebase có sự không nhất quán giữa `OffsetDateTime` và `LocalDateTime`. Để đảm bảo tính nhất quán, chúng ta cần chuẩn hóa toàn bộ về `LocalDateTime`.

## Các file cần cập nhật

### 1. Entity Files (đã cập nhật một phần)
- ✅ `User.java` - đã cập nhật
- ✅ `RefreshToken.java` - đã cập nhật  
- ✅ `Voucher.java` - đã cập nhật
- ❌ `Product.java` - cần cập nhật
- ❌ `ProductImage.java` - cần cập nhật
- ❌ `Order.java` - cần cập nhật
- ❌ `OrderItem.java` - cần cập nhật
- ❌ `Category.java` - cần cập nhật

### 2. Repository Files
- ✅ `VoucherRepository.java` - đã cập nhật
- ❌ `OrderRepository.java` - có thể cần cập nhật

### 3. Service Files
- ✅ `AuthService.java` - đã cập nhật
- ✅ `UserService.java` - đã cập nhật

## Cách fix

### Pattern cần thay đổi:

```java
// CŨ
import java.time.OffsetDateTime;
private OffsetDateTime createdAt = OffsetDateTime.now();

// MỚI  
import java.time.LocalDateTime;
private LocalDateTime createdAt = LocalDateTime.now();
```

### Lưu ý quan trọng

1. **LocalDateTime vs OffsetDateTime**:
   - `LocalDateTime`: Không có thông tin timezone, phù hợp khi ứng dụng chạy trong một timezone cố định
   - `OffsetDateTime`: Có thông tin timezone, phù hợp cho ứng dụng multi-timezone

2. **Database Compatibility**:
   - PostgreSQL: Cả hai đều map đến `TIMESTAMP`
   - MySQL: Cả hai đều map đến `DATETIME`
   - Không có vấn đề compatibility với database

3. **JSON Serialization**:
   - Cần đảm bảo Jackson configuration phù hợp
   - Có thể cần thêm annotation `@JsonFormat` nếu cần format cụ thể

## Recommended Actions

1. **Cập nhật tất cả entity về LocalDateTime** (khuyến nghị)
2. **Cập nhật tất cả repository methods**
3. **Kiểm tra các service methods**
4. **Test API endpoints để đảm bảo JSON serialization hoạt động đúng**

## Alternative: Giữ nguyên OffsetDateTime

Nếu muốn giữ nguyên `OffsetDateTime` (cho ứng dụng multi-timezone), thì:
1. Revert User.java về OffsetDateTime
2. Revert các file khác về OffsetDateTime
3. Cập nhật AuthService về OffsetDateTime

## Current Status - ✅ HOÀN THÀNH
- ✅ User entity: LocalDateTime
- ✅ RefreshToken entity: LocalDateTime  
- ✅ Voucher entity: LocalDateTime
- ✅ Product entity: LocalDateTime
- ✅ ProductImage entity: LocalDateTime
- ✅ Order entity: LocalDateTime
- ✅ OrderItem entity: LocalDateTime
- ✅ Category entity: LocalDateTime
- ✅ Cart entity: LocalDateTime
- ✅ CartItem entity: LocalDateTime
- ✅ ChatMessage entity: LocalDateTime (đã có sẵn)
- ✅ ProductCombo entity: Không có timestamp fields
- ✅ AuthService: LocalDateTime
- ✅ UserService: LocalDateTime
- ✅ VoucherRepository: LocalDateTime
- ✅ OrderRepository: Cleaned imports

## ✅ CHUẨN HÓA HOÀN TẤT

Tất cả entities và services đã được chuẩn hóa về `LocalDateTime`. 
Hệ thống hiện đã nhất quán 100%.