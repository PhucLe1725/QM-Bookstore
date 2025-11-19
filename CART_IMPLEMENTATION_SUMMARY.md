# Shopping Cart Implementation Summary

## Overview
Implemented a comprehensive shopping cart system with support for both authenticated users and guest sessions, following the CART_IMPLEMENTATION_GUIDE.md specification.

## Features Implemented

### 1. Frontend Components

#### Cart Service (`frontend/src/services/cartService.js`)
- **Session Management**: Generates and manages session IDs for guest users
  - Format: `session_{timestamp}_{random}`
  - Stored in `localStorage.cart_session_id`
- **Dual Authentication**: Automatically switches between JWT token (logged-in) and session ID (guest)
- **API Methods**:
  - `addToCart(productId, quantity)` - Add product to cart
  - `getCart()` - Retrieve cart with summary
  - `updateQuantity(itemId, quantity)` - Update item quantity
  - `toggleSelection(itemId, selected)` - Toggle item selection for checkout
  - `selectAll(selected)` - Select/deselect all items
  - `removeItem(itemId)` - Remove single item
  - `clearCart()` - Clear all items
  - `checkout(checkoutData)` - Process checkout (requires login)

#### Cart Page (`frontend/src/pages/Cart.jsx`)
- **Features**:
  - Item listing with product images, names, prices
  - Quantity controls (+ / - buttons)
  - Individual item selection checkboxes
  - Select all / deselect all toggle
  - Cart summary sidebar showing:
    - Total items vs selected items
    - Total amount vs selected amount
    - Total quantity vs selected quantity
  - Checkout form with validation:
    - Shipping address (required, textarea)
    - Phone number (required, pattern: 10-15 digits)
    - Note (optional)
    - Payment method (select: COD, BANK_TRANSFER, MOMO)
  - Empty cart state with CTA to products page
  - Loading states and error handling
  - Responsive design

#### Header Integration (`frontend/src/layouts/Header.jsx`)
- Cart icon with item count badge
- Auto-updates on cart changes
- Listens to `cartUpdated` custom event
- Shows "99+" for counts over 99

#### Product Detail Integration (`frontend/src/pages/ProductDetail.jsx`)
- "Add to Cart" button implementation
- Calls `cartService.addToCart()`
- Shows loading state while adding
- Dispatches `cartUpdated` event on success
- Toast notifications for success/error

#### Routing (`frontend/src/routes/AppRoutes.jsx`)
- Added `/cart` route (public, allows guests)
- Wrapped in MainLayout for consistent UI

### 2. Backend Components

#### Entities (Already Existed)
- `Cart.java`: Cart entity with user_id and session_id support
- `CartItem.java`: Cart item entity with is_selected flag

#### Repositories (Already Existed)
- `CartRepository.java`: Methods for finding by userId or sessionId
- `CartItemRepository.java`: Methods for cart item operations

#### DTOs (Created)
- `AddToCartRequest.java`: Request for adding items
- `CheckoutRequest.java`: Checkout form data
- `CartItemResponse.java`: Cart item with product details
- `CartResponse.java`: Full cart with summary statistics

#### Service (`CartService.java`)
- **Core Methods**:
  - `getOrCreateCart(userId, sessionId)` - Lazy cart creation
  - `addToCart()` - Add or update item quantity
  - `getCart()` - Get cart with calculated summary
  - `updateQuantity()` - Update item quantity
  - `toggleSelection()` - Toggle item selection
  - `selectAll()` - Select/deselect all items
  - `removeItem()` - Remove single item
  - `clearCart()` - Clear all items
  - `checkout()` - Process checkout (authenticated only)
  - `mergeGuestCartToUser()` - Merge guest cart on login

- **Business Logic**:
  - Automatic cart creation on first add
  - Merge quantities when adding existing product
  - Dynamic price calculation from products table
  - Only selected items removed after checkout
  - Cart ownership verification
  - Session merge on login (guest → user)

#### Controller (`CartController.java`)
- RESTful endpoints:
  - `POST /api/cart/add` - Add to cart
  - `GET /api/cart` - Get cart
  - `PUT /api/cart/items/{id}` - Update quantity
  - `PUT /api/cart/items/{id}/select` - Toggle selection
  - `PUT /api/cart/select-all` - Select all
  - `DELETE /api/cart/items/{id}` - Remove item
  - `DELETE /api/cart/clear` - Clear cart
  - `POST /api/cart/checkout` - Checkout (requires auth)
  - `POST /api/cart/merge` - Merge guest cart

- **Authentication Handling**:
  - Extracts userId from SecurityContext
  - Accepts `X-Session-ID` header for guests
  - Automatically routes to appropriate cart

#### Security Configuration
- `/api/cart/checkout` - Requires authentication
- `/api/cart/**` - Permits all (allows guests)
- Checkout enforced in service layer as well

#### Error Codes
Added to `ErrorCode.java`:
- `CART_NOT_FOUND(6001, "Cart not found")`
- `CART_ITEM_NOT_FOUND(6002, "Cart item not found")`
- `NO_ITEMS_SELECTED(6003, "No items selected for checkout")`
- `INVALID_REQUEST(6004, "Invalid request")`

### 3. Integration Points

#### Login Flow Enhancement (`authService.js`)
- After successful login, automatically calls `/cart/merge`
- Sends session ID to merge guest cart to user cart
- Clears session ID from localStorage after merge
- Triggers `cartUpdated` event to refresh cart count
- Gracefully handles merge failures (doesn't block login)

#### Event-Based Updates
- Custom event `cartUpdated` dispatched when:
  - Item added to cart
  - Item quantity updated
  - Item removed
  - Cart cleared
  - Cart merged on login
- Header listens for event and refreshes cart count

## Data Flow

### Guest User Flow
1. User browses products (no login)
2. Clicks "Add to Cart" → generates session ID
3. Session ID stored in `localStorage.cart_session_id`
4. All cart operations send `X-Session-ID` header
5. Backend creates cart with session_id field
6. Guest can add/remove items, but cannot checkout

### Authenticated User Flow
1. User logs in → JWT token stored in cookies
2. All cart operations send `Authorization: Bearer {token}`
3. Backend creates cart with user_id field
4. User can perform all operations including checkout

### Guest → User Transition
1. Guest has items in cart (session_id cart)
2. User logs in
3. Login success → call `/cart/merge` with session ID
4. Backend:
   - Finds guest cart by session_id
   - Finds or creates user cart by user_id
   - For each guest cart item:
     - If product exists in user cart → merge quantities
     - Else → move item to user cart
   - Delete guest cart
5. Frontend clears session ID
6. User sees merged cart

## Key Design Decisions

1. **Lazy Cart Creation**: Carts only created when first item added (not on page load)
2. **Selective Checkout**: Only selected items removed after checkout (cart persists)
3. **Dynamic Pricing**: Prices fetched from products table at cart retrieval time
4. **Session Format**: `session_{timestamp}_{random}` for uniqueness
5. **Dual Auth Support**: Single endpoint serves both user and guest (differentiated by headers)
6. **Cart Merge**: Seamless transition from guest to user on login
7. **Event-Driven Updates**: Cart count updates across app without prop drilling

## Testing Recommendations

1. **Guest Cart**:
   - Add items without login
   - Verify session ID in localStorage
   - Verify cart persists across page refreshes
   - Verify cannot checkout without login

2. **User Cart**:
   - Login and add items
   - Verify JWT token used instead of session ID
   - Verify can checkout
   - Logout and verify cart persists

3. **Cart Merge**:
   - Add items as guest
   - Login with existing account
   - Verify guest cart items merged to user cart
   - Verify session ID cleared

4. **Selective Checkout**:
   - Add multiple items
   - Select only some items
   - Checkout
   - Verify only selected items removed
   - Verify unselected items remain

5. **Cart Operations**:
   - Add duplicate products (verify quantity merge)
   - Update quantities
   - Toggle selection
   - Select all / deselect all
   - Remove items
   - Clear cart

## API Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/cart/add` | Optional | Add product to cart |
| GET | `/api/cart` | Optional | Get cart with summary |
| PUT | `/api/cart/items/{id}` | Optional | Update item quantity |
| PUT | `/api/cart/items/{id}/select` | Optional | Toggle item selection |
| PUT | `/api/cart/select-all` | Optional | Select/deselect all |
| DELETE | `/api/cart/items/{id}` | Optional | Remove item |
| DELETE | `/api/cart/clear` | Optional | Clear cart |
| POST | `/api/cart/checkout` | Required | Process checkout |
| POST | `/api/cart/merge` | Required | Merge guest cart |

## Frontend Files Modified/Created

### Created
- `frontend/src/services/cartService.js`
- `frontend/src/pages/Cart.jsx`

### Modified
- `frontend/src/services/index.js` (added cartService export)
- `frontend/src/pages/index.js` (added Cart export)
- `frontend/src/routes/AppRoutes.jsx` (added /cart route)
- `frontend/src/layouts/Header.jsx` (added cart icon with count)
- `frontend/src/pages/ProductDetail.jsx` (added "Add to Cart" functionality)
- `frontend/src/services/authService.js` (added cart merge on login)

## Backend Files Created

- `backend/.../dto/request/AddToCartRequest.java`
- `backend/.../dto/request/CheckoutRequest.java`
- `backend/.../dto/response/CartItemResponse.java`
- `backend/.../dto/response/CartResponse.java`
- `backend/.../service/CartService.java`
- `backend/.../controller/CartController.java`

## Backend Files Modified

- `backend/.../exception/ErrorCode.java` (added cart error codes)
- `backend/.../config/SecurityConfig.java` (configured cart endpoint permissions)

## Next Steps (Recommended)

1. **Order Creation**: Implement order entity and service for checkout
2. **Payment Integration**: Integrate with payment gateways (COD, Bank Transfer, MoMo)
3. **Stock Validation**: Check product stock before adding to cart
4. **Price Snapshots**: Store price at time of adding (prevent price changes)
5. **Cart Expiration**: Auto-clear old guest carts (cleanup job)
6. **Quantity Limits**: Enforce max quantity per product
7. **Product Availability**: Handle out-of-stock products in cart
8. **Shipping Calculation**: Add shipping cost calculation
9. **Discount Codes**: Implement coupon/promo code system
10. **Order History**: Link carts to orders for purchase tracking

## Conclusion

The shopping cart system is now fully implemented with support for both authenticated and guest users. The system follows best practices for e-commerce carts including lazy creation, selective checkout, cart persistence, and seamless guest-to-user migration. All components are integrated and ready for testing.
