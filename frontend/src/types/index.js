// Type definitions for the application
// This file serves as documentation even when using JavaScript

/**
 * User types
 */
export const UserTypes = {
  User: {
    id: 'string',
    name: 'string',
    email: 'string',
    phone: 'string',
    avatar: 'string',
    role: 'string', // 'user' | 'admin' | 'moderator'
    createdAt: 'Date',
    updatedAt: 'Date'
  }
}

/**
 * Book types
 */
export const BookTypes = {
  Book: {
    id: 'string',
    title: 'string',
    author: 'string',
    description: 'string',
    price: 'number',
    originalPrice: 'number',
    discount: 'number',
    category: 'string',
    tags: 'Array<string>',
    isbn: 'string',
    publisher: 'string',
    publishedDate: 'Date',
    pages: 'number',
    language: 'string',
    format: 'string', // 'hardcover' | 'paperback' | 'ebook' | 'audiobook'
    stock: 'number',
    images: 'Array<string>',
    rating: 'number',
    reviewCount: 'number',
    featured: 'boolean',
    createdAt: 'Date',
    updatedAt: 'Date'
  },
  
  Category: {
    id: 'string',
    name: 'string',
    slug: 'string',
    description: 'string',
    image: 'string',
    parentId: 'string',
    order: 'number'
  },
  
  Review: {
    id: 'string',
    bookId: 'string',
    userId: 'string',
    rating: 'number',
    comment: 'string',
    createdAt: 'Date',
    user: 'User'
  }
}

/**
 * Order types
 */
export const OrderTypes = {
  Order: {
    id: 'string',
    userId: 'string',
    items: 'Array<OrderItem>',
    totalAmount: 'number',
    discount: 'number',
    shippingFee: 'number',
    finalAmount: 'number',
    status: 'string', // 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
    paymentStatus: 'string', // 'pending' | 'paid' | 'failed' | 'refunded'
    paymentMethod: 'string', // 'cod' | 'bank_transfer' | 'credit_card' | 'e_wallet'
    shippingAddress: 'Address',
    billingAddress: 'Address',
    createdAt: 'Date',
    updatedAt: 'Date'
  },
  
  OrderItem: {
    id: 'string',
    bookId: 'string',
    quantity: 'number',
    price: 'number',
    book: 'Book'
  },
  
  Address: {
    id: 'string',
    fullName: 'string',
    phone: 'string',
    address: 'string',
    ward: 'string',
    district: 'string',
    province: 'string',
    isDefault: 'boolean'
  }
}

/**
 * Cart types
 */
export const CartTypes = {
  CartItem: {
    id: 'string',
    bookId: 'string',
    quantity: 'number',
    book: 'Book'
  }
}

/**
 * WebSocket message types
 */
export const MessageTypes = {
  WebSocketMessage: {
    id: 'string',
    type: 'string', // 'info' | 'success' | 'warning' | 'error'
    title: 'string',
    content: 'string',
    timestamp: 'Date',
    userId: 'string'
  },
  
  Notification: {
    id: 'string',              // UUID
    userId: 'string',          // UUID  
    username: 'string',        // Tên user
    type: 'string',            // NEW_MESSAGE | ORDER_UPDATE | PAYMENT_UPDATE | SYSTEM_NOTIFICATION | PROMOTION
    message: 'string',         // Nội dung thông báo
    anchor: 'string',          // Link đích (optional)
    status: 'string',          // UNREAD | read
    createdAt: 'string',       // ISO datetime
    updatedAt: 'string'        // ISO datetime
  }
}

/**
 * API Response types
 */
export const ApiTypes = {
  ApiResponse: {
    success: 'boolean',
    data: 'any',
    message: 'string',
    errors: 'Array<string>'
  },
  
  PaginationResponse: {
    data: 'Array<any>',
    pagination: {
      page: 'number',
      limit: 'number',
      total: 'number',
      totalPages: 'number',
      hasNext: 'boolean',
      hasPrev: 'boolean'
    }
  }
}