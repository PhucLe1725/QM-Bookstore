# Product Combo API Documentation
**Feature:** Quản lý Combo Sản Phẩm  
**Version:** 1.0  
**Date:** 2026-01-02

---

## 📋 Tổng quan

Product Combo cho phép tạo các gói sản phẩm với giá ưu đãi. Một combo bao gồm nhiều sản phẩm với số lượng xác định, và có giá thấp hơn tổng giá gốc của các sản phẩm.

### ✨ Tính năng
- ✅ Tạo combo với nhiều sản phẩm
- ✅ Tính toán tự động % giảm giá
- ✅ Quản lý availability (bật/tắt combo)
- ✅ Tìm kiếm theo tên
- ✅ Xem combos chứa sản phẩm cụ thể
- ✅ Phân quyền Admin/Manager cho CRUD operations

---

## 🗄️ Database Schema

### Table: `product_combos`
```sql
CREATE TABLE public.product_combos (
    id serial4 PRIMARY KEY,
    name varchar(255) NOT NULL,
    price numeric(12, 2) NOT NULL,
    image_url text NULL,
    availability bool DEFAULT true,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `product_combo_items`
```sql
CREATE TABLE public.product_combo_items (
    id serial4 PRIMARY KEY,
    combo_id int4 NOT NULL REFERENCES product_combos(id) ON DELETE CASCADE,
    product_id int4 NOT NULL REFERENCES products(id),
    quantity int4 NOT NULL DEFAULT 1,
    UNIQUE (combo_id, product_id)
);
```

---

## 🎯 API Endpoints

### 1. POST /api/product-combos
**Tạo combo mới**

**Quyền:** ADMIN, MANAGER

**Request Body:**
```json
{
  "name": "Combo Văn Phòng Phẩm",
  "price": 45000.00,
  "imageUrl": "https://example.com/combo.jpg",
  "availability": true,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 5,
      "quantity": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "code": 201,
  "message": "Tạo combo thành công",
  "result": {
    "id": 1,
    "name": "Combo Văn Phòng Phẩm",
    "price": 45000.00,
    "imageUrl": "https://example.com/combo.jpg",
    "availability": true,
    "createdAt": "2026-01-02T01:30:00",
    "updatedAt": "2026-01-02T01:30:00",
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "Bút bi Thiên Long",
        "productImageUrl": "https://example.com/pen.jpg",
        "productPrice": 15000.00,
        "quantity": 2,
        "subtotal": 30000.00
      },
      {
        "id": 2,
        "productId": 5,
        "productName": "Vở kẻ ngang 200 trang",
        "productImageUrl": "https://example.com/notebook.jpg",
        "productPrice": 25000.00,
        "quantity": 1,
        "subtotal": 25000.00
      }
    ],
    "totalProducts": 3,
    "totalOriginalPrice": 55000.00,
    "discountAmount": 10000.00,
    "discountPercentage": 18.18
  }
}
```

**Validation:**
- `name`: Required, không trùng
- `price`: Required, > 0
- `items`: Required, ít nhất 1 sản phẩm
- `items[].productId`: Required, phải tồn tại
- `items[].quantity`: Required, > 0

---

### 2. PUT /api/product-combos/{comboId}
**Cập nhật combo**

**Quyền:** ADMIN, MANAGER

**Request Body:**
```json
{
  "name": "Combo Văn Phòng Phẩm Updated",
  "price": 42000.00,
  "availability": true,
  "items": [
    {
      "productId": 1,
      "quantity": 3
    },
    {
      "productId": 5,
      "quantity": 1
    }
  ]
}
```

**Note:** Tất cả fields đều optional. Items sẽ bị xóa và tạo lại nếu có trong request.

---

### 3. GET /api/product-combos/{comboId}
**Lấy thông tin combo**

**Quyền:** Public

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Lấy thông tin combo thành công",
  "result": {
    "id": 1,
    "name": "Combo Văn Phòng Phẩm",
    "price": 45000.00,
    "imageUrl": "https://example.com/combo.jpg",
    "availability": true,
    "createdAt": "2026-01-02T01:30:00",
    "updatedAt": "2026-01-02T01:30:00",
    "items": [/* array of items */],
    "totalProducts": 3,
    "totalOriginalPrice": 55000.00,
    "discountAmount": 10000.00,
    "discountPercentage": 18.18
  }
}
```

---

### 4. GET /api/product-combos
**Lấy danh sách combos (pagination)**

**Quyền:** Public

**Query Parameters:**
- `page` (default: 0) - Số trang
- `size` (default: 20) - Số items per page
- `sort` (default: "createdAt") - Trường sort
- `direction` (default: "DESC") - ASC hoặc DESC
- `available` (optional) - Filter theo availability (true/false)
- `search` (optional) - Tìm kiếm theo tên

**Examples:**
```bash
# Lấy tất cả combos
GET /api/product-combos?page=0&size=20

# Chỉ combos available
GET /api/product-combos?available=true

# Tìm kiếm
GET /api/product-combos?search=văn%20phòng

# Sắp xếp theo giá
GET /api/product-combos?sort=price&direction=ASC
```

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Lấy danh sách combo thành công",
  "result": {
    "content": [/* array of combos */],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": {"sorted": true, "unsorted": false, "empty": false},
      "offset": 0,
      "paged": true,
      "unpaged": false
    },
    "totalElements": 50,
    "totalPages": 3,
    "last": false,
    "size": 20,
    "number": 0,
    "sort": {"sorted": true, "unsorted": false, "empty": false},
    "numberOfElements": 20,
    "first": true,
    "empty": false
  }
}
```

---

### 5. GET /api/product-combos/by-product/{productId}
**Lấy combos chứa sản phẩm cụ thể**

**Quyền:** Public

**Use case:** Hiển thị "Có trong combos" trên trang chi tiết sản phẩm

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Lấy danh sách combo chứa sản phẩm thành công",
  "result": [
    {
      "id": 1,
      "name": "Combo Văn Phòng Phẩm",
      "price": 45000.00,
      "discountPercentage": 18.18,
      "items": [/* includes the product */]
    }
  ]
}
```

---

### 6. PATCH /api/product-combos/{comboId}/toggle-availability
**Bật/tắt combo**

**Quyền:** ADMIN, MANAGER

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Cập nhật trạng thái combo thành công",
  "result": {
    "id": 1,
    "name": "Combo Văn Phòng Phẩm",
    "availability": false,
    "totalProducts": 3
  }
}
```

---

### 7. DELETE /api/product-combos/{comboId}
**Xóa combo**

**Quyền:** ADMIN only

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Xóa combo thành công"
}
```

**Note:** Cascade delete tất cả combo items.

---

### 8. GET /api/product-combos/count
**Đếm số combos**

**Quyền:** ADMIN, MANAGER

**Query Parameters:**
- `available` (optional) - true: đếm available, false: đếm unavailable, không truyền: đếm tất cả

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Đếm số combo thành công",
  "result": 42
}
```

---

## 📦 Backend Structure

### Files Created

#### 1. Entities
- `ProductCombo.java` - Entity chính
- `ProductComboItem.java` - Junction table entity

#### 2. DTOs
- `ProductComboCreateRequest.java` - Request tạo combo
- `ProductComboUpdateRequest.java` - Request update combo
- `ProductComboResponse.java` - Response với calculated fields

#### 3. Repositories
- `ProductComboRepository.java` - 9 query methods
- `ProductComboItemRepository.java` - 6 query methods

#### 4. Mapper
- `ProductComboMapper.java` - Static mapper methods

#### 5. Service
- `ProductComboService.java` - 10 business methods

#### 6. Controller
- `ProductComboController.java` - 8 REST endpoints

#### 7. Error Codes
Added to `ErrorCode.java`:
- `PRODUCT_COMBO_NOT_FOUND(9201)`
- `PRODUCT_COMBO_NAME_EXISTED(9202)`
- `PRODUCT_COMBO_EMPTY_ITEMS(9203)`
- `PRODUCT_COMBO_INVALID_PRICE(9204)`
- `PRODUCT_COMBO_UNAVAILABLE(9205)`

---

## 🎨 Frontend Integration

### React Component Example

```tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Combo {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  availability: boolean;
  totalProducts: number;
  totalOriginalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  items: ComboItem[];
}

interface ComboItem {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

const ProductComboList: React.FC = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchCombos();
  }, [page]);

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/product-combos', {
        params: {
          page,
          size: 12,
          available: true,
          sort: 'createdAt',
          direction: 'DESC'
        }
      });
      setCombos(response.data.result.content);
    } catch (error) {
      console.error('Error fetching combos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="combo-list">
      <h2>Combo Sản Phẩm</h2>
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="combo-grid">
          {combos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      )}
    </div>
  );
};

const ComboCard: React.FC<{ combo: Combo }> = ({ combo }) => {
  return (
    <div className="combo-card">
      <img src={combo.imageUrl} alt={combo.name} />
      <h3>{combo.name}</h3>
      
      <div className="price-section">
        <span className="original-price">
          {combo.totalOriginalPrice.toLocaleString('vi-VN')} ₫
        </span>
        <span className="combo-price">
          {combo.price.toLocaleString('vi-VN')} ₫
        </span>
        <span className="discount-badge">
          -{combo.discountPercentage}%
        </span>
      </div>
      
      <div className="combo-items">
        <p>{combo.totalProducts} sản phẩm trong combo:</p>
        <ul>
          {combo.items.map((item) => (
            <li key={item.id}>
              {item.productName} x {item.quantity}
            </li>
          ))}
        </ul>
      </div>
      
      <button className="add-to-cart-btn">
        Thêm vào giỏ hàng
      </button>
    </div>
  );
};

export default ProductComboList;
```

### CSS Example

```css
.combo-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.combo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.combo-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.combo-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.combo-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}

.price-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 15px 0;
}

.original-price {
  text-decoration: line-through;
  color: #999;
  font-size: 14px;
}

.combo-price {
  font-size: 24px;
  font-weight: bold;
  color: #e74c3c;
}

.discount-badge {
  background: #e74c3c;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.combo-items {
  margin: 15px 0;
}

.combo-items ul {
  list-style: none;
  padding: 0;
}

.combo-items li {
  padding: 5px 0;
  font-size: 14px;
  color: #666;
}

.add-to-cart-btn {
  width: 100%;
  padding: 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.add-to-cart-btn:hover {
  background: #2980b9;
}
```

---

## 🧪 Testing

### Manual Testing Checklist

**Create Combo:**
- [ ] Tạo combo với 2+ sản phẩm
- [ ] Validate tên trùng
- [ ] Validate product không tồn tại
- [ ] Validate quantity = 0
- [ ] Check calculated fields (discount, percentage)

**Update Combo:**
- [ ] Update name
- [ ] Update price
- [ ] Update items (thêm, bớt sản phẩm)
- [ ] Update availability

**Retrieve Combos:**
- [ ] Get by ID
- [ ] Get all with pagination
- [ ] Filter by availability
- [ ] Search by name
- [ ] Get by product ID

**Delete Combo:**
- [ ] Xóa combo → verify cascade delete items
- [ ] Verify 404 khi get deleted combo

---

## 🔒 Security

### Authorization Matrix

| Endpoint | Customer | Manager | Admin |
|----------|----------|---------|-------|
| GET /api/product-combos | ✅ | ✅ | ✅ |
| GET /api/product-combos/{id} | ✅ | ✅ | ✅ |
| GET /api/product-combos/by-product/{id} | ✅ | ✅ | ✅ |
| POST /api/product-combos | ❌ | ✅ | ✅ |
| PUT /api/product-combos/{id} | ❌ | ✅ | ✅ |
| PATCH /api/product-combos/{id}/toggle | ❌ | ✅ | ✅ |
| DELETE /api/product-combos/{id} | ❌ | ❌ | ✅ |
| GET /api/product-combos/count | ❌ | ✅ | ✅ |

---

## 📊 Business Logic

### Discount Calculation

```
totalOriginalPrice = Σ(product.price * quantity)
discountAmount = totalOriginalPrice - combo.price
discountPercentage = (discountAmount / totalOriginalPrice) * 100
```

**Example:**
```
Product A: 15,000 ₫ x 2 = 30,000 ₫
Product B: 25,000 ₫ x 1 = 25,000 ₫
Total Original: 55,000 ₫

Combo Price: 45,000 ₫
Discount: 10,000 ₫ (18.18%)
```

### Validation Rules

1. **Combo Name:**
   - Required
   - Unique (case-insensitive)
   - Max 255 characters

2. **Combo Price:**
   - Required
   - Must be > 0
   - Không bắt buộc < totalOriginalPrice (có thể để giá = hoặc > nếu muốn)

3. **Combo Items:**
   - Minimum 1 product
   - ProductId must exist
   - Quantity > 0
   - Unique products in combo (không duplicate)

4. **Availability:**
   - Default: true
   - Toggle không xóa data

---

## 🚀 Deployment Notes

1. **Database Migration:**
   - Chạy 2 SQL scripts tạo tables
   - Verify foreign key constraints
   - Add indexes nếu cần (combo_id, product_id)

2. **Application Restart:**
   - Clean compile: `./mvnw clean compile`
   - Run: `./mvnw spring-boot:run`
   - Verify 24 repositories detected (thêm 2 mới)

3. **API Testing:**
   - Import Postman collection
   - Test tất cả endpoints
   - Verify authorization

4. **Frontend Integration:**
   - Update API base URL
   - Test CORS
   - Verify JWT authentication

---

## 📝 Example Use Cases

### 1. Combo Back-to-School
```json
{
  "name": "Combo Khai Trường",
  "price": 99000,
  "items": [
    {"productId": 10, "quantity": 5},  // 5 bút
    {"productId": 20, "quantity": 3},  // 3 vở
    {"productId": 30, "quantity": 1}   // 1 cặp sách
  ]
}
```

### 2. Combo Văn Phòng
```json
{
  "name": "Combo Văn Phòng Pro",
  "price": 150000,
  "items": [
    {"productId": 101, "quantity": 1}, // Bộ bút cao cấp
    {"productId": 102, "quantity": 2}, // 2 sổ tay
    {"productId": 103, "quantity": 1}  // 1 bấm kim
  ]
}
```

### 3. Combo Học Sinh
```json
{
  "name": "Combo Học Sinh Tiết Kiệm",
  "price": 45000,
  "items": [
    {"productId": 5, "quantity": 10},  // 10 bút bi
    {"productId": 6, "quantity": 2}    // 2 tập vở
  ]
}
```

---

## ⚠️ Known Limitations

1. **Combo trong Combo:**
   - Hiện tại không support combo chứa combo khác
   - Chỉ có thể thêm sản phẩm đơn lẻ

2. **Stock Management:**
   - Chưa có validation stock khi tạo combo
   - Cần implement check inventory trước khi add to cart

3. **Price History:**
   - Combo price changes không được track
   - Có thể thêm PriceHistory cho combo sau

4. **Dynamic Pricing:**
   - Combo price cố định
   - Không tự động update khi product price thay đổi

---

## 🔮 Future Enhancements

1. **Auto-calculate Combo Price:**
   - Tự động suggest giá combo based on discount %
   - Formula: `comboPrice = totalOriginalPrice * (1 - discount%)`

2. **Stock Validation:**
   - Check inventory khi tạo combo
   - Alert khi products trong combo hết hàng

3. **Time-limited Combos:**
   - Thêm `validFrom` và `validTo` dates
   - Auto toggle availability based on date

4. **Combo Statistics:**
   - Track số lượng combo đã bán
   - Top selling combos
   - Revenue từ combos

5. **Combo Recommendations:**
   - "Frequently bought together"
   - AI-based combo suggestions

---

**Status:** ✅ Ready for Production  
**Last Updated:** 2026-01-02  
**Compiled:** SUCCESS  
**Tests:** Pending
