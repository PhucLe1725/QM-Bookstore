package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.order.request.CancelOrderRequest;
import com.qm.bookstore.qm_bookstore.dto.order.request.CheckoutRequest;
import com.qm.bookstore.qm_bookstore.dto.order.request.UpdateOrderStatusRequest;
import com.qm.bookstore.qm_bookstore.dto.order.response.*;
import com.qm.bookstore.qm_bookstore.entity.*;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.mapper.OrderMapper;
import com.qm.bookstore.qm_bookstore.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Transactional
public class OrderService {

    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;
    CartItemRepository cartItemRepository;
    ProductRepository productRepository;
    VoucherRepository voucherRepository;
    VoucherService voucherService;
    OrderMapper orderMapper;
    TransactionRepository transactionRepository;
    TransactionService transactionService;

    /**
     * Checkout - Tạo đơn hàng từ giỏ hàng (Updated with new schema)
     */
    public CheckoutResponse checkout(UUID userId, CheckoutRequest request) {
        log.info("[checkout] User {} is checking out with paymentMethod={}, fulfillmentMethod={}", 
                userId, request.getPaymentMethod(), request.getFulfillmentMethod());

        // 1. Lấy cart items đã được chọn
        List<CartItem> selectedItems = cartItemRepository.findSelectedItemsByUserId(userId);
        if (selectedItems.isEmpty()) {
            throw new AppException(ErrorCode.CART_EMPTY);
        }

        // 2. Validate inventory
        for (CartItem item : selectedItems) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

            if (product.getStockQuantity() < item.getQuantity()) {
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
            }
        }

        // 3. Calculate subtotal_amount và tạo OrderItems với snapshot
        BigDecimal subtotalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : selectedItems) {
            Product product = productRepository.findById(cartItem.getProductId()).orElseThrow();
            
            // SNAPSHOT: unitPrice, categoryId
            BigDecimal unitPrice = product.getPrice();
            Long categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
            BigDecimal lineTotal = unitPrice.multiply(new BigDecimal(cartItem.getQuantity()));
            
            OrderItem orderItem = OrderItem.builder()
                    .productId(cartItem.getProductId())
                    .categoryId(categoryId)  // SNAPSHOT for statistics
                    .quantity(cartItem.getQuantity())
                    .unitPrice(unitPrice)    // SNAPSHOT price
                    .lineTotal(lineTotal)
                    .build();
            
            orderItems.add(orderItem);
            subtotalAmount = subtotalAmount.add(lineTotal);
        }

        // 4. Calculate shipping_fee
        BigDecimal shippingFee = BigDecimal.ZERO;
        if ("delivery".equals(request.getFulfillmentMethod())) {
            // Use frontend-calculated shipping fee based on distance
            // If not provided, default to 25k
            shippingFee = request.getShippingFee() != null 
                ? request.getShippingFee() 
                : new BigDecimal("25000");
        }

        // 5. Apply voucher using VoucherService (calculate discount_amount)
        BigDecimal discountAmount = BigDecimal.ZERO;
        Long voucherId = null;
        
        if (request.getVoucherCode() != null && !request.getVoucherCode().isEmpty()) {
            // Use new VoucherService to validate and calculate discount (with userId for per-user limit check)
            var validationResult = voucherService.validateVoucher(
                    request.getVoucherCode(), 
                    subtotalAmount, 
                    shippingFee,
                    userId // Pass userId to check per-user limit
            );

            if (!validationResult.getValid()) {
                // Throw specific error based on validation message
                throw new AppException(ErrorCode.VOUCHER_INVALID);
            }

            // Get voucherId for saving in order
            Voucher voucher = voucherRepository.findActiveVoucherByCode(request.getVoucherCode())
                    .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));
            
            voucherId = voucher.getId();
            discountAmount = validationResult.getDiscountValue();
            
            log.info("[checkout] Applied voucher {} - Discount: {} (apply to: {})", 
                    request.getVoucherCode(), discountAmount, validationResult.getApplyTo());
        }

        // 6. Calculate total_amount = subtotal - discount + shipping
        BigDecimal totalAmount = subtotalAmount.subtract(discountAmount).add(shippingFee);

        // 7. Create Order với 3 trục trạng thái
        Order order = Order.builder()
                .userId(userId)
                .voucherId(voucherId)
                .subtotalAmount(subtotalAmount)
                .discountAmount(discountAmount)
                .totalAmount(totalAmount)
                .shippingFee(shippingFee)
                .paymentStatus("pending")
                .orderStatus("confirmed")
                .paymentMethod(request.getPaymentMethod())
                .fulfillmentMethod(request.getFulfillmentMethod())
                .receiverName(request.getReceiverName())
                .receiverPhone(request.getReceiverPhone())
                .receiverAddress(request.getReceiverAddress())
                .note(request.getNote())
                .build();

        // Set fulfillment_status based on fulfillment_method
        if ("pickup".equals(request.getFulfillmentMethod())) {
            order.setFulfillmentStatus("pickup");
        } else {
            order.setFulfillmentStatus("shipping");
        }

        // Set receiver info (only if delivery)
        if ("delivery".equals(request.getFulfillmentMethod())) {
            order.setReceiverName(request.getReceiverName());
            order.setReceiverPhone(request.getReceiverPhone());
            order.setReceiverAddress(request.getReceiverAddress());
            // Set expected delivery time (example: 3 days from now)
            order.setExpectedDeliveryTime(LocalDateTime.now().plusDays(3));
        }

        order = orderRepository.save(order);
        log.info("[checkout] Created order id={}", order.getId());

        // 7.5. Generate and save transfer content (QMORD{id})
        String transferContent = "QMORD" + order.getId();
        order.setTransferContent(transferContent);
        order = orderRepository.save(order);
        log.info("[checkout] Generated transferContent: {}", transferContent);

        // 7.6. KHÔNG increment voucher tại đây nữa
        // Voucher sẽ được increment SAU KHI payment được confirm (trong validatePayment method)
        // Điều này đảm bảo voucher chỉ được tính khi user thực sự thanh toán
        // Nếu order bị cancel trước khi thanh toán, voucher không bị mất

        // 8. Save OrderItems với orderId
        for (OrderItem orderItem : orderItems) {
            orderItem.setOrderId(order.getId());
        }
        orderItemRepository.saveAll(orderItems);

        // 9. Update product inventory
        for (CartItem item : selectedItems) {
            Product product = productRepository.findById(item.getProductId()).orElseThrow();
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);
        }

        // 10. Remove selected items from cart
        cartItemRepository.deleteSelectedItemsByUserId(userId);

        // 11. Generate payment URL (if prepaid) & map response
        CheckoutResponse response = orderMapper.toCheckoutResponse(order);
        if ("prepaid".equals(request.getPaymentMethod())) {
            response.setPaymentUrl("https://payment.vnpay.vn/order/" + order.getId());
        }

        return response;
    }

    /**
     * Get my orders with pagination (Updated with new status filters)
     */
    public Page<OrderResponse> getMyOrders(UUID userId, String paymentStatus, String fulfillmentStatus, 
                                          String orderStatus, Pageable pageable) {
        log.info("[getMyOrders] User {} requesting orders with filters: payment={}, fulfillment={}, order={}", 
                userId, paymentStatus, fulfillmentStatus, orderStatus);

        Page<Order> orders = orderRepository.findByUserIdAndStatuses(
                userId, paymentStatus, fulfillmentStatus, orderStatus, pageable);

        return orders.map(this::mapToOrderResponse);
    }

    /**
     * Get all orders (Admin/Manager)
     */
    public Page<OrderResponse> getAllOrders(String paymentStatus, String fulfillmentStatus, 
                                           String orderStatus, Pageable pageable) {
        log.info("[getAllOrders] Requesting all orders with filters: payment={}, fulfillment={}, order={}", 
                paymentStatus, fulfillmentStatus, orderStatus);

        Page<Order> orders = orderRepository.findByStatuses(
                paymentStatus, fulfillmentStatus, orderStatus, pageable);

        return orders.map(this::mapToOrderResponse);
    }

    /**
     * Get order detail
     */
    public OrderDetailResponse getOrderDetail(UUID userId, Long orderId) {
        log.info("[getOrderDetail] User {} requesting order {}", userId, orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Check permission
        if (!order.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.ORDER_ACCESS_DENIED);
        }

        return mapToOrderDetailResponse(order);
    }

    /**
     * Cancel order (Updated with new status)
     */
    public void cancelOrder(UUID userId, Long orderId, CancelOrderRequest request) {
        log.info("[cancelOrder] User {} cancelling order {} with reason: {}", userId, orderId, request.getReason());

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Check permission
        if (!order.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.ORDER_ACCESS_DENIED);
        }

        // Validate status - can only cancel if confirmed but not paid
        if (!"confirmed".equals(order.getOrderStatus())) {
            throw new AppException(ErrorCode.CANNOT_CANCEL_ORDER);
        }
        if ("paid".equals(order.getPaymentStatus())) {
            throw new AppException(ErrorCode.CANNOT_CANCEL_ORDER);
        }

        // Update order status
        order.setOrderStatus("cancelled");
        order.setCancelReason(request.getReason());  // Save cancel reason
        orderRepository.save(order);

        // Restore inventory
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            Product product = productRepository.findById(item.getProductId()).orElseThrow();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        }

        log.info("[cancelOrder] Order {} cancelled successfully", orderId);
    }

    /**
     * Validate payment - Kiểm tra thanh toán cho prepaid order
     */
    public ValidatePaymentResponse validatePayment(UUID userId, Long orderId) {
        log.info("[validatePayment] User {} validating payment for order {}", userId, orderId);

        // 1. Kiểm tra order tồn tại
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // 2. Check permission
        if (!order.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.ORDER_ACCESS_DENIED);
        }

        // 3. Kiểm tra paymentMethod
        if (!"prepaid".equals(order.getPaymentMethod())) {
            throw new AppException(ErrorCode.INVALID_PAYMENT_METHOD);
        }

        // 4. Nếu đã paid rồi
        if ("paid".equals(order.getPaymentStatus())) {
            return ValidatePaymentResponse.builder()
                    .paymentConfirmed(true)
                    .message("Đơn hàng đã được thanh toán trước đó")
                    .build();
        }

        // 5. Nếu order đã bị cancel
        if ("cancelled".equals(order.getOrderStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_CANCELLED);
        }

        // 6. Tìm transaction trong database
        // Note: Transactions should be fetched separately via POST /api/transactions/fetch-from-email
        // to avoid timeout issues during payment validation
        String expectedTransferContent = "QMORD" + orderId;
        
        // Trừ 2 phút buffer vì transactionDate có thể bị làm tròn (mất giây)
        // hoặc user chuyển khoản trước rồi mới tạo order
        LocalDateTime searchFromDate = order.getCreatedAt().minusMinutes(2);
        
        var transactionOpt = transactionRepository
                .findByTransferContentAndAmountAndDateAfter(
                        expectedTransferContent,
                        order.getTotalAmount(),
                        searchFromDate
                );

        // 7. Nếu CHƯA tìm thấy transaction
        if (transactionOpt.isEmpty()) {
            log.info("[validatePayment] Transaction not found for order {}", orderId);
            return ValidatePaymentResponse.builder()
                    .paymentConfirmed(false)
                    .message("Chưa phát hiện giao dịch thanh toán. Vui lòng thử lại sau.")
                    .build();
        }

        // 8. Tìm thấy transaction - Validate và update
        Transaction transaction = transactionOpt.get();
        
        log.info("[validatePayment] Found transaction {} for order {}", transaction.getId(), orderId);

        // Update order status
        order.setPaymentStatus("paid");
        order.setTransactionId(transaction.getId());  // FK to transactions table
        order.setTransferContent(expectedTransferContent);  // QMORD format for reference
        orderRepository.save(order);

        // Update transaction verified status
        transaction.setVerified(true);
        transactionRepository.save(transaction);

        // INCREMENT VOUCHER USAGE (nếu có)
        if (order.getVoucherId() != null) {
            log.info("[validatePayment] Incrementing voucher usage for voucherId={}, userId={}, orderId={}", 
                    order.getVoucherId(), userId, orderId);
            
            // Increment voucher usage counter
            voucherService.incrementVoucherUsage(order.getVoucherId());
            
            // Record voucher usage history
            voucherService.recordVoucherUsage(order.getVoucherId(), userId, orderId);
        }

        log.info("[validatePayment] Payment validated successfully for order {}", orderId);

        return ValidatePaymentResponse.builder()
                .paymentConfirmed(true)
                .transactionId(transaction.getId())
                .transactionAmount(transaction.getAmount())
                .transactionTime(transaction.getTransactionDate())
                .transferContent(expectedTransferContent)
                .message("Thanh toán đã được xác nhận thành công")
                .build();
    }

    /**
     * Update order status (Admin/Manager) - Updated with 3 status axes
     */
    public void updateOrderStatus(Long orderId, UpdateOrderStatusRequest request) {
        log.info("[updateOrderStatus] Updating order {} with statuses: payment={}, fulfillment={}, order={}", 
                orderId, request.getPaymentStatus(), request.getFulfillmentStatus(), request.getOrderStatus());

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        
        // Update each status axis if provided
        if (request.getPaymentStatus() != null) {
            order.setPaymentStatus(request.getPaymentStatus());
        }
        if (request.getFulfillmentStatus() != null) {
            order.setFulfillmentStatus(request.getFulfillmentStatus());
        }
        if (request.getOrderStatus() != null) {
            order.setOrderStatus(request.getOrderStatus());
        }

        // Note: Voucher usage is recorded immediately during checkout
        // No need to track payment status changes - voucher is counted as used once order is created

        orderRepository.save(order);
        log.info("[updateOrderStatus] Order {} updated successfully", orderId);
    }

    /**
     * Reorder - Add order items to cart
     */
    public ReorderResponse reorder(UUID userId, Long orderId) {
        log.info("[reorder] User {} reordering from order {}", userId, orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Check permission
        if (!order.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.ORDER_ACCESS_DENIED);
        }

        // Get order items
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);

        int addedCount = 0;
        List<String> unavailable = new ArrayList<>();

        // Add to cart
        for (OrderItem item : items) {
            Product product = productRepository.findById(item.getProductId()).orElse(null);

            if (product != null && product.getStockQuantity() > 0) {
                // Create cart item (simplified - should use CartService)
                addedCount++;
            } else {
                if (product != null) {
                    unavailable.add(product.getName());
                }
            }
        }

        return ReorderResponse.builder()
                .cartItemsAdded(addedCount)
                .unavailableProducts(unavailable)
                .build();
    }

    // Helper methods

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());

        List<OrderItemResponse> itemResponses = items.stream()
                .map(item -> {
                    Product product = productRepository.findById(item.getProductId()).orElseThrow();
                    return OrderItemResponse.builder()
                            .productId(item.getProductId())
                            .productName(product.getName())
                            .categoryId(item.getCategoryId())
                            .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .lineTotal(item.getLineTotal())
                            .thumbnail(product.getImageUrl())
                            .build();
                })
                .collect(Collectors.toList());

        OrderResponse response = orderMapper.toOrderResponse(order);
        response.setItemCount(items.size());
        response.setItems(itemResponses);
        
        return response;
    }

    private OrderDetailResponse mapToOrderDetailResponse(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());

        List<OrderItemResponse> itemResponses = items.stream()
                .map(item -> {
                    Product product = productRepository.findById(item.getProductId()).orElseThrow();
                    return OrderItemResponse.builder()
                            .productId(item.getProductId())
                            .productName(product.getName())
                            .categoryId(item.getCategoryId())
                            .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .lineTotal(item.getLineTotal())
                            .thumbnail(product.getImageUrl())
                            .build();
                })
                .collect(Collectors.toList());

        // Map basic order info using mapper
        OrderDetailResponse response = orderMapper.toOrderDetailResponse(order);

        // Voucher info
        if (order.getVoucherId() != null) {
            Voucher voucher = voucherRepository.findById(order.getVoucherId()).orElse(null);
            if (voucher != null) {
                OrderDetailResponse.VoucherInfo voucherInfo = OrderDetailResponse.VoucherInfo.builder()
                        .code(voucher.getCode())
                        .discountType(voucher.getDiscountType())
                        .discountAmount(voucher.getDiscountAmount())
                        .build();
                response.setVoucher(voucherInfo);
            }
        }

        // Receiver info
        OrderDetailResponse.ReceiverInfo receiverInfo = OrderDetailResponse.ReceiverInfo.builder()
                .name(order.getReceiverName())
                .phone(order.getReceiverPhone())
                .address(order.getReceiverAddress())
                .build();
        response.setReceiver(receiverInfo);

        // Set items
        response.setItems(itemResponses);

        return response;
    }
}
