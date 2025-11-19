package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.cart.request.AddToCartRequest;
import com.qm.bookstore.qm_bookstore.dto.cart.request.CheckoutRequest;
import com.qm.bookstore.qm_bookstore.dto.cart.request.SelectAllItemsRequest;
import com.qm.bookstore.qm_bookstore.dto.cart.request.ToggleItemSelectionRequest;
import com.qm.bookstore.qm_bookstore.dto.cart.request.UpdateCartItemRequest;
import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.cart.response.CartResponse;
import com.qm.bookstore.qm_bookstore.service.CartService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CartController {

    CartService cartService;

    /**
     * Extract userId from authentication or sessionId from header
     */
    private UUID getUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() 
                    && !"anonymousUser".equals(authentication.getPrincipal())) {
                String userId = authentication.getName();
                log.debug("[getUserId] Authenticated user: {}", userId);
                return UUID.fromString(userId);
            }
            log.debug("[getUserId] No authenticated user (guest)");
            return null;
        } catch (IllegalArgumentException e) {
            log.error("[getUserId] ❌ Failed to parse userId from authentication: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Add product to cart
     * POST /api/cart/add
     */
    @PostMapping("/add")
    public ApiResponse<CartResponse> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        
        UUID userId = getUserId();
        log.info("[POST /cart/add] productId={}, quantity={}, userId={}, sessionId={}", 
                request.getProductId(), request.getQuantity(), userId, sessionId);
        
        CartResponse cart = cartService.addToCart(request, userId, sessionId);
        
        log.info("[POST /cart/add] ✅ Success - cartId={}, totalItems={}", 
                cart.getCartId(), cart.getSummary().getTotalItems());
        
        return ApiResponse.<CartResponse>builder()
                .success(true)
                .result(cart)
                .build();
    }

    /**
     * Get cart
     * GET /api/cart
     */
    @GetMapping
    public ApiResponse<CartResponse> getCart(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        
        UUID userId = getUserId();
        CartResponse cart = cartService.getCart(userId, sessionId);
        
        return ApiResponse.<CartResponse>builder()
                .success(true)
                .result(cart)
                .build();
    }

    /**
     * Update cart item quantity
     * PUT /api/cart/items/{id}
     */
    @PutMapping("/items/{id}")
    public ApiResponse<CartResponse> updateQuantity(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCartItemRequest request,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        
        UUID userId = getUserId();
        CartResponse cart = cartService.updateQuantity(id, request.getQuantity(), userId, sessionId);
        
        return ApiResponse.<CartResponse>builder()
                .success(true)
                .result(cart)
                .build();
    }

    /**
     * Toggle item selection
     * PUT /api/cart/items/{id}/select
     */
    @PutMapping("/items/{id}/select")
    public ApiResponse<CartResponse> toggleSelection(
            @PathVariable Long id,
            @Valid @RequestBody ToggleItemSelectionRequest request,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        
        UUID userId = getUserId();
        CartResponse cart = cartService.toggleSelection(id, request.getSelected(), userId, sessionId);
        
        return ApiResponse.<CartResponse>builder()
                .success(true)
                .result(cart)
                .build();
    }

    /**
     * Select all items
     * PUT /api/cart/select-all
     */
    @PutMapping("/select-all")
    public ApiResponse<CartResponse> selectAll(
            @Valid @RequestBody SelectAllItemsRequest request,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        
        UUID userId = getUserId();
        CartResponse cart = cartService.selectAll(request.getSelected(), userId, sessionId);
        
        return ApiResponse.<CartResponse>builder()
                .success(true)
                .result(cart)
                .build();
    }

    /**
     * Remove item from cart
     * DELETE /api/cart/items/{id}
     */
    @DeleteMapping("/items/{id}")
    public ApiResponse<CartResponse> removeItem(
            @PathVariable Long id,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        
        UUID userId = getUserId();
        CartResponse cart = cartService.removeItem(id, userId, sessionId);
        
        return ApiResponse.<CartResponse>builder()
                .success(true)
                .result(cart)
                .build();
    }

    /**
     * Clear cart
     * DELETE /api/cart/clear
     */
    @DeleteMapping("/clear")
    public ApiResponse<CartResponse> clearCart(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        
        UUID userId = getUserId();
        CartResponse cart = cartService.clearCart(userId, sessionId);
        
        return ApiResponse.<CartResponse>builder()
                .success(true)
                .result(cart)
                .build();
    }

    /**
     * Checkout (requires authentication)
     * POST /api/cart/checkout
     */
    @PostMapping("/checkout")
    public ApiResponse<String> checkout(@Valid @RequestBody CheckoutRequest request) {
        UUID userId = getUserId();
        String result = cartService.checkout(request, userId);
        
        return ApiResponse.<String>builder()
                .success(true)
                .result(result)
                .build();
    }

    /**
     * Merge guest cart to user cart (called after login)
     * POST /api/cart/merge
     */
    @PostMapping("/merge")
    public ApiResponse<Void> mergeCart(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        
        UUID userId = getUserId();
        cartService.mergeGuestCartToUser(sessionId, userId);
        
        return ApiResponse.<Void>builder()
                .success(true)
                .build();
    }
}
