package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.order.request.CancelOrderRequest;
import com.qm.bookstore.qm_bookstore.dto.order.request.CheckoutRequest;
import com.qm.bookstore.qm_bookstore.dto.order.request.UpdateOrderStatusRequest;
import com.qm.bookstore.qm_bookstore.dto.order.response.*;
import com.qm.bookstore.qm_bookstore.service.OrderService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class OrderController {

    OrderService orderService;

    /**
     * Checkout - Tạo đơn hàng từ giỏ hàng
     * POST /api/orders/checkout
     */
    @PostMapping("/checkout")
    public ApiResponse<CheckoutResponse> checkout(
            @Valid @RequestBody CheckoutRequest request,
            Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getName());
        log.info("[checkout] User {} creating order", userId);

        CheckoutResponse response = orderService.checkout(userId, request);
        return ApiResponse.<CheckoutResponse>builder()
                .code(1000)
                .message("Order created successfully")
                .result(response)
                .build();
    }

    /**
     * Get my orders - Lấy danh sách đơn hàng (Updated with 3 status filters)
     * GET /api/orders/my-orders
     */
    @GetMapping("/my-orders")
    public ApiResponse<Page<OrderResponse>> getMyOrders(
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String fulfillmentStatus,
            @RequestParam(required = false) String orderStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getName());
        log.info("[getMyOrders] User {} fetching orders with filters: payment={}, fulfillment={}, order={}", 
                userId, paymentStatus, fulfillmentStatus, orderStatus);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderResponse> orders = orderService.getMyOrders(
                userId, paymentStatus, fulfillmentStatus, orderStatus, pageable);

        return ApiResponse.<Page<OrderResponse>>builder()
                .code(1000)
                .message("Success")
                .result(orders)
                .build();
    }

    /**
     * Get order detail - Chi tiết đơn hàng
     * GET /api/orders/{orderId}
     */
    @GetMapping("/{orderId}")
    public ApiResponse<OrderDetailResponse> getOrderDetail(
            @PathVariable Long orderId,
            Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getName());
        log.info("[getOrderDetail] User {} fetching order {}", userId, orderId);

        OrderDetailResponse response = orderService.getOrderDetail(userId, orderId);

        return ApiResponse.<OrderDetailResponse>builder()
                .code(1000)
                .message("Success")
                .result(response)
                .build();
    }

    /**
     * Cancel order - Hủy đơn hàng
     * POST /api/orders/{orderId}/cancel
     */
    @PostMapping("/{orderId}/cancel")
    public ApiResponse<Void> cancelOrder(
            @PathVariable Long orderId,
            @Valid @RequestBody CancelOrderRequest request,
            Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getName());
        log.info("[cancelOrder] User {} cancelling order {}", userId, orderId);

        orderService.cancelOrder(userId, orderId, request);

        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Order cancelled successfully")
                .build();
    }

    /**
     * Validate payment - Kiểm tra thanh toán cho prepaid order
     * POST /api/orders/{orderId}/validate-payment
     */
    @PostMapping("/{orderId}/validate-payment")
    public ApiResponse<ValidatePaymentResponse> validatePayment(
            @PathVariable Long orderId,
            Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getName());
        log.info("[validatePayment] User {} validating payment for order {}", userId, orderId);

        ValidatePaymentResponse response = orderService.validatePayment(userId, orderId);

        return ApiResponse.<ValidatePaymentResponse>builder()
                .code(1000)
                .message(response.getPaymentConfirmed() 
                    ? "Payment validated successfully" 
                    : "Payment not found yet")
                .result(response)
                .build();
    }

    /**
     * Reorder - Đặt lại đơn hàng cũ
     * POST /api/orders/{orderId}/reorder
     */
    @PostMapping("/{orderId}/reorder")
    public ApiResponse<ReorderResponse> reorder(
            @PathVariable Long orderId,
            Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getName());
        log.info("[reorder] User {} reordering from order {}", userId, orderId);

        ReorderResponse response = orderService.reorder(userId, orderId);

        return ApiResponse.<ReorderResponse>builder()
                .code(1000)
                .message("Products added to cart successfully")
                .result(response)
                .build();
    }

    /**
     * Update order status - Cập nhật trạng thái (Admin/Manager) - Updated with 3 status axes
     * PATCH /api/orders/{orderId}/status
     */
    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<Void> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {

        log.info("[updateOrderStatus] Updating order {} with statuses: payment={}, fulfillment={}, order={}", 
                orderId, request.getPaymentStatus(), request.getFulfillmentStatus(), request.getOrderStatus());

        orderService.updateOrderStatus(orderId, request);

        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Order status updated successfully")
                .build();
    }

    /**
     * Get all orders - Quản lý đơn hàng (Admin/Manager) - Updated with 3 status filters
     * GET /api/orders/manage
     */
    @GetMapping("/manage")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<Page<OrderResponse>> getAllOrders(
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String fulfillmentStatus,
            @RequestParam(required = false) String orderStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("[getAllOrders] Fetching all orders with filters: payment={}, fulfillment={}, order={}", 
                paymentStatus, fulfillmentStatus, orderStatus);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderResponse> orders = orderService.getAllOrders(
                paymentStatus, fulfillmentStatus, orderStatus, pageable);

        return ApiResponse.<Page<OrderResponse>>builder()
                .code(1000)
                .message("Success")
                .result(orders)
                .build();
    }
}
