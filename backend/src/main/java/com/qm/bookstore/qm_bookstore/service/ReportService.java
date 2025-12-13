package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.report.*;
import com.qm.bookstore.qm_bookstore.entity.Order;
import com.qm.bookstore.qm_bookstore.entity.OrderItem;
import com.qm.bookstore.qm_bookstore.entity.Product;
import com.qm.bookstore.qm_bookstore.entity.User;
import com.qm.bookstore.qm_bookstore.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Transactional(readOnly = true)
public class ReportService {

    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;
    UserRepository userRepository;
    VoucherRepository voucherRepository;
    ProductRepository productRepository;
    CategoryRepository categoryRepository;

    /**
     * Generate revenue report
     */
    public RevenueReportResponse getRevenueReport(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("[getRevenueReport] Generating report from {} to {}", startDate, endDate);

        // Get all paid orders in period
        List<Order> orders = orderRepository.findByCreatedAtBetween(startDate, endDate);
        List<Order> paidOrders = orders.stream()
                .filter(o -> "paid".equals(o.getPaymentStatus()))
                .collect(Collectors.toList());

        // Calculate totals
        BigDecimal totalRevenue = paidOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDiscount = paidOrders.stream()
                .map(Order::getDiscountAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalShippingFee = paidOrders.stream()
                .map(Order::getShippingFee)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalOrders = orders.size();
        int paidOrdersCount = paidOrders.size();
        int cancelledOrders = (int) orders.stream()
                .filter(o -> "cancelled".equals(o.getOrderStatus()))
                .count();

        // Revenue by date
        Map<LocalDate, List<Order>> ordersByDate = paidOrders.stream()
                .collect(Collectors.groupingBy(o -> o.getCreatedAt().toLocalDate()));

        List<RevenueReportResponse.RevenueByDate> revenueByDate = ordersByDate.entrySet().stream()
                .map(entry -> {
                    BigDecimal dayRevenue = entry.getValue().stream()
                            .map(Order::getTotalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return RevenueReportResponse.RevenueByDate.builder()
                            .date(entry.getKey())
                            .revenue(dayRevenue)
                            .orderCount(entry.getValue().size())
                            .build();
                })
                .sorted(Comparator.comparing(RevenueReportResponse.RevenueByDate::getDate))
                .collect(Collectors.toList());

        // Revenue by payment method
        Map<String, List<Order>> ordersByPaymentMethod = paidOrders.stream()
                .collect(Collectors.groupingBy(Order::getPaymentMethod));

        List<RevenueReportResponse.RevenueByPaymentMethod> revenueByPaymentMethod = 
                ordersByPaymentMethod.entrySet().stream()
                .map(entry -> {
                    BigDecimal methodRevenue = entry.getValue().stream()
                            .map(Order::getTotalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return RevenueReportResponse.RevenueByPaymentMethod.builder()
                            .paymentMethod(entry.getKey())
                            .revenue(methodRevenue)
                            .orderCount(entry.getValue().size())
                            .build();
                })
                .collect(Collectors.toList());

        // Revenue by category (from OrderItems snapshot)
        List<Long> orderIds = paidOrders.stream().map(Order::getId).collect(Collectors.toList());
        List<OrderItem> orderItems = orderItemRepository.findByOrderIdIn(orderIds);

        Map<Long, List<OrderItem>> itemsByCategory = orderItems.stream()
                .filter(item -> item.getCategoryId() != null)
                .collect(Collectors.groupingBy(OrderItem::getCategoryId));

        List<RevenueReportResponse.RevenueByCategory> revenueByCategory = 
                itemsByCategory.entrySet().stream()
                .map(entry -> {
                    BigDecimal categoryRevenue = entry.getValue().stream()
                            .map(OrderItem::getLineTotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    Integer quantity = entry.getValue().stream()
                            .mapToInt(OrderItem::getQuantity)
                            .sum();
                    
                    String categoryName = categoryRepository.findById(entry.getKey())
                            .map(c -> c.getName())
                            .orElse("Unknown");

                    return RevenueReportResponse.RevenueByCategory.builder()
                            .categoryId(entry.getKey())
                            .categoryName(categoryName)
                            .revenue(categoryRevenue)
                            .quantity(quantity)
                            .build();
                })
                .sorted(Comparator.comparing(RevenueReportResponse.RevenueByCategory::getRevenue).reversed())
                .collect(Collectors.toList());

        return RevenueReportResponse.builder()
                .totalRevenue(totalRevenue)
                .totalDiscount(totalDiscount)
                .totalShippingFee(totalShippingFee)
                .totalOrders(totalOrders)
                .paidOrders(paidOrdersCount)
                .cancelledOrders(cancelledOrders)
                .revenueByDate(revenueByDate)
                .revenueByPaymentMethod(revenueByPaymentMethod)
                .revenueByCategory(revenueByCategory)
                .build();
    }

    /**
     * Get order statistics
     */
    public OrderStatisticsResponse getOrderStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("[getOrderStatistics] Generating statistics from {} to {}", startDate, endDate);

        List<Order> orders = orderRepository.findByCreatedAtBetween(startDate, endDate);

        // Count by order status
        int totalOrders = orders.size();
        int confirmedOrders = (int) orders.stream().filter(o -> "confirmed".equals(o.getOrderStatus())).count();
        int cancelledOrders = (int) orders.stream().filter(o -> "cancelled".equals(o.getOrderStatus())).count();
        int closedOrders = (int) orders.stream().filter(o -> "closed".equals(o.getOrderStatus())).count();

        // Count by payment status
        int pendingPayment = (int) orders.stream().filter(o -> "pending".equals(o.getPaymentStatus())).count();
        int paid = (int) orders.stream().filter(o -> "paid".equals(o.getPaymentStatus())).count();
        int failed = (int) orders.stream().filter(o -> "failed".equals(o.getPaymentStatus())).count();
        int refunded = (int) orders.stream().filter(o -> "refunded".equals(o.getPaymentStatus())).count();

        // Count by fulfillment status
        int shipping = (int) orders.stream().filter(o -> "shipping".equals(o.getFulfillmentStatus())).count();
        int delivered = (int) orders.stream().filter(o -> "delivered".equals(o.getFulfillmentStatus())).count();
        int pickup = (int) orders.stream().filter(o -> "pickup".equals(o.getFulfillmentStatus())).count();
        int returned = (int) orders.stream().filter(o -> "returned".equals(o.getFulfillmentStatus())).count();

        // Orders by date
        Map<LocalDate, Long> orderCountByDate = orders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().toLocalDate(),
                        Collectors.counting()
                ));

        List<OrderStatisticsResponse.OrdersByDate> ordersByDate = orderCountByDate.entrySet().stream()
                .map(entry -> OrderStatisticsResponse.OrdersByDate.builder()
                        .date(entry.getKey())
                        .orderCount(entry.getValue().intValue())
                        .build())
                .sorted(Comparator.comparing(OrderStatisticsResponse.OrdersByDate::getDate))
                .collect(Collectors.toList());

        // Orders by status with percentage
        List<OrderStatisticsResponse.OrdersByStatus> ordersByStatus = Arrays.asList(
                createStatusCount("confirmed", confirmedOrders, totalOrders),
                createStatusCount("cancelled", cancelledOrders, totalOrders),
                createStatusCount("closed", closedOrders, totalOrders)
        );

        return OrderStatisticsResponse.builder()
                .totalOrders(totalOrders)
                .confirmedOrders(confirmedOrders)
                .cancelledOrders(cancelledOrders)
                .closedOrders(closedOrders)
                .pendingPaymentOrders(pendingPayment)
                .paidOrders(paid)
                .failedPaymentOrders(failed)
                .refundedOrders(refunded)
                .shippingOrders(shipping)
                .deliveredOrders(delivered)
                .pickupOrders(pickup)
                .returnedOrders(returned)
                .ordersByDate(ordersByDate)
                .ordersByStatus(ordersByStatus)
                .build();
    }

    /**
     * Get top selling products
     */
    public List<ProductReportResponse> getTopSellingProducts(LocalDateTime startDate, LocalDateTime endDate, int limit) {
        log.info("[getTopSellingProducts] Getting top {} products from {} to {}", limit, startDate, endDate);

        List<Order> paidOrders = orderRepository.findByCreatedAtBetween(startDate, endDate).stream()
                .filter(o -> "paid".equals(o.getPaymentStatus()))
                .collect(Collectors.toList());

        List<Long> orderIds = paidOrders.stream().map(Order::getId).collect(Collectors.toList());
        List<OrderItem> orderItems = orderItemRepository.findByOrderIdIn(orderIds);

        Map<Long, List<OrderItem>> itemsByProduct = orderItems.stream()
                .collect(Collectors.groupingBy(OrderItem::getProductId));

        return itemsByProduct.entrySet().stream()
                .map(entry -> {
                    Long productId = entry.getKey();
                    List<OrderItem> items = entry.getValue();

                    int totalQuantity = items.stream().mapToInt(OrderItem::getQuantity).sum();
                    BigDecimal totalRevenue = items.stream()
                            .map(OrderItem::getLineTotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    int orderCount = items.size();
                    BigDecimal avgPrice = totalRevenue.divide(
                            new BigDecimal(totalQuantity), 2, RoundingMode.HALF_UP);

                    Product product = productRepository.findById(productId).orElse(null);
                    String productName = product != null ? product.getName() : "Unknown";
                    String categoryName = product != null && product.getCategory() != null 
                            ? product.getCategory().getName() : "Unknown";

                    return ProductReportResponse.builder()
                            .productId(productId)
                            .productName(productName)
                            .categoryName(categoryName)
                            .totalQuantitySold(totalQuantity)
                            .totalRevenue(totalRevenue)
                            .orderCount(orderCount)
                            .averagePrice(avgPrice)
                            .build();
                })
                .sorted(Comparator.comparing(ProductReportResponse::getTotalQuantitySold).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Get user statistics
     */
    public UserStatisticsResponse getUserStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("[getUserStatistics] Generating user statistics from {} to {}", startDate, endDate);

        List<User> allUsers = userRepository.findAll();
        int totalUsers = allUsers.size();

        // Users created in period
        List<User> newUsers = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null 
                        && u.getCreatedAt().isAfter(startDate) 
                        && u.getCreatedAt().isBefore(endDate))
                .collect(Collectors.toList());

        // Users with at least one order (active users)
        List<Order> orders = orderRepository.findByCreatedAtBetween(startDate, endDate);
        Set<UUID> activeUserIds = orders.stream()
                .map(Order::getUserId)
                .collect(Collectors.toSet());

        // Users by date
        Map<LocalDate, Long> usersByDate = newUsers.stream()
                .collect(Collectors.groupingBy(
                        u -> u.getCreatedAt().toLocalDate(),
                        Collectors.counting()
                ));

        List<UserStatisticsResponse.UsersByDate> usersByDateList = usersByDate.entrySet().stream()
                .map(entry -> UserStatisticsResponse.UsersByDate.builder()
                        .date(entry.getKey())
                        .newUsers(entry.getValue().intValue())
                        .build())
                .sorted(Comparator.comparing(UserStatisticsResponse.UsersByDate::getDate))
                .collect(Collectors.toList());

        // Calculate cumulative users
        int cumulative = totalUsers - newUsers.size();
        for (UserStatisticsResponse.UsersByDate item : usersByDateList) {
            cumulative += item.getNewUsers();
            item.setCumulativeUsers(cumulative);
        }

        // Users by role
        Map<String, Long> usersByRole = allUsers.stream()
                .filter(u -> u.getRole() != null)
                .collect(Collectors.groupingBy(
                        u -> u.getRole().getName(),
                        Collectors.counting()
                ));

        List<UserStatisticsResponse.UsersByRole> usersByRoleList = usersByRole.entrySet().stream()
                .map(entry -> {
                    double percentage = (entry.getValue() * 100.0) / totalUsers;
                    return UserStatisticsResponse.UsersByRole.builder()
                            .roleName(entry.getKey())
                            .userCount(entry.getValue().intValue())
                            .percentage(Math.round(percentage * 100.0) / 100.0)
                            .build();
                })
                .collect(Collectors.toList());

        return UserStatisticsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUserIds.size())
                .newUsersInPeriod(newUsers.size())
                .usersByDate(usersByDateList)
                .usersByRole(usersByRoleList)
                .build();
    }

    /**
     * Get voucher usage report
     */
    public List<VoucherReportResponse> getVoucherReport(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("[getVoucherReport] Generating voucher report from {} to {}", startDate, endDate);

        List<Order> paidOrders = orderRepository.findByCreatedAtBetween(startDate, endDate).stream()
                .filter(o -> "paid".equals(o.getPaymentStatus()))
                .filter(o -> o.getVoucherId() != null)
                .collect(Collectors.toList());

        Map<Long, List<Order>> ordersByVoucher = paidOrders.stream()
                .collect(Collectors.groupingBy(Order::getVoucherId));

        return ordersByVoucher.entrySet().stream()
                .map(entry -> {
                    Long voucherId = entry.getKey();
                    List<Order> orders = entry.getValue();

                    int usageCount = orders.size();
                    BigDecimal totalDiscount = orders.stream()
                            .map(Order::getDiscountAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    int uniqueUsers = (int) orders.stream()
                            .map(Order::getUserId)
                            .distinct()
                            .count();

                    return voucherRepository.findById(voucherId)
                            .map(voucher -> VoucherReportResponse.builder()
                                    .voucherId(voucherId)
                                    .voucherCode(voucher.getCode())
                                    .discountType(voucher.getDiscountType())
                                    .discountAmount(voucher.getDiscountAmount())
                                    .totalUsageCount(usageCount)
                                    .totalDiscountGiven(totalDiscount)
                                    .uniqueUsers(uniqueUsers)
                                    .isActive(voucher.getStatus())
                                    .build())
                            .orElse(null);
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(VoucherReportResponse::getTotalUsageCount).reversed())
                .collect(Collectors.toList());
    }

    // Helper methods

    private OrderStatisticsResponse.OrdersByStatus createStatusCount(String status, int count, int total) {
        double percentage = total > 0 ? (count * 100.0) / total : 0.0;
        return OrderStatisticsResponse.OrdersByStatus.builder()
                .status(status)
                .count(count)
                .percentage(Math.round(percentage * 100.0) / 100.0)
                .build();
    }
}
