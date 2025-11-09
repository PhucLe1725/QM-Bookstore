# Product API Documentation

## Base URL
```
http://localhost:8080/api/products
```

## API Response Format
Tất cả các API response đều có format chung:
```json
{
  "success": true,
  "code": 200,
  "message": "Success message",
  "result": {}, // Dữ liệu response
  "error": null
}
```

## Product Model

### ProductResponse
```json
{
  "id": 1,
  "name": "Spring Boot Guide",
  "sku": "SBG001",
  "shortDescription": "Comprehensive guide to Spring Boot",
  "fullDescription": "A detailed guide covering all aspects of Spring Boot development...",
  "price": 29.99,
  "brand": "Tech Publications",
  "imageUrl": "https://example.com/images/spring-boot-guide.jpg",
  "stockQuantity": 100,
  "reorderLevel": 10,
  "reorderQuantity": 50,
  "availability": true,
  "category": {
    "id": 1,
    "name": "Programming Books"
  },
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2024-01-01T00:00:00"
}
```

### ProductCreateRequest
```json
{
  "name": "Spring Boot Guide", // required
  "sku": "SBG001", // optional, unique
  "shortDescription": "Comprehensive guide to Spring Boot", // optional
  "fullDescription": "A detailed guide covering all aspects...", // optional
  "price": 29.99, // required
  "brand": "Tech Publications", // optional
  "imageUrl": "https://example.com/images/spring-boot-guide.jpg", // optional
  "stockQuantity": 100, // optional, default: 0
  "reorderLevel": 10, // optional
  "reorderQuantity": 50, // optional
  "availability": true, // optional, default: true
  "categoryId": 1 // optional
}
```

### ProductUpdateRequest
```json
{
  "name": "Updated Spring Boot Guide", // optional
  "sku": "SBG001-V2", // optional, unique
  "shortDescription": "Updated description", // optional
  "fullDescription": "Updated detailed description...", // optional
  "price": 34.99, // optional
  "brand": "Tech Publications", // optional
  "imageUrl": "https://example.com/images/updated-guide.jpg", // optional
  "stockQuantity": 150, // optional
  "reorderLevel": 15, // optional
  "reorderQuantity": 75, // optional
  "availability": true, // optional
  "categoryId": 2 // optional
}
```

## API Endpoints

### 1. Get All Products (with Pagination & Filters)
**GET** `/api/products`

**Query Parameters:**
- `skipCount` (int): Số bản ghi bỏ qua (default: 0)
- `maxResultCount` (int): Số bản ghi tối đa trả về (default: 10)
- `sortBy` (string): Trường để sắp xếp (name, price, createdAt, etc.)
- `sortDirection` (string): Hướng sắp xếp (asc, desc)
- `name` (string): Lọc theo tên sản phẩm
- `sku` (string): Lọc theo SKU
- `brand` (string): Lọc theo thương hiệu
- `categoryId` (long): Lọc theo ID danh mục
- `minPrice` (decimal): Giá tối thiểu
- `maxPrice` (decimal): Giá tối đa
- `availability` (boolean): Lọc theo tình trạng có sẵn

**Example Request:**
```
GET /api/products?skipCount=0&maxResultCount=20&sortBy=name&sortDirection=asc&name=spring&minPrice=10&maxPrice=50&availability=true
```

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Products retrieved successfully",
  "result": {
    "data": [
      {
        "id": 1,
        "name": "Spring Boot Guide",
        "sku": "SBG001",
        "price": 29.99,
        "availability": true,
        // ... other fields
      }
    ],
    "totalRecords": 150
  }
}
```

### 2. Get Product by ID
**GET** `/api/products/{id}`

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Product retrieved successfully",
  "result": {
    "id": 1,
    "name": "Spring Boot Guide",
    // ... full product data
  }
}
```

### 3. Create New Product
**POST** `/api/products`

**Request Body:**
```json
{
  "name": "New Product",
  "sku": "NP001",
  "price": 19.99,
  "categoryId": 1,
  "stockQuantity": 50
}
```

**Response:**
```json
{
  "success": true,
  "code": 201,
  "message": "Product created successfully",
  "result": {
    "id": 2,
    "name": "New Product",
    // ... full created product data
  }
}
```

### 4. Update Product
**PUT** `/api/products/{id}`

**Request Body:**
```json
{
  "name": "Updated Product Name",
  "price": 24.99,
  "stockQuantity": 75
}
```

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Product updated successfully",
  "result": {
    "id": 1,
    "name": "Updated Product Name",
    // ... full updated product data
  }
}
```

### 5. Delete Product
**DELETE** `/api/products/{id}`

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Product deleted successfully",
  "result": null
}
```

### 6. Get Products by Category
**GET** `/api/products/category/{categoryId}`

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Products by category retrieved successfully",
  "result": [
    {
      "id": 1,
      "name": "Product 1",
      // ... product data
    }
  ]
}
```

### 7. Get Available Products
**GET** `/api/products/available`

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Available products retrieved successfully",
  "result": [
    // Array of available products (availability = true, stockQuantity > 0)
  ]
}
```

### 8. Search Products by Name
**GET** `/api/products/search?name={searchTerm}`

**Example:**
```
GET /api/products/search?name=spring
```

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Products searched successfully",
  "result": [
    // Array of products matching the search term
  ]
}
```

### 9. Search Products by SKU
**GET** `/api/products/search/sku?sku={skuTerm}`

**Example:**
```
GET /api/products/search/sku?sku=SBG
```

### 10. Search Products by Brand
**GET** `/api/products/search/brand?brand={brandTerm}`

**Example:**
```
GET /api/products/search/brand?brand=Tech
```

### 11. Get Low Stock Products
**GET** `/api/products/low-stock`

**Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Low stock products retrieved successfully",
  "result": [
    // Array of products where stockQuantity <= reorderLevel
  ]
}
```

## Error Responses

### Product Not Found
```json
{
  "success": false,
  "code": 1006,
  "message": "Product not found",
  "result": null,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  }
}
```

### SKU Already Exists
```json
{
  "success": false,
  "code": 1007,
  "message": "Product SKU already exists",
  "result": null,
  "error": {
    "code": "PRODUCT_SKU_ALREADY_EXISTS",
    "message": "Product SKU already exists"
  }
}
```

### Category Not Found
```json
{
  "success": false,
  "code": 1008,
  "message": "Category not found",
  "result": null,
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Category not found"
  }
}
```

## JavaScript Frontend Examples

### 1. Get All Products with Pagination
```javascript
const getProducts = async (page = 0, size = 10, filters = {}) => {
  const params = new URLSearchParams({
    skipCount: page * size,
    maxResultCount: size,
    ...filters
  });
  
  const response = await fetch(`/api/products?${params}`);
  const data = await response.json();
  
  if (data.success) {
    return {
      products: data.result.data,
      totalRecords: data.result.totalRecords,
      totalPages: Math.ceil(data.result.totalRecords / size)
    };
  } else {
    throw new Error(data.message);
  }
};

// Usage
getProducts(0, 20, { 
  name: 'spring', 
  availability: true, 
  sortBy: 'name',
  sortDirection: 'asc'
}).then(result => {
  console.log(result.products);
  console.log(`Total: ${result.totalRecords} products`);
});
```

### 2. Create Product
```javascript
const createProduct = async (productData) => {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData)
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.result;
  } else {
    throw new Error(data.message);
  }
};

// Usage
createProduct({
  name: 'New Book',
  sku: 'NB001',
  price: 29.99,
  categoryId: 1,
  stockQuantity: 100
}).then(product => {
  console.log('Product created:', product);
}).catch(error => {
  console.error('Error creating product:', error.message);
});
```

### 3. Update Product
```javascript
const updateProduct = async (id, updateData) => {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData)
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.result;
  } else {
    throw new Error(data.message);
  }
};
```

### 4. Delete Product
```javascript
const deleteProduct = async (id) => {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE'
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
};
```

### 5. Search Products
```javascript
const searchProducts = async (searchTerm, searchType = 'name') => {
  let url;
  switch (searchType) {
    case 'name':
      url = `/api/products/search?name=${encodeURIComponent(searchTerm)}`;
      break;
    case 'sku':
      url = `/api/products/search/sku?sku=${encodeURIComponent(searchTerm)}`;
      break;
    case 'brand':
      url = `/api/products/search/brand?brand=${encodeURIComponent(searchTerm)}`;
      break;
    default:
      url = `/api/products/search?name=${encodeURIComponent(searchTerm)}`;
  }
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.success) {
    return data.result;
  } else {
    throw new Error(data.message);
  }
};
```

## Authentication
Một số endpoint có thể yêu cầu authentication. Hãy thêm JWT token vào header:
```javascript
headers: {
  'Authorization': 'Bearer ' + token,
  'Content-Type': 'application/json'
}
```

## Notes
- Tất cả các trường datetime sử dụng format ISO 8601: `YYYY-MM-DDTHH:mm:ss`
- Pagination sử dụng skip/take pattern
- Các trường optional có thể bỏ qua khi gửi request
- SKU phải unique trong hệ thống
- Product availability = false và stockQuantity = 0 nghĩa là sản phẩm hết hàng
- Low stock products là những sản phẩm có stockQuantity <= reorderLevel