# Product Combo - Cart & Order Design Proposal

**Date:** 2026-01-02  
**Context:** Thiết kế database để lưu combo sản phẩm vào giỏ hàng và đơn hàng

---

## 📊 Current Structure Analysis

### Cart Items (Hiện tại)
```java
cart_items {
    id: Long (PK)
    cart_id: Long (FK → carts)
    product_id: Long (FK → products)
    quantity: Integer
    is_selected: Boolean
    created_at, updated_at: Timestamp
}
```

### Order Items (Hiện tại)
```java
order_items {
    id: Long (PK)
    order_id: Long (FK → orders)
    product_id: Long (FK → products)
    category_id: Long (snapshot)
    quantity: Integer
    unit_price: Decimal (snapshot)
    line_total: Decimal (calculated)
    created_at: Timestamp
}
```

---

## 🎯 Business Requirements

1. **Thêm combo vào giỏ hàng**
   - User chọn combo thay vì chọn từng sản phẩm riêng lẻ
   - Hiển thị giá combo (có discount) thay vì tổng giá gốc
   - Có thể tăng/giảm quantity của combo

2. **Checkout combo**
   - Khi thanh toán, lưu combo với giá tại thời điểm mua
   - Tracking được combo nào đã bán trong order
   - Báo cáo doanh thu từ combos

3. **Inventory Management**
   - Giảm stock của các products trong combo khi checkout
   - Validate stock availability trước khi checkout

4. **Display & UX**
   - Hiển thị combo items trong cart/order riêng biệt với single products
   - Show discount info của combo
   - Show list products trong combo

---

## 💡 Solution Options

### **Option 1: Extend Existing Tables (RECOMMENDED ✅)**

**Concept:** Thêm `combo_id` vào cart_items và order_items hiện tại

#### Database Schema

```sql
-- Modify cart_items
ALTER TABLE cart_items
ADD COLUMN combo_id INTEGER REFERENCES product_combos(id),
ADD COLUMN item_type VARCHAR(20) DEFAULT 'PRODUCT' CHECK (item_type IN ('PRODUCT', 'COMBO'));

-- Modify order_items  
ALTER TABLE order_items
ADD COLUMN combo_id INTEGER REFERENCES product_combos(id),
ADD COLUMN item_type VARCHAR(20) DEFAULT 'PRODUCT' CHECK (item_type IN ('PRODUCT', 'COMBO')),
ADD COLUMN combo_name VARCHAR(255),
ADD COLUMN combo_snapshot JSONB;
```

#### Entity Changes

**CartItem.java:**
```java
@Entity
@Table(name = "cart_items")
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "cart_id")
    Long cartId;

    // For single product
    @Column(name = "product_id")
    Long productId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    Product product;

    // For combo ✨ NEW
    @Column(name = "combo_id")
    Integer comboId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "combo_id", insertable = false, updatable = false)
    ProductCombo combo;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", length = 20)
    @Builder.Default
    ItemType itemType = ItemType.PRODUCT;  // PRODUCT or COMBO

    @Column(nullable = false)
    Integer quantity;

    @Column(name = "is_selected")
    Boolean isSelected;

    // ... timestamps
}

enum ItemType {
    PRODUCT,  // Single product
    COMBO     // Product combo
}
```

**OrderItem.java:**
```java
@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "order_id")
    Long orderId;

    // For single product
    @Column(name = "product_id")
    Long productId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    Product product;

    // For combo ✨ NEW
    @Column(name = "combo_id")
    Integer comboId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "combo_id", insertable = false, updatable = false)
    ProductCombo combo;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", length = 20)
    @Builder.Default
    ItemType itemType = ItemType.PRODUCT;

    // Snapshot for combo (at order time) ✨ NEW
    @Column(name = "combo_name")
    String comboName;
    
    @Type(JsonBinaryType.class)
    @Column(name = "combo_snapshot", columnDefinition = "jsonb")
    ComboSnapshot comboSnapshot;

    @Column(name = "category_id")
    Long categoryId;

    @Column(nullable = false)
    Integer quantity;

    @Column(name = "unit_price", precision = 12, scale = 2)
    BigDecimal unitPrice;

    @Column(name = "line_total", precision = 12, scale = 2)
    BigDecimal lineTotal;

    // ... timestamps
}

@Data
@Builder
class ComboSnapshot {
    List<ComboItemSnapshot> items;
    BigDecimal originalPrice;
    BigDecimal discountAmount;
    BigDecimal discountPercentage;
}

@Data
class ComboItemSnapshot {
    Long productId;
    String productName;
    Integer quantity;
    BigDecimal productPrice;
}
```

#### Business Logic

**CartService - Add Combo to Cart:**
```java
public CartItem addComboToCart(UUID userId, Integer comboId, Integer quantity) {
    // 1. Validate combo exists and available
    ProductCombo combo = comboRepository.findByIdWithItems(comboId)
        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_COMBO_NOT_FOUND));
    
    if (!combo.getAvailability()) {
        throw new AppException(ErrorCode.PRODUCT_COMBO_UNAVAILABLE);
    }
    
    // 2. Validate stock for all products in combo
    for (ProductComboItem item : combo.getComboItems()) {
        int requiredStock = item.getQuantity() * quantity;
        if (item.getProduct().getStockQuantity() < requiredStock) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
        }
    }
    
    // 3. Get or create cart
    Cart cart = cartRepository.findByUserId(userId)
        .orElseGet(() -> cartRepository.save(Cart.builder()
            .userId(userId).build()));
    
    // 4. Check if combo already in cart
    Optional<CartItem> existing = cartItemRepository
        .findByCartIdAndComboId(cart.getId(), comboId);
    
    if (existing.isPresent()) {
        // Update quantity
        existing.get().setQuantity(existing.get().getQuantity() + quantity);
        return cartItemRepository.save(existing.get());
    }
    
    // 5. Add new combo to cart
    CartItem cartItem = CartItem.builder()
        .cartId(cart.getId())
        .comboId(comboId)
        .itemType(ItemType.COMBO)
        .quantity(quantity)
        .isSelected(true)
        .build();
    
    return cartItemRepository.save(cartItem);
}
```

**OrderService - Create Order with Combos:**
```java
public Order createOrder(UUID userId, CheckoutRequest request) {
    // ... create order
    
    for (CartItem cartItem : selectedItems) {
        OrderItem orderItem;
        
        if (cartItem.getItemType() == ItemType.COMBO) {
            // Handle combo
            ProductCombo combo = comboRepository
                .findByIdWithItems(cartItem.getComboId()).get();
            
            // Create snapshot
            ComboSnapshot snapshot = ComboSnapshot.builder()
                .items(combo.getComboItems().stream()
                    .map(item -> new ComboItemSnapshot(
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getProduct().getPrice()
                    ))
                    .collect(Collectors.toList()))
                .originalPrice(calculateOriginalPrice(combo))
                .discountAmount(calculateDiscount(combo))
                .discountPercentage(calculateDiscountPercentage(combo))
                .build();
            
            orderItem = OrderItem.builder()
                .orderId(order.getId())
                .comboId(combo.getId())
                .itemType(ItemType.COMBO)
                .comboName(combo.getName())
                .comboSnapshot(snapshot)
                .quantity(cartItem.getQuantity())
                .unitPrice(combo.getPrice())
                .lineTotal(combo.getPrice().multiply(
                    BigDecimal.valueOf(cartItem.getQuantity())))
                .build();
            
            // Decrease stock for all products in combo
            for (ProductComboItem item : combo.getComboItems()) {
                Product product = item.getProduct();
                int totalRequired = item.getQuantity() * cartItem.getQuantity();
                product.setStockQuantity(product.getStockQuantity() - totalRequired);
                productRepository.save(product);
            }
            
        } else {
            // Handle single product (existing logic)
            // ...
        }
        
        orderItemRepository.save(orderItem);
    }
    
    return order;
}
```

#### CartRepository Extensions

```java
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    // Existing methods...
    
    // New methods for combo
    Optional<CartItem> findByCartIdAndComboId(Long cartId, Integer comboId);
    
    List<CartItem> findByCartIdAndItemType(Long cartId, ItemType itemType);
    
    @Query("SELECT ci FROM CartItem ci " +
           "LEFT JOIN FETCH ci.product " +
           "LEFT JOIN FETCH ci.combo c " +
           "LEFT JOIN FETCH c.comboItems " +
           "WHERE ci.cartId = :cartId")
    List<CartItem> findByCartIdWithProducts(@Param("cartId") Long cartId);
}
```

#### DTO Examples

**CartItemResponse:**
```java
@Data
@Builder
public class CartItemResponse {
    private Long id;
    private ItemType itemType;
    private Integer quantity;
    private Boolean isSelected;
    
    // For PRODUCT type
    private ProductSimpleResponse product;
    
    // For COMBO type
    private ComboInCartResponse combo;
    
    // Calculated
    private BigDecimal itemTotal;
}

@Data
@Builder
public class ComboInCartResponse {
    private Integer id;
    private String name;
    private String imageUrl;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private BigDecimal discountAmount;
    private Double discountPercentage;
    private List<ComboItemInCart> items;
}

@Data
class ComboItemInCart {
    private Long productId;
    private String productName;
    private String imageUrl;
    private Integer quantity;
    private BigDecimal price;
}
```

---

### **Pros & Cons**

#### ✅ Advantages

1. **Minimal Schema Changes**
   - Chỉ thêm 2-3 columns vào existing tables
   - Không cần tạo tables mới
   - Migration đơn giản

2. **Backward Compatible**
   - Single products vẫn hoạt động như cũ
   - Không ảnh hưởng logic hiện tại
   - `item_type` default = 'PRODUCT'

3. **Unified Logic**
   - Cart/Order service xử lý cả product và combo
   - Queries đơn giản hơn (1 table thay vì 2)
   - Frontend integration dễ dàng

4. **Flexible**
   - Có thể mix products và combos trong 1 cart/order
   - Dễ dàng add vouchers/promotions cho cả 2 types

5. **Performance**
   - Ít joins hơn
   - Indexes existing vẫn dùng được
   - Combo snapshot (JSONB) → fast retrieval

#### ⚠️ Disadvantages

1. **Nullable Columns**
   - `product_id` nullable khi là combo
   - `combo_id` nullable khi là single product
   - Cần careful validation

2. **Complex Queries**
   - Phải check `item_type` trong queries
   - Conditional logic nhiều hơn

3. **Data Integrity**
   - Phải ensure: 
     * (product_id != null AND combo_id = null) OR
     * (product_id = null AND combo_id != null)
   - Cần constraint hoặc validation layer

---

## 🔄 Alternative: Option 2 (Separate Tables)

Tạo tables riêng cho combo items (không khuyến nghị vì complex hơn):

```sql
CREATE TABLE cart_combo_items (
    id SERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES carts(id),
    combo_id INTEGER NOT NULL REFERENCES product_combos(id),
    quantity INTEGER NOT NULL,
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_combo_items (
    id SERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    combo_id INTEGER NOT NULL REFERENCES product_combos(id),
    combo_name VARCHAR(255),
    combo_snapshot JSONB,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Pros:** Clean separation, no nullable fields  
**Cons:** More tables, complex queries (UNION), duplicate logic

---

## 🎯 Implementation Plan (Option 1 - Recommended)

### Phase 1: Database Migration

```sql
-- Step 1: Add new columns
ALTER TABLE cart_items
ADD COLUMN combo_id INTEGER,
ADD COLUMN item_type VARCHAR(20) DEFAULT 'PRODUCT';

ALTER TABLE order_items
ADD COLUMN combo_id INTEGER,
ADD COLUMN item_type VARCHAR(20) DEFAULT 'PRODUCT',
ADD COLUMN combo_name VARCHAR(255),
ADD COLUMN combo_snapshot JSONB;

-- Step 2: Add foreign keys
ALTER TABLE cart_items
ADD CONSTRAINT fk_cart_items_combo
FOREIGN KEY (combo_id) REFERENCES product_combos(id);

ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_combo
FOREIGN KEY (combo_id) REFERENCES product_combos(id);

-- Step 3: Add constraints
ALTER TABLE cart_items
ADD CONSTRAINT chk_cart_item_type
CHECK (
    (item_type = 'PRODUCT' AND product_id IS NOT NULL AND combo_id IS NULL) OR
    (item_type = 'COMBO' AND combo_id IS NOT NULL AND product_id IS NULL)
);

ALTER TABLE order_items
ADD CONSTRAINT chk_order_item_type
CHECK (
    (item_type = 'PRODUCT' AND product_id IS NOT NULL AND combo_id IS NULL) OR
    (item_type = 'COMBO' AND combo_id IS NOT NULL AND product_id IS NULL)
);

-- Step 4: Add indexes
CREATE INDEX idx_cart_items_combo_id ON cart_items(combo_id);
CREATE INDEX idx_cart_items_item_type ON cart_items(item_type);
CREATE INDEX idx_order_items_combo_id ON order_items(combo_id);
CREATE INDEX idx_order_items_item_type ON order_items(item_type);

-- Step 5: JSONB indexes for queries
CREATE INDEX idx_order_items_combo_snapshot 
ON order_items USING GIN (combo_snapshot);
```

### Phase 2: Entity Updates

1. ✅ Update `CartItem.java` - Add combo fields
2. ✅ Update `OrderItem.java` - Add combo fields
3. ✅ Create `ItemType` enum
4. ✅ Create `ComboSnapshot` classes

### Phase 3: Repository Updates

1. ✅ Add combo-specific queries to `CartItemRepository`
2. ✅ Add combo-specific queries to `OrderItemRepository`
3. ✅ Update existing queries to handle both types

### Phase 4: Service Layer

1. ✅ Update `CartService` - Add combo operations
2. ✅ Update `OrderService` - Handle combo checkout
3. ✅ Update `ProductService` - Stock management for combos

### Phase 5: Controller & DTOs

1. ✅ Update `CartController` - New endpoints for combos
2. ✅ Update DTOs - Add combo fields
3. ✅ Update mappers - Handle both types

### Phase 6: Testing

1. ✅ Unit tests - Combo cart operations
2. ✅ Integration tests - Combo checkout flow
3. ✅ E2E tests - Full user journey

---

## 📝 API Examples

### Add Combo to Cart

```http
POST /api/carts/items/combo
Content-Type: application/json
Authorization: Bearer <token>

{
  "comboId": 1,
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "code": 201,
  "message": "Thêm combo vào giỏ hàng thành công",
  "result": {
    "id": 123,
    "itemType": "COMBO",
    "quantity": 2,
    "isSelected": true,
    "combo": {
      "id": 1,
      "name": "Combo Văn Phòng Phẩm",
      "imageUrl": "...",
      "price": 45000,
      "originalPrice": 55000,
      "discountAmount": 10000,
      "discountPercentage": 18.18,
      "items": [
        {
          "productId": 11,
          "productName": "Bút bi",
          "quantity": 2,
          "price": 15000
        },
        {
          "productId": 78,
          "productName": "Vở",
          "quantity": 1,
          "price": 25000
        }
      ]
    },
    "itemTotal": 90000
  }
}
```

### Get Cart with Mixed Items

```http
GET /api/carts
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "result": {
    "id": 1,
    "items": [
      {
        "id": 100,
        "itemType": "PRODUCT",
        "quantity": 3,
        "product": {
          "id": 50,
          "name": "Bút chì",
          "price": 5000
        },
        "itemTotal": 15000
      },
      {
        "id": 101,
        "itemType": "COMBO",
        "quantity": 2,
        "combo": {
          "id": 1,
          "name": "Combo Văn Phòng",
          "price": 45000,
          "originalPrice": 55000,
          "items": [...]
        },
        "itemTotal": 90000
      }
    ],
    "subtotal": 105000,
    "totalItems": 2
  }
}
```

---

## 🔐 Validation Rules

1. **Cart Item Creation:**
   - ✅ Combo must exist và available
   - ✅ All products in combo must have sufficient stock
   - ✅ Quantity > 0
   - ✅ Only one of (product_id, combo_id) can be set

2. **Order Creation:**
   - ✅ Snapshot combo data at order time
   - ✅ Validate stock again before checkout
   - ✅ Decrease stock for all products in combo
   - ✅ Record discount info for reporting

3. **Stock Management:**
   - ✅ When combo purchased: decrease stock of ALL products in combo
   - ✅ Example: Combo has (Product A x2, Product B x1), quantity=3
     * Product A stock -= 6
     * Product B stock -= 3

---

## 📊 Reporting Queries

### Combo Sales Report

```sql
-- Total revenue from combos
SELECT 
    combo_id,
    combo_name,
    SUM(quantity) as total_sold,
    SUM(line_total) as total_revenue,
    AVG(unit_price) as avg_price
FROM order_items
WHERE item_type = 'COMBO'
  AND created_at >= '2026-01-01'
GROUP BY combo_id, combo_name
ORDER BY total_revenue DESC;
```

### Products Most Sold in Combos

```sql
-- Extract from JSONB snapshot
SELECT 
    item->>'productId' as product_id,
    item->>'productName' as product_name,
    SUM((item->>'quantity')::int * oi.quantity) as total_quantity
FROM order_items oi,
    LATERAL jsonb_array_elements(combo_snapshot->'items') as item
WHERE item_type = 'COMBO'
GROUP BY product_id, product_name
ORDER BY total_quantity DESC
LIMIT 10;
```

---

## ✅ Recommendation

**Chọn Option 1 (Extend Existing Tables)** vì:

1. ✅ **Simple:** Ít schema changes, dễ implement
2. ✅ **Maintainable:** Unified logic, ít duplicate code
3. ✅ **Flexible:** Dễ mở rộng cho vouchers, promotions
4. ✅ **Performance:** JSONB snapshot cho fast queries
5. ✅ **Backward Compatible:** Không ảnh hưởng existing features

**Next Steps:**
1. Review và approve design này
2. Create migration scripts
3. Update entities
4. Implement service layer
5. Test thoroughly
6. Deploy to staging

---

**Status:** 📋 PROPOSAL  
**Priority:** HIGH  
**Estimated Effort:** 3-5 days  
**Risk Level:** MEDIUM (cần test kỹ inventory logic)
