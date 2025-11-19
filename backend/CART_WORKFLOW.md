# Cart Workflow - QM Bookstore

## 📋 Tổng quan quy trình giỏ hàng

Document này mô tả chi tiết quy trình xử lý giỏ hàng trong hệ thống QM Bookstore.

**Ngày cập nhật:** 19/11/2025  
**Version:** 1.0

---

## 🔄 Quy trình thêm sản phẩm vào giỏ hàng

### Flow Chart

```
┌─────────────────────────────────────┐
│ User click "Thêm vào giỏ"           │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ POST /api/cart/add                  │
│ Body: {productId, quantity}         │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 1. Validate Product                 │
│    - Product exists?                │
│    - Has enough stock?              │
└─────────────┬───────────────────────┘
              │
              ├─ NO → Throw PRODUCT_NOT_FOUND
              │        or PRODUCT_OUT_OF_STOCK
              │
              ▼ YES
┌─────────────────────────────────────┐
│ 2. Get or Create Cart               │
│    - User logged in?                │
└─────────────┬───────────────────────┘
              │
        ┌─────┴──────┐
        │            │
        ▼            ▼
   ┌────────┐   ┌─────────┐
   │ User   │   │ Guest   │
   │ Cart   │   │ Cart    │
   └────┬───┘   └────┬────┘
        │            │
        └─────┬──────┘
              ▼
┌─────────────────────────────────────┐
│ 3. Check Product Already in Cart?  │
└─────────────┬───────────────────────┘
              │
        ┌─────┴─────┐
        │           │
        ▼ YES       ▼ NO
┌──────────────┐  ┌──────────────────┐
│ Throw Error  │  │ Create CartItem  │
│ PRODUCT_     │  │ - productId      │
│ ALREADY_IN_  │  │ - quantity       │
│ CART         │  │ - isSelected=false
└──────────────┘  └─────────┬────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Return CartResponse
                  │ with all items   │
                  └──────────────────┘
```

### Logic Chi tiết

#### 1. Validate Product
```java
// Kiểm tra sản phẩm tồn tại
Product product = productRepository.findById(productId)
    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

// Kiểm tra số lượng tồn kho
if (product.getStockQuantity() < requestedQuantity) {
    throw new AppException(ErrorCode.PRODUCT_OUT_OF_STOCK);
}
```

**Errors có thể xảy ra:**
- `PRODUCT_NOT_FOUND` (3001): Sản phẩm không tồn tại
- `PRODUCT_OUT_OF_STOCK` (3003): Không đủ hàng tồn kho

#### 2. Get or Create Cart (Lazy Creation - Tạo 1 lần duy nhất)

**Quy tắc quan trọng:**
- ✅ **1 User = 1 Cart** (Unique constraint trên `user_id`)
- ✅ **1 Session = 1 Cart** (Unique constraint trên `session_id`)
- ✅ Cart chỉ được tạo lần đầu tiên khi thêm sản phẩm
- ✅ Các lần sau DÙNG LẠI cart đã tạo

**Với User đã đăng nhập:**
```java
// Extract userId từ JWT token
UUID userId = getUserIdFromToken();

// Tìm cart hiện có HOẶC tạo mới (chỉ 1 lần)
Optional<Cart> existingCart = cartRepository.findByUserId(userId);

if (existingCart.isPresent()) {
    // ♻️ DÙNG LẠI CART ĐÃ CÓ
    log.debug("Found existing cart {} for user {}", existingCart.get().getId(), userId);
    return existingCart.get();
} else {
    // 🆕 TẠO CART MỚI (lần đầu tiên)
    log.info("Creating NEW cart for user: {}", userId);
    Cart newCart = Cart.builder()
        .userId(userId)
        .sessionId(null)
        .build();
    return cartRepository.save(newCart);
}
```

**Với Guest (chưa đăng nhập):**
```java
// Lấy sessionId từ header
String sessionId = request.getHeader("X-Session-ID");

// Tìm cart hiện có HOẶC tạo mới (chỉ 1 lần)
Optional<Cart> existingCart = cartRepository.findBySessionId(sessionId);

if (existingCart.isPresent()) {
    // ♻️ DÙNG LẠI CART ĐÃ CÓ
    log.debug("Found existing cart {} for session {}", existingCart.get().getId(), sessionId);
    return existingCart.get();
} else {
    // 🆕 TẠO CART MỚI (lần đầu tiên)
    log.info("Creating NEW cart for session: {}", sessionId);
    Cart newCart = Cart.builder()
        .userId(null)
        .sessionId(sessionId)
        .build();
    return cartRepository.save(newCart);
}
```

**Database Constraints:**
```sql
-- Đảm bảo 1 user chỉ có 1 cart
ALTER TABLE carts ADD CONSTRAINT unique_user_cart UNIQUE (user_id);

-- Đảm bảo 1 session chỉ có 1 cart  
ALTER TABLE carts ADD CONSTRAINT unique_session_cart UNIQUE (session_id);

-- Indexes để tìm kiếm nhanh
CREATE INDEX idx_cart_user_id ON carts(user_id);
CREATE INDEX idx_cart_session_id ON carts(session_id);
```

**Errors có thể xảy ra:**
- `INVALID_REQUEST` (6004): Không có userId và không có sessionId

#### 3. Check Product Already in Cart

```java
// Kiểm tra sản phẩm đã có trong giỏ chưa
CartItem existingItem = cartItemRepository
    .findByCartIdAndProductId(cart.getId(), productId)
    .orElse(null);

if (existingItem != null) {
    // SẢN PHẨM ĐÃ CÓ → BÁO LỖI
    throw new AppException(ErrorCode.PRODUCT_ALREADY_IN_CART);
}

// SẢN PHẨM CHƯA CÓ → TẠO MỚI
CartItem newItem = CartItem.builder()
    .cartId(cart.getId())
    .productId(productId)
    .quantity(quantity)
    .isSelected(false)  // Mặc định chưa chọn
    .build();

cartItemRepository.save(newItem);
```

**Errors có thể xảy ra:**
- `PRODUCT_ALREADY_IN_CART` (6005): Sản phẩm đã có trong giỏ hàng

**Lý do không cộng dồn số lượng:**
- User cần biết sản phẩm đã có trong giỏ
- Tránh việc vô tình thêm quá nhiều
- User có thể điều chỉnh số lượng từ trang giỏ hàng

---

## 🛒 Quy trình xem giỏ hàng

### Flow Chart

```
┌─────────────────────────────────────┐
│ GET /api/cart                       │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Get Cart by userId or sessionId     │
└─────────────┬───────────────────────┘
              │
        ┌─────┴─────┐
        │           │
        ▼ Found     ▼ Not Found
┌──────────────┐  ┌──────────────────┐
│ Get CartItems│  │ Return Empty Cart│
│ from cart    │  │ {items: [],      │
│              │  │  summary: {...}} │
└─────┬────────┘  └──────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│ For each CartItem:                  │
│ - Get Product details               │
│ - Calculate subtotal                │
│ - Build CartItemResponse            │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Calculate Cart Summary:             │
│ - totalItems                        │
│ - selectedItems                     │
│ - totalQuantity                     │
│ - selectedQuantity                  │
│ - totalAmount                       │
│ - selectedAmount                    │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Return CartResponse                 │
└─────────────────────────────────────┘
```

### Response Structure

```json
{
  "success": true,
  "code": 1000,
  "result": {
    "cartId": 1,
    "items": [
      {
        "id": 5,
        "productId": 10,
        "productName": "Spring Boot Guide",
        "productImage": "https://...",
        "price": 299000.00,
        "quantity": 2,
        "isSelected": false,
        "subtotal": 598000.00,
        "createdAt": "2025-11-19T10:00:00",
        "updatedAt": "2025-11-19T10:00:00"
      }
    ],
    "summary": {
      "totalItems": 1,
      "selectedItems": 0,
      "totalQuantity": 2,
      "selectedQuantity": 0,
      "totalAmount": 598000.00,
      "selectedAmount": 0.00
    }
  }
}
```

---

## ✏️ Quy trình cập nhật số lượng

### Flow Chart

```
┌─────────────────────────────────────┐
│ PUT /api/cart/items/{id}            │
│ Body: {quantity: 5}                 │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 1. Find CartItem by ID              │
└─────────────┬───────────────────────┘
              │
              ├─ Not Found → CART_ITEM_NOT_FOUND
              │
              ▼ Found
┌─────────────────────────────────────┐
│ 2. Verify Cart Ownership            │
│    - Match userId/sessionId         │
└─────────────┬───────────────────────┘
              │
              ├─ Not Match → UNAUTHORIZED
              │
              ▼ Match
┌─────────────────────────────────────┐
│ 3. Validate Quantity > 0            │
└─────────────┬───────────────────────┘
              │
              ├─ NO → INVALID_REQUEST
              │
              ▼ YES
┌─────────────────────────────────────┐
│ 4. Update CartItem.quantity         │
│    Save to database                 │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 5. Return updated CartResponse      │
└─────────────────────────────────────┘
```

**Lưu ý:** Khi update quantity, người dùng có thể chỉnh số lượng tùy ý (tăng hoặc giảm).

---

## ☑️ Quy trình chọn sản phẩm để thanh toán

### Flow Chart - Toggle Selection

```
┌─────────────────────────────────────┐
│ PUT /api/cart/items/{id}/select     │
│ Body: {selected: true/false}        │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 1. Find CartItem by ID              │
└─────────────┬───────────────────────┘
              │
              ├─ Not Found → CART_ITEM_NOT_FOUND
              │
              ▼ Found
┌─────────────────────────────────────┐
│ 2. Verify Cart Ownership            │
└─────────────┬───────────────────────┘
              │
              ├─ Not Match → UNAUTHORIZED
              │
              ▼ Match
┌─────────────────────────────────────┐
│ 3. Update isSelected = true/false   │
│    Save to database                 │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 4. Return updated CartResponse      │
│    (summary.selectedAmount updated) │
└─────────────────────────────────────┘
```

### Flow Chart - Select All

```
┌─────────────────────────────────────┐
│ PUT /api/cart/select-all            │
│ Body: {selected: true/false}        │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 1. Get or Create Cart               │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 2. Get All CartItems in Cart        │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 3. Update all isSelected            │
│    forEach(item -> item.setIsSelected)
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 4. Save all items                   │
│    cartItemRepository.saveAll()     │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 5. Return updated CartResponse      │
└─────────────────────────────────────┘
```

---

## 🗑️ Quy trình xóa sản phẩm

### Flow Chart

```
┌─────────────────────────────────────┐
│ DELETE /api/cart/items/{id}         │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 1. Find CartItem by ID              │
└─────────────┬───────────────────────┘
              │
              ├─ Not Found → CART_ITEM_NOT_FOUND
              │
              ▼ Found
┌─────────────────────────────────────┐
│ 2. Verify Cart Ownership            │
└─────────────┬───────────────────────┘
              │
              ├─ Not Match → UNAUTHORIZED
              │
              ▼ Match
┌─────────────────────────────────────┐
│ 3. Delete CartItem                  │
│    cartItemRepository.delete()      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 4. Return updated CartResponse      │
│    (item removed from list)         │
└─────────────────────────────────────┘
```

---

## 💳 Quy trình thanh toán

### Flow Chart

```
┌─────────────────────────────────────┐
│ POST /api/cart/checkout             │
│ Requires: Authentication            │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 1. Verify User is Authenticated     │
└─────────────┬───────────────────────┘
              │
              ├─ NO → UNAUTHORIZED
              │
              ▼ YES
┌─────────────────────────────────────┐
│ 2. Get User's Cart                  │
└─────────────┬───────────────────────┘
              │
              ├─ Not Found → CART_NOT_FOUND
              │
              ▼ Found
┌─────────────────────────────────────┐
│ 3. Get Selected Items               │
│    WHERE isSelected = true          │
└─────────────┬───────────────────────┘
              │
              ├─ Empty → NO_ITEMS_SELECTED
              │
              ▼ Has Items
┌─────────────────────────────────────┐
│ 4. Validate Each Item:              │
│    - Product exists?                │
│    - Enough stock?                  │
│    - Calculate total                │
└─────────────┬───────────────────────┘
              │
              ├─ Validation Failed → Error
              │
              ▼ Valid
┌─────────────────────────────────────┐
│ 5. Create Order                     │
│    - order table                    │
│    - order_items table              │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 6. Update Product Stock             │
│    stock -= quantity                │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 7. Delete Selected CartItems        │
│    DELETE WHERE isSelected = true   │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 8. Items không chọn vẫn giữ lại    │
│    Cart vẫn tồn tại                 │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 9. Return Order Details             │
└─────────────────────────────────────┘
```

**Lưu ý quan trọng:**
- ✅ Cart KHÔNG bị xóa sau checkout
- ✅ CHỈ xóa các items có `isSelected = true`
- ✅ Items không chọn vẫn giữ lại trong cart

---

## 🔄 Quy trình merge cart khi login

### Use Case
Guest đã thêm sản phẩm vào giỏ → Sau đó đăng nhập → Cần merge giỏ hàng guest vào giỏ hàng user

### Flow Chart

```
┌─────────────────────────────────────┐
│ User Login Successfully             │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ POST /api/cart/merge                │
│ Headers: Authorization + X-Session-ID
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 1. Get Guest Cart by sessionId      │
└─────────────┬───────────────────────┘
              │
              ├─ Not Found → Skip (no merge needed)
              │
              ▼ Found
┌─────────────────────────────────────┐
│ 2. Get or Create User Cart          │
│    by userId                        │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 3. For Each Guest Cart Item:        │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Check: Product already in User Cart?│
└─────────────┬───────────────────────┘
              │
        ┌─────┴─────┐
        │           │
        ▼ YES       ▼ NO
┌──────────────┐  ┌──────────────────┐
│ Merge        │  │ Move Item to     │
│ Quantities   │  │ User Cart        │
│ (add up)     │  │ (change cartId)  │
└──────┬───────┘  └─────┬────────────┘
       │                │
       └────────┬───────┘
                │
                ▼
┌─────────────────────────────────────┐
│ 4. Delete Guest Cart                │
│    cartRepository.delete(guestCart) │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 5. Clear Session ID in Frontend     │
│    localStorage.removeItem()        │
└─────────────────────────────────────┘
```

**Lưu ý:** 
- Khi merge, nếu sản phẩm đã có → CỘNG DỒN số lượng (khác với add to cart)
- Guest cart bị xóa sau khi merge

---

## ⚠️ Error Codes Summary

| Code | Error | Message | Khi nào xảy ra |
|------|-------|---------|----------------|
| 3001 | PRODUCT_NOT_FOUND | Product not found | Sản phẩm không tồn tại |
| 3003 | PRODUCT_OUT_OF_STOCK | Product is out of stock | Không đủ hàng tồn kho |
| 6001 | CART_NOT_FOUND | Cart not found | Cart không tồn tại (checkout) |
| 6002 | CART_ITEM_NOT_FOUND | Cart item not found | Item không tồn tại |
| 6003 | NO_ITEMS_SELECTED | No items selected | Checkout mà không chọn item nào |
| 6004 | INVALID_REQUEST | Invalid request | Request không hợp lệ |
| 6005 | PRODUCT_ALREADY_IN_CART | Product is already in your cart | Sản phẩm đã có trong giỏ |
| 1007 | UNAUTHORIZED | You do not have permission | Không có quyền truy cập cart |

---

## 📊 State Diagram - Cart Item Lifecycle

```
                    ┌─────────────────┐
                    │  Not in Cart    │
                    └────────┬────────┘
                             │
                             │ Add to Cart
                             ▼
              ┌──────────────────────────┐
              │   In Cart               │
              │   isSelected = false    │
              └──────┬──────────────┬───┘
                     │              │
        Toggle Select│              │ Delete
                     │              ▼
                     │      ┌──────────────┐
                     │      │  Removed     │
                     │      └──────────────┘
                     ▼
              ┌──────────────────────────┐
              │   In Cart               │
              │   isSelected = true     │
              └──────┬───────────────────┘
                     │
                     │ Checkout
                     ▼
              ┌──────────────────────────┐
              │   Checked Out           │
              │   (Item deleted)        │
              │   (Order created)       │
              └─────────────────────────┘
```

---

## 🎯 Business Rules Summary

### Add to Cart
1. ✅ Validate product exists
2. ✅ Check stock availability
3. ✅ **Create cart if not exists (LAZY CREATION - chỉ 1 lần)**
4. ✅ **1 User = 1 Cart duy nhất** (unique constraint)
5. ✅ **1 Session = 1 Cart duy nhất** (unique constraint)
6. ❌ **Không cho phép thêm nếu sản phẩm đã có trong giỏ**
7. ✅ User phải update số lượng từ trang giỏ hàng
8. ✅ Lần 2 trở đi DÙNG LẠI cart đã tạo (không tạo mới)

### Cart Creation Flow (User)
```
Lần 1: Add Product A
→ findByUserId(user123) → Not Found
→ 🆕 CREATE Cart(id=1, userId=user123)
→ Add CartItem(Product A) to Cart(1)

Lần 2: Add Product B  
→ findByUserId(user123) → ✅ Found Cart(1)
→ ♻️ REUSE Cart(1) (không tạo mới)
→ Add CartItem(Product B) to Cart(1)

Lần 3: Add Product C
→ findByUserId(user123) → ✅ Found Cart(1)
→ ♻️ REUSE Cart(1)
→ Add CartItem(Product C) to Cart(1)

Kết quả: 1 User có duy nhất 1 Cart với 3 items
```

### Update Quantity
1. ✅ Verify ownership
2. ✅ Quantity must be > 0
3. ✅ No stock validation (will validate at checkout)

### Selection
1. ✅ Individual item selection
2. ✅ Select all / Deselect all
3. ✅ Only selected items will be checked out

### Checkout
1. ✅ Requires authentication
2. ✅ Validate stock before creating order
3. ✅ Deduct stock quantity
4. ✅ Delete only selected items
5. ✅ Keep cart and unselected items

### Merge Cart
1. ✅ Merge guest cart to user cart on login
2. ✅ Add quantities if product exists in both
3. ✅ Delete guest cart after merge

---

## 🗄️ Database Schema & Constraints

### Cart Table Structure

```sql
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE,  -- ← UNIQUE: 1 user chỉ có 1 cart
    session_id VARCHAR(100) UNIQUE,  -- ← UNIQUE: 1 session chỉ có 1 cart
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraint: Either user_id OR session_id must be set (not both)
    CHECK (
        (user_id IS NOT NULL AND session_id IS NULL) OR
        (user_id IS NULL AND session_id IS NOT NULL)
    )
);

-- Indexes để tìm kiếm nhanh
CREATE INDEX idx_cart_user_id ON carts(user_id);
CREATE INDEX idx_cart_session_id ON carts(session_id);

-- Foreign key
ALTER TABLE carts 
ADD CONSTRAINT fk_cart_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

### JPA Entity Annotations

```java
@Entity
@Table(name = "carts", 
    indexes = {
        @Index(name = "idx_cart_user_id", columnList = "user_id"),
        @Index(name = "idx_cart_session_id", columnList = "session_id")
    }
)
public class Cart {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "user_id", unique = true)  // ← UNIQUE constraint
    UUID userId;

    @Column(name = "session_id", length = 100, unique = true)  // ← UNIQUE constraint
    String sessionId;
    
    // ... other fields
}
```

### Behavior Examples

```sql
-- ✅ OK: User có cart
INSERT INTO carts (user_id, session_id) 
VALUES ('uuid-123', NULL);

-- ✅ OK: Guest có cart
INSERT INTO carts (user_id, session_id) 
VALUES (NULL, 'session-abc');

-- ❌ ERROR: User thử tạo cart thứ 2
INSERT INTO carts (user_id, session_id) 
VALUES ('uuid-123', NULL);
-- ERROR: duplicate key value violates unique constraint "unique_user_cart"

-- ❌ ERROR: Không có userId và sessionId
INSERT INTO carts (user_id, session_id) 
VALUES (NULL, NULL);
-- ERROR: check constraint violated
```

---

## 📝 Frontend Integration Tips

### Handling PRODUCT_ALREADY_IN_CART Error

```javascript
try {
  const response = await axios.post('/api/cart/add', {
    productId: 10,
    quantity: 2
  });
  
  // Success
  toast.success('Đã thêm vào giỏ hàng!');
  
} catch (error) {
  if (error.response?.data?.code === 6005) {
    // Product already in cart
    toast.warning('Sản phẩm đã có trong giỏ hàng. Vui lòng cập nhật số lượng từ trang giỏ hàng.');
    
    // Redirect to cart page
    router.push('/cart');
  } else {
    toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
  }
}
```

### Update Quantity from Cart Page

```javascript
const updateQuantity = async (itemId, newQuantity) => {
  try {
    const response = await axios.put(`/api/cart/items/${itemId}`, {
      quantity: newQuantity
    });
    
    setCart(response.data.result);
    toast.success('Đã cập nhật số lượng');
  } catch (error) {
    toast.error('Cập nhật thất bại');
  }
};
```

---

## 📄 Version History

**Version 1.0** (19/11/2025)
- ✅ Documented complete cart workflow
- ✅ Add to cart không cho phép duplicate
- ✅ User phải update quantity từ cart page
- ✅ PRODUCT_ALREADY_IN_CART error code (6005)
- ✅ Complete flow charts for all operations
- ✅ Error handling guide
- ✅ Frontend integration examples
- ✅ **1 User = 1 Cart (UNIQUE constraint)**
- ✅ **1 Session = 1 Cart (UNIQUE constraint)**
- ✅ **Lazy Cart Creation - Tạo 1 lần, dùng lại mãi mãi**
- ✅ Database schema với indexes và constraints
- ✅ Logic getOrCreateCart() rõ ràng với logging

---

## 📄 License

Internal Documentation - QM Bookstore Project
