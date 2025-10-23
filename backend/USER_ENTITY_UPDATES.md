# User Entity Updates

## Thay đổi chính trong cấu trúc database User

### 1. Entity Changes (`User.java`)

#### Các trường mới được thêm:
- `fullName` - VARCHAR(255): Tên đầy đủ của người dùng
- `phoneNumber` - VARCHAR(20): Số điện thoại
- `address` - TEXT: Địa chỉ
- `status` - BOOLEAN (DEFAULT TRUE): Trạng thái tài khoản
- `points` - INT (DEFAULT 0): Điểm tích lũy
- `balance` - DECIMAL(12,2) (DEFAULT 0): Số dư tài khoản
- `totalPurchase` - DECIMAL(14,2) (DEFAULT 0): Tổng tiền đã mua
- `membershipLevel` - ENUM: Cấp độ thành viên (basic, silver, gold, platinum)

#### Các thay đổi khác:
- `username`: Độ dài tăng từ 50 lên 100 ký tự
- `email`: Bỏ constraint NOT NULL và UNIQUE (giờ có thể null)
- `role_id`: Bỏ constraint NOT NULL
- Thay đổi kiểu thời gian từ `OffsetDateTime` sang `LocalDateTime`

### 2. Role Entity Changes (`Role.java`)
- Thay đổi kiểu ID từ `Long` sang `Integer` để khớp với database schema

### 3. DTO Updates

#### UserResponse:
- Thêm tất cả các trường mới từ entity
- Cập nhật kiểu `roleId` từ `Long` sang `Integer`
- Cập nhật kiểu thời gian từ `OffsetDateTime` sang `LocalDateTime`

#### UserCreateRequest:
- Thêm tất cả các trường mới (optional)
- Cập nhật kiểu `roleId` từ `Long` sang `Integer`

#### UserUpdateRequest:
- Thêm tất cả các trường mới (optional)
- Cập nhật kiểu `roleId` từ `Long` sang `Integer`

#### UserGetAllRequest:
- Cập nhật kiểu `roleId` từ `Long` sang `Integer`

### 4. Service Updates (`UserService.java`)

#### UserService.createUser():
- Thêm logic set default values cho các trường mới
- Cập nhật kiểu thời gian

#### UserService.updateUser():
- Thêm logic cập nhật tất cả các trường mới
- Cập nhật kiểu thời gian

### 5. Repository Updates
- `RoleRepository`: Cập nhật generic type từ `Long` sang `Integer`

### 6. Configuration Updates
- `CustomUserDetailsService`: Sửa lỗi khi lấy role name từ user entity

## Enum MembershipLevel

```java
public enum MembershipLevel {
    BASIC("basic"),
    SILVER("silver"), 
    GOLD("gold"),
    PLATINUM("platinum");
}
```

## Default Values
- `status`: TRUE
- `points`: 0
- `balance`: 0.00
- `totalPurchase`: 0.00
- `membershipLevel`: BASIC
- `createdAt`: CURRENT_TIMESTAMP
- `updatedAt`: CURRENT_TIMESTAMP

## Database Constraints
- Username: UNIQUE, NOT NULL, max 100 chars
- Email: UNIQUE (nhưng có thể NULL)
- Phone: max 20 chars
- Membership level: CHECK constraint (basic, silver, gold, platinum)

## API Compatibility
- Tất cả các endpoint hiện tại vẫn hoạt động
- Các trường mới là optional trong request
- Response sẽ bao gồm tất cả thông tin mới