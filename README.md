# 📚 QM Bookstore - Hệ Thống Quản Lý Cửa Hàng Sách Trực Tuyến

[![Java](https://img.shields.io/badge/Java-17+-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Hệ thống quản lý cửa hàng sách trực tuyến đầy đủ tính năng, bao gồm quản lý sản phẩm, giỏ hàng, đơn hàng, thanh toán, hóa đơn điện tử và nhiều tính năng khác.

## 🌟 Tính Năng Chính

### Khách Hàng
- 🛒 **Giỏ hàng thông minh**: Hỗ trợ cả người dùng đã đăng nhập và khách vãng lai
- 📦 **Combo sản phẩm**: Mua nhiều sách với giá ưu đãi
- 💳 **Thanh toán linh hoạt**: Chuyển khoản (prepaid) hoặc COD
- 🎟️ **Voucher & Khuyến mãi**: Giảm giá đơn hàng hoặc phí ship
- 📄 **Hóa đơn điện tử**: Tự động xuất hóa đơn PDF
- ⭐ **Đánh giá sản phẩm**: Rating và bình luận
- 🏆 **Tích điểm & Hạng thành viên**: Basic, Silver, Gold, Platinum

### Quản Trị
- 📊 **Dashboard**: Thống kê doanh thu, đơn hàng
- 📦 **Quản lý kho**: Nhập/xuất kho, cảnh báo tồn kho
- 👥 **Quản lý người dùng**: Phân quyền (Admin, Manager, Customer)
- 🔔 **Thông báo real-time**: WebSocket notifications
- 💬 **Chat support**: Hỗ trợ khách hàng trực tiếp

## 🏗️ Kiến Trúc Hệ Thống

```
qm-bookstore/
├── backend/          # Spring Boot REST API
├── frontend/         # React SPA
└── .github/          # GitHub Actions workflows
```

### Tech Stack

#### Backend
- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL 14+
- **ORM**: Spring Data JPA (Hibernate)
- **Security**: Spring Security + JWT
- **PDF Generation**: OpenHTMLtoPDF
- **Email**: JavaMailSender
- **WebSocket**: Spring WebSocket + STOMP

#### Frontend
- **Framework**: React 18+
- **Routing**: React Router v6
- **State Management**: Context API + Custom Hooks
- **HTTP Client**: Axios
- **UI Components**: Custom components + CSS
- **WebSocket**: SockJS + STOMP Client

#### DevOps
- **Backend Hosting**: Render.com
- **Frontend Hosting**: Vercel/Netlify
- **Database**: MySQL (Render/Railway)
- **CI/CD**: GitHub Actions

## 📋 Yêu Cầu Hệ Thống

### Development
- **Java**: JDK 17 hoặc cao hơn
- **Node.js**: v18+ và npm/yarn
- **PostgreSQL**: 14+
- **Git**: Để clone repository

### Production
- **RAM**: Tối thiểu 512MB (Backend), 256MB (Frontend)
- **Storage**: ~500MB
- **Network**: HTTPS required

## 🚀 Cài Đặt & Chạy

### 1. Clone Repository

```bash
git clone https://github.com/your-username/qm-bookstore.git
cd qm-bookstore
```

### 2. Cài Đặt Backend

#### 2.1. Cấu Hình Database

Tạo database PostgreSQL:

```sql
CREATE DATABASE qm_bookstore WITH ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';
```

#### 2.2. Cấu Hình Application

Tạo file `backend/src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/qm_bookstore
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# JWT Secret
jwt.secret=your-secret-key-here
jwt.expiration=86400000

# Email Configuration (optional)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

#### 2.3. Build & Run

```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

Backend sẽ chạy tại: `http://localhost:8080`

### 3. Cài Đặt Frontend

#### 3.1. Cài Đặt Dependencies

```bash
cd frontend
npm install
```

#### 3.2. Cấu Hình Environment

Tạo file `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

#### 3.3. Run Development Server

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

### 4. Khởi Tạo Dữ Liệu (Optional)

Chạy SQL scripts để tạo dữ liệu mẫu:

```bash
psql -U username -d qm_bookstore -f backend/src/main/resources/data.sql
```

## 🔧 Cấu Hình Nâng Cao

### Email Configuration

Để gửi email xác thực và thông báo, cấu hình SMTP:

1. Tạo App Password từ Gmail
2. Cập nhật `application.properties`
3. Enable email features trong code

### Payment Integration

Hệ thống hỗ trợ tích hợp thanh toán:

1. **Bank Transfer**: Tự động fetch từ email ngân hàng
2. **PayPal**: Cấu hình PayPal API keys
3. **VNPay**: Cấu hình VNPay merchant info

### WebSocket Configuration

WebSocket được sử dụng cho:
- Real-time notifications
- Chat support
- Order status updates

Cấu hình CORS và allowed origins trong `WebSocketConfig.java`

## 📦 Deployment

### Backend (Render.com)

1. Tạo Web Service mới trên Render
2. Connect GitHub repository
3. Cấu hình:
   - **Build Command**: `./mvnw clean install -DskipTests`
   - **Start Command**: `java -jar target/*.jar`
   - **Environment Variables**: Thêm DB credentials, JWT secret, etc.

### Frontend (Vercel)

1. Import project từ GitHub
2. Cấu hình:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: `VITE_API_BASE_URL`, `VITE_WS_URL`

### Database (Render/Railway)

1. Tạo PostgreSQL instance
2. Lấy connection string
3. Cập nhật vào backend environment variables

## 🧪 Testing

### Backend Tests

```bash
cd backend
./mvnw test
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## 📚 API Documentation

API endpoints chính:

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/test` - Health check

### Products
- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/{id}` - Chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm (Admin)
- `PUT /api/products/{id}` - Cập nhật sản phẩm (Admin)

### Cart
- `GET /api/carts/my-cart` - Lấy giỏ hàng
- `POST /api/carts/items` - Thêm vào giỏ
- `PUT /api/carts/items/{id}` - Cập nhật số lượng
- `DELETE /api/carts/items/{id}` - Xóa khỏi giỏ

### Orders
- `POST /api/orders/checkout` - Thanh toán
- `GET /api/orders/my-orders` - Đơn hàng của tôi
- `POST /api/orders/{id}/validate-payment` - Xác nhận thanh toán
- `POST /api/orders/{id}/cancel` - Hủy đơn

### Invoices
- `POST /api/invoices/generate` - Xuất hóa đơn
- `GET /api/invoices/{id}/download/pdf` - Download PDF

Chi tiết đầy đủ: Xem Swagger UI tại `http://localhost:8080/swagger-ui.html`

## 🗄️ Database Schema

Hệ thống sử dụng 25 bảng chính:

**Core Tables:**
- `users`, `roles` - Quản lý người dùng
- `products`, `categories` - Sản phẩm
- `carts`, `cart_items` - Giỏ hàng
- `orders`, `order_items` - Đơn hàng
- `invoices` - Hóa đơn
- `vouchers`, `voucher_usage` - Khuyến mãi
- `transactions` - Giao dịch ngân hàng

**Supporting Tables:**
- `product_combos`, `product_combo_items` - Combo
- `inventory_transaction_headers`, `inventory_transaction_items` - Kho
- `notifications`, `chat_messages` - Thông báo & Chat
- `product_reviews`, `product_comments` - Đánh giá
- `price_history` - Lịch sử giá

Xem ERD đầy đủ trong thư mục `/docs`

## 🔐 Security

- **Authentication**: JWT tokens (Access + Refresh)
- **Authorization**: Role-based (Admin, Manager, Customer)
- **Password**: BCrypt hashing
- **CORS**: Configured for frontend domain
- **SQL Injection**: Prevented by JPA/Hibernate
- **XSS**: Sanitized inputs
- **HTTPS**: Required in production

## 🐛 Troubleshooting

### Backend không kết nối được database
```bash
# Kiểm tra PostgreSQL đang chạy
psql -U postgres

# Kiểm tra connection string trong application.properties
```

### Frontend không gọi được API
```bash
# Kiểm tra CORS configuration
# Kiểm tra VITE_API_BASE_URL trong .env
# Kiểm tra backend đang chạy
```

## 📝 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết

## 🙏 Acknowledgments

- Spring Boot team
- React team
- OpenHTMLtoPDF library
- Render.com for hosting

---

**Made with ❤️ by Le Xuan Phuc**
