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
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

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
        // totalRevenue uses getTotalAmount() = revenue WITHOUT VAT (correct for revenue statistics)
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

        // Filter only customers (role = "customer")
        List<User> allCustomers = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "customer".equalsIgnoreCase(u.getRole().getName()))
                .collect(Collectors.toList());
        
        int totalUsers = allCustomers.size();

        // Customers created in period
        List<User> newUsers = allCustomers.stream()
                .filter(u -> u.getCreatedAt() != null 
                        && u.getCreatedAt().isAfter(startDate) 
                        && u.getCreatedAt().isBefore(endDate))
                .collect(Collectors.toList());

        // Customers with at least one order (active users)
        List<Order> orders = orderRepository.findByCreatedAtBetween(startDate, endDate);
        Set<UUID> activeUserIds = orders.stream()
                .map(Order::getUserId)
                .collect(Collectors.toSet());

        // Customers by date
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

        // Users by role (keep original logic for role breakdown)
        List<User> allUsers = userRepository.findAll();
        Map<String, Long> usersByRole = allUsers.stream()
                .filter(u -> u.getRole() != null)
                .collect(Collectors.groupingBy(
                        u -> u.getRole().getName(),
                        Collectors.counting()
                ));

        List<UserStatisticsResponse.UsersByRole> usersByRoleList = usersByRole.entrySet().stream()
                .map(entry -> {
                    double percentage = (entry.getValue() * 100.0) / allUsers.size();
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

    /**
     * Lấy dữ liệu biểu đồ cột doanh thu theo tuần/tháng/năm
     * @param period "week" | "month" | "year"
     * @param year Năm cụ thể (null = năm hiện tại)
     * @param month Tháng cụ thể 1-12 (null = tháng hiện tại, chỉ dùng khi period=month)
     * @return Dữ liệu chart đã được format sẵn cho frontend
     */
    public RevenueChartResponse getRevenueChart(String period, Integer year, Integer month) {
        log.info("[getRevenueChart] Generating revenue chart for period: {}, year: {}, month: {}", period, year, month);
        
        LocalDateTime now = LocalDateTime.now();
        
        // Xác định năm: dùng parameter hoặc năm hiện tại
        int targetYear = (year != null) ? year : now.getYear();
        
        // Xác định tháng: dùng parameter hoặc tháng hiện tại
        int targetMonth = (month != null) ? month : now.getMonthValue();
        
        LocalDateTime startDate;
        LocalDateTime endDate;
        String periodLabel;
        List<RevenueChartResponse.ChartDataPoint> chartData;
        
        switch (period.toLowerCase()) {
            case "week":
                // 7 ngày gần nhất (bỏ qua year/month parameters)
                startDate = now.minusDays(6).toLocalDate().atStartOfDay();
                endDate = now;
                periodLabel = "7 ngày gần nhất";
                chartData = getWeeklyRevenueData(startDate, endDate);
                break;
                
            case "month":
                // Tháng được chọn
                YearMonth selectedMonth = YearMonth.of(targetYear, targetMonth);
                startDate = selectedMonth.atDay(1).atStartOfDay();
                endDate = selectedMonth.atEndOfMonth().atTime(23, 59, 59);
                periodLabel = "Tháng " + targetMonth + "/" + targetYear;
                chartData = getMonthlyRevenueData(startDate, endDate, selectedMonth);
                break;
                
            case "year":
                // Năm được chọn
                startDate = LocalDate.of(targetYear, 1, 1).atStartOfDay();
                endDate = LocalDate.of(targetYear, 12, 31).atTime(23, 59, 59);
                periodLabel = "Năm " + targetYear;
                chartData = getYearlyRevenueData(startDate, endDate);
                break;
                
            default:
                throw new IllegalArgumentException("Invalid period: " + period + ". Valid values: week, month, year");
        }
        
        return RevenueChartResponse.builder()
                .periodType(period.toLowerCase())
                .periodLabel(periodLabel)
                .data(chartData)
                .build();
    }
    
    /**
     * Dữ liệu doanh thu theo tuần (7 ngày gần nhất)
     */
    private List<RevenueChartResponse.ChartDataPoint> getWeeklyRevenueData(LocalDateTime startDate, LocalDateTime endDate) {
        // Lấy đơn hàng đã thanh toán trong khoảng thời gian
        List<Order> paidOrders = orderRepository.findByCreatedAtBetween(startDate, endDate).stream()
                .filter(o -> "paid".equals(o.getPaymentStatus()))
                .collect(Collectors.toList());
        
        // Group by ngày
        Map<LocalDate, BigDecimal> revenueByDate = paidOrders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().toLocalDate(),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));
        
        // Tạo danh sách 7 ngày với revenue = 0 nếu không có đơn
        List<RevenueChartResponse.ChartDataPoint> result = new ArrayList<>();
        LocalDate currentDate = startDate.toLocalDate();
        
        for (int i = 0; i < 7; i++) {
            BigDecimal revenue = revenueByDate.getOrDefault(currentDate, BigDecimal.ZERO);
            result.add(RevenueChartResponse.ChartDataPoint.builder()
                    .period(currentDate.getDayOfMonth())
                    .label(String.format("%02d", currentDate.getDayOfMonth()))
                    .revenue(revenue)
                    .build());
            currentDate = currentDate.plusDays(1);
        }
        
        return result;
    }
    
    /**
     * Dữ liệu doanh thu theo tháng (nhóm theo ngày)
     */
    private List<RevenueChartResponse.ChartDataPoint> getMonthlyRevenueData(LocalDateTime startDate, LocalDateTime endDate, YearMonth yearMonth) {
        List<Order> paidOrders = orderRepository.findByCreatedAtBetween(startDate, endDate).stream()
                .filter(o -> "paid".equals(o.getPaymentStatus()))
                .collect(Collectors.toList());
        
        Map<Integer, BigDecimal> revenueByDay = paidOrders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().getDayOfMonth(),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));
        
        // Tạo danh sách tất cả các ngày trong tháng được chọn
        int daysInMonth = yearMonth.lengthOfMonth();
        return IntStream.rangeClosed(1, daysInMonth)
                .mapToObj(day -> {
                    BigDecimal revenue = revenueByDay.getOrDefault(day, BigDecimal.ZERO);
                    return RevenueChartResponse.ChartDataPoint.builder()
                            .period(day)
                            .label(String.format("%02d", day))
                            .revenue(revenue)
                            .build();
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Dữ liệu doanh thu theo năm (nhóm theo tháng)
     */
    private List<RevenueChartResponse.ChartDataPoint> getYearlyRevenueData(LocalDateTime startDate, LocalDateTime endDate) {
        List<Order> paidOrders = orderRepository.findByCreatedAtBetween(startDate, endDate).stream()
                .filter(o -> "paid".equals(o.getPaymentStatus()))
                .collect(Collectors.toList());
        
        Map<Integer, BigDecimal> revenueByMonth = paidOrders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().getMonthValue(),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));
        
        // Tạo danh sách 12 tháng
        return IntStream.rangeClosed(1, 12)
                .mapToObj(month -> {
                    BigDecimal revenue = revenueByMonth.getOrDefault(month, BigDecimal.ZERO);
                    return RevenueChartResponse.ChartDataPoint.builder()
                            .period(month)
                            .label("Th" + month)
                            .revenue(revenue)
                            .build();
                })
                .collect(Collectors.toList());
    }
}
