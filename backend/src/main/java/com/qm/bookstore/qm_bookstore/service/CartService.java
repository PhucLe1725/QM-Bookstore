package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.cart.request.AddToCartRequest;
import com.qm.bookstore.qm_bookstore.dto.cart.request.ToggleItemSelectionRequest;
import com.qm.bookstore.qm_bookstore.dto.cart.request.UpdateCartItemRequest;
import com.qm.bookstore.qm_bookstore.dto.cart.response.CartItemResponse;
import com.qm.bookstore.qm_bookstore.dto.cart.response.CartResponse;
import com.qm.bookstore.qm_bookstore.dto.cart.response.CartSummary;
import com.qm.bookstore.qm_bookstore.entity.Cart;
import com.qm.bookstore.qm_bookstore.entity.CartItem;
import com.qm.bookstore.qm_bookstore.entity.Product;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.repository.CartItemRepository;
import com.qm.bookstore.qm_bookstore.repository.CartRepository;
import com.qm.bookstore.qm_bookstore.repository.ProductRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CartService {

    CartRepository cartRepository;
    CartItemRepository cartItemRepository;
    ProductRepository productRepository;

    /**
     * Get or create cart for user or guest session
     * - User logged in: Create ONE cart with userId (reuse existing cart)
     * - Guest: Create ONE cart with sessionId (reuse existing cart)
     */
    @Transactional
    public Cart getOrCreateCart(UUID userId, String sessionId) {
        log.info("[getOrCreateCart] Called with userId={}, sessionId={}", userId, sessionId);
        
        if (userId != null) {
            // User is logged in - find or create cart with userId
            log.debug("[getOrCreateCart] User authenticated, searching for cart with userId: {}", userId);
            Optional<Cart> existingCart = cartRepository.findByUserId(userId);
            
            if (existingCart.isPresent()) {
                log.info("[getOrCreateCart] ✅ Found existing cart id={} for user={}", 
                        existingCart.get().getId(), userId);
                return existingCart.get();
            } else {
                log.info("[getOrCreateCart] 🆕 Creating NEW cart for user: {}", userId);
                Cart newCart = Cart.builder()
                        .userId(userId)
                        .sessionId(null)
                        .build();
                Cart savedCart = cartRepository.save(newCart);
                log.info("[getOrCreateCart] ✅ Created cart id={} for user={}", savedCart.getId(), userId);
                return savedCart;
            }
        } else if (sessionId != null && !sessionId.isEmpty()) {
            // Guest user - find or create cart with sessionId
            log.debug("[getOrCreateCart] Guest user, searching for cart with sessionId: {}", sessionId);
            Optional<Cart> existingCart = cartRepository.findBySessionId(sessionId);
            
            if (existingCart.isPresent()) {
                log.info("[getOrCreateCart] ✅ Found existing cart id={} for session={}", 
                        existingCart.get().getId(), sessionId);
                return existingCart.get();
            } else {
                log.info("[getOrCreateCart] 🆕 Creating NEW cart for session: {}", sessionId);
                Cart newCart = Cart.builder()
                        .userId(null)
                        .sessionId(sessionId)
                        .build();
                Cart savedCart = cartRepository.save(newCart);
                log.info("[getOrCreateCart] ✅ Created cart id={} for session={}", savedCart.getId(), sessionId);
                return savedCart;
            }
        } else {
            // Neither userId nor sessionId provided
            log.error("[getOrCreateCart] ❌ INVALID: both userId and sessionId are null/empty");
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }

    /**
     * Add product to cart
     */
    @Transactional
    public CartResponse addToCart(AddToCartRequest request, UUID userId, String sessionId) {
        log.info("[addToCart] START - productId={}, quantity={}, userId={}, sessionId={}", 
                request.getProductId(), request.getQuantity(), userId, sessionId);
        
        // 1. Validate product exists and has stock
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> {
                    log.error("[addToCart] ❌ Product not found: {}", request.getProductId());
                    return new AppException(ErrorCode.PRODUCT_NOT_FOUND);
                });

        log.debug("[addToCart] Product found: id={}, name={}, stock={}", 
                product.getId(), product.getName(), product.getStockQuantity());

        if (product.getStockQuantity() < request.getQuantity()) {
            log.error("[addToCart] ❌ Insufficient stock: requested={}, available={}", 
                    request.getQuantity(), product.getStockQuantity());
            throw new AppException(ErrorCode.PRODUCT_OUT_OF_STOCK);
        }

        // 2. Get or create cart
        Cart cart = getOrCreateCart(userId, sessionId);
        log.info("[addToCart] Using cart id={}", cart.getId());

        // 3. Check if item already exists in cart
        CartItem existingItem = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), request.getProductId())
                .orElse(null);

        if (existingItem != null) {
            // Product already in cart - throw error
            log.warn("Product {} already exists in cart {}", request.getProductId(), cart.getId());
            throw new AppException(ErrorCode.PRODUCT_ALREADY_IN_CART);
        }

        // 4. Product not in cart - create new cart item
        CartItem cartItem = CartItem.builder()
                .cartId(cart.getId())
                .productId(request.getProductId())
                .quantity(request.getQuantity())
                .isSelected(false)
                .build();
        cartItemRepository.save(cartItem);
        
        log.info("Added new item to cart {}: product {} with quantity {}", 
                cart.getId(), request.getProductId(), request.getQuantity());

        return getCart(userId, sessionId);
    }

    /**
     * Get cart details
     */
    @Transactional(readOnly = true)
    public CartResponse getCart(UUID userId, String sessionId) {
        Cart cart = null;
        
        if (userId != null) {
            cart = cartRepository.findByUserId(userId).orElse(null);
        } else if (sessionId != null && !sessionId.isEmpty()) {
            cart = cartRepository.findBySessionId(sessionId).orElse(null);
        }

        if (cart == null) {
            // Return empty cart
            return CartResponse.builder()
                    .items(List.of())
                    .summary(CartSummary.builder()
                            .totalItems(0)
                            .selectedItems(0)
                            .totalQuantity(0)
                            .selectedQuantity(0)
                            .totalAmount(BigDecimal.ZERO)
                            .selectedAmount(BigDecimal.ZERO)
                            .build())
                    .build();
        }

        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        List<CartItemResponse> itemResponses = cartItems.stream()
                .map(this::toCartItemResponse)
                .collect(Collectors.toList());

        // Calculate summary
        Integer totalItems = cartItems.size();
        Integer selectedItems = (int) cartItems.stream().filter(CartItem::getIsSelected).count();
        
        BigDecimal totalAmount = cartItems.stream()
                .map(item -> {
                    Product product = productRepository.findById(item.getProductId()).orElse(null);
                    if (product == null) return BigDecimal.ZERO;
                    return product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal selectedAmount = cartItems.stream()
                .filter(CartItem::getIsSelected)
                .map(item -> {
                    Product product = productRepository.findById(item.getProductId()).orElse(null);
                    if (product == null) return BigDecimal.ZERO;
                    return product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Integer totalQuantity = cartItems.stream()
                .mapToInt(CartItem::getQuantity)
                .sum();

        Integer selectedQuantity = cartItems.stream()
                .filter(CartItem::getIsSelected)
                .mapToInt(CartItem::getQuantity)
                .sum();

        return CartResponse.builder()
                .cartId(cart.getId())
                .items(itemResponses)
                .summary(CartSummary.builder()
                        .totalItems(totalItems)
                        .selectedItems(selectedItems)
                        .totalQuantity(totalQuantity)
                        .selectedQuantity(selectedQuantity)
                        .totalAmount(totalAmount)
                        .selectedAmount(selectedAmount)
                        .build())
                .build();
    }

    /**
     * Update cart item quantity
     */
    @Transactional
    public CartResponse updateQuantity(Long itemId, Integer quantity, UUID userId, String sessionId) {
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_FOUND));

        // Verify cart ownership
        Cart cart = cartRepository.findById(cartItem.getCartId())
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        
        verifyCartOwnership(cart, userId, sessionId);

        if (quantity < 1) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);

        return getCart(userId, sessionId);
    }

    /**
     * Toggle item selection
     */
    @Transactional
    public CartResponse toggleSelection(Long itemId, Boolean selected, UUID userId, String sessionId) {
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_FOUND));

        // Verify cart ownership
        Cart cart = cartRepository.findById(cartItem.getCartId())
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        
        verifyCartOwnership(cart, userId, sessionId);

        cartItem.setIsSelected(selected);
        cartItemRepository.save(cartItem);

        return getCart(userId, sessionId);
    }

    /**
     * Select or deselect all items
     */
    @Transactional
    public CartResponse selectAll(Boolean selected, UUID userId, String sessionId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());

        cartItems.forEach(item -> item.setIsSelected(selected));
        cartItemRepository.saveAll(cartItems);

        return getCart(userId, sessionId);
    }

    /**
     * Remove item from cart
     */
    @Transactional
    public CartResponse removeItem(Long itemId, UUID userId, String sessionId) {
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_FOUND));

        // Verify cart ownership
        Cart cart = cartRepository.findById(cartItem.getCartId())
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));
        
        verifyCartOwnership(cart, userId, sessionId);

        cartItemRepository.delete(cartItem);

        return getCart(userId, sessionId);
    }

    /**
     * Clear entire cart
     */
    @Transactional
    public CartResponse clearCart(UUID userId, String sessionId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        cartItemRepository.deleteByCartId(cart.getId());

        return getCart(userId, sessionId);
    }

    /**
     * Merge guest cart to user cart on login
     */
    @Transactional
    public void mergeGuestCartToUser(String sessionId, UUID userId) {
        if (sessionId == null || userId == null) return;

        Cart guestCart = cartRepository.findBySessionId(sessionId).orElse(null);
        if (guestCart == null) return;

        Cart userCart = getOrCreateCart(userId, null);
        List<CartItem> guestItems = cartItemRepository.findByCartId(guestCart.getId());

        for (CartItem guestItem : guestItems) {
            CartItem existingItem = cartItemRepository
                    .findByCartIdAndProductId(userCart.getId(), guestItem.getProductId())
                    .orElse(null);

            if (existingItem != null) {
                // Merge quantities
                existingItem.setQuantity(existingItem.getQuantity() + guestItem.getQuantity());
                cartItemRepository.save(existingItem);
            } else {
                // Move item to user cart
                guestItem.setCartId(userCart.getId());
                cartItemRepository.save(guestItem);
            }
        }

        // Delete guest cart
        cartRepository.delete(guestCart);
    }

    /**
     * Convert CartItem to CartItemResponse
     */
    private CartItemResponse toCartItemResponse(CartItem cartItem) {
        Product product = productRepository.findById(cartItem.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));

        return CartItemResponse.builder()
                .id(cartItem.getId())
                .productId(product.getId())
                .productName(product.getName())
                .productImage(product.getImageUrl())
                .price(product.getPrice())
                .quantity(cartItem.getQuantity())
                .subtotal(subtotal)
                .isSelected(cartItem.getIsSelected())
                .createdAt(cartItem.getCreatedAt())
                .updatedAt(cartItem.getUpdatedAt())
                .build();
    }

    /**
     * Verify cart ownership
     */
    private void verifyCartOwnership(Cart cart, UUID userId, String sessionId) {
        if (userId != null && !userId.equals(cart.getUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        if (sessionId != null && !sessionId.equals(cart.getSessionId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }
}
