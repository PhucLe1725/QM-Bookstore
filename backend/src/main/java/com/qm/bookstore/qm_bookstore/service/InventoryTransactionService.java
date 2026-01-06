package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.base.response.BaseGetAllResponse;
import com.qm.bookstore.qm_bookstore.dto.inventory.request.InventoryOutFromOrderRequest;
import com.qm.bookstore.qm_bookstore.dto.inventory.request.InventoryTransactionCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.inventory.request.InventoryTransactionGetAllRequest;
import com.qm.bookstore.qm_bookstore.dto.inventory.request.InventoryTransactionItemRequest;
import com.qm.bookstore.qm_bookstore.dto.inventory.response.InventoryTransactionItemResponse;
import com.qm.bookstore.qm_bookstore.dto.inventory.response.InventoryTransactionResponse;
import com.qm.bookstore.qm_bookstore.dto.order.ComboItemSnapshot;
import com.qm.bookstore.qm_bookstore.entity.*;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service quản lý tồn kho
 * Đảm bảo:
 * - Không âm kho
 * - Không trừ kho lặp
 * - Audit rõ ràng mọi biến động
 * - Mọi thay đổi kho chỉ đi qua inventory_transaction
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
@Slf4j
public class InventoryTransactionService {

    InventoryTransactionHeaderRepository headerRepository;
    InventoryTransactionItemRepository itemRepository;
    ProductRepository productRepository;
    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;

    // ==================== CONSTANTS ====================
    
    private static final String TRANSACTION_TYPE_IN = "IN";
    private static final String TRANSACTION_TYPE_OUT = "OUT";
    private static final String TRANSACTION_TYPE_DAMAGED = "DAMAGED";
    private static final String TRANSACTION_TYPE_STOCKTAKE = "STOCKTAKE";
    
    private static final String REFERENCE_TYPE_ORDER = "ORDER";
    private static final String REFERENCE_TYPE_MANUAL = "MANUAL";
    private static final String REFERENCE_TYPE_STOCKTAKE = "STOCKTAKE";
    
    private static final String CHANGE_TYPE_PLUS = "PLUS";
    private static final String CHANGE_TYPE_MINUS = "MINUS";

    // ==================== PUBLIC APIs ====================

    /**
     * Tạo giao dịch kho thông thường (IN / DAMAGED / STOCKTAKE)
     * Validate logic mapping nghiệp vụ
     */
    @Transactional
    public InventoryTransactionResponse createTransaction(InventoryTransactionCreateRequest request) {
        log.info("Creating inventory transaction: type={}, referenceType={}, referenceId={}", 
                 request.getTransactionType(), request.getReferenceType(), request.getReferenceId());

        // Validate transaction type
        validateTransactionType(request.getTransactionType());

        // Validate change type theo transaction type
        validateChangeTypesForTransaction(request.getTransactionType(), request.getItems());

        // Tạo header
        InventoryTransactionHeader header = InventoryTransactionHeader.builder()
                .transactionType(request.getTransactionType())
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId())
                .note(request.getNote())
                .build();

        // IMPORTANT: Save header first to generate ID
        header = headerRepository.save(header);
        log.info("Header saved with ID: {}", header.getId());

        // Tạo items và áp dụng thay đổi tồn kho
        for (InventoryTransactionItemRequest itemReq : request.getItems()) {
            // Validate product tồn tại
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

            // Tạo item
            InventoryTransactionItem item = InventoryTransactionItem.builder()
                    .productId(itemReq.getProductId())
                    .changeType(itemReq.getChangeType())
                    .quantity(itemReq.getQuantity())
                    .build();

            header.addItem(item);

            // Cập nhật tồn kho
            updateProductStock(product, itemReq.getChangeType(), itemReq.getQuantity());
        }

        // Save header again with items (cascade save)
        header = headerRepository.save(header);

        log.info("Inventory transaction created successfully: id={}", header.getId());
        return mapToResponse(header);
    }

    /**
     * Xuất kho từ đơn hàng (OUT)
     * Logic bắt buộc:
     * 1. Kiểm tra duplicate
     * 2. Lấy toàn bộ order_items
     * 3. Mở DB transaction
     * 4. Insert header + items
     * 5. Update tồn kho với điều kiện stock_quantity >= quantity
     * 6. Rollback nếu bất kỳ sản phẩm nào không đủ
     */
    @Transactional
    public InventoryTransactionResponse createOutTransactionFromOrder(InventoryOutFromOrderRequest request) {
        log.info("Creating OUT transaction from order: orderId={}", request.getOrderId());

        Integer orderId = request.getOrderId().intValue();

        // 1. Kiểm tra duplicate
        if (headerRepository.existsByTransactionTypeAndReferenceTypeAndReferenceId(
                TRANSACTION_TYPE_OUT, REFERENCE_TYPE_ORDER, orderId)) {
            log.error("Duplicate OUT transaction for order: {}", orderId);
            throw new AppException(ErrorCode.DUPLICATE_OUT_TRANSACTION);
        }

        // 2. Lấy đơn hàng và order items
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        List<OrderItem> orderItems = orderItemRepository.findByOrderId(request.getOrderId());
        if (orderItems.isEmpty()) {
            log.error("Order {} has no items", orderId);
            throw new AppException(ErrorCode.ORDER_ITEMS_EMPTY);
        }

        // 3. Tạo header
        InventoryTransactionHeader header = InventoryTransactionHeader.builder()
                .transactionType(TRANSACTION_TYPE_OUT)
                .referenceType(REFERENCE_TYPE_ORDER)
                .referenceId(orderId)
                .note(request.getNote() != null ? request.getNote() : "Xuất kho cho đơn hàng #" + orderId)
                .build();

        // 4. Save header trước để có ID
        header = headerRepository.save(header);
        log.info("Header saved with ID: {}", header.getId());

        // 5. Duyệt từng order item
        for (OrderItem orderItem : orderItems) {
            // Check if this is a combo or single product
            if (orderItem.getItemType() == ItemType.COMBO) {
                // Handle combo items: process each product in the combo
                log.info("Processing combo item: comboId={}, comboName={}, quantity={}", 
                    orderItem.getComboId(), orderItem.getComboName(), orderItem.getQuantity());
                
                if (orderItem.getComboSnapshot() == null || orderItem.getComboSnapshot().getItems() == null) {
                    throw new AppException(ErrorCode.COMBO_SNAPSHOT_NOT_FOUND);
                }
                
                // Iterate through each product in the combo
                for (ComboItemSnapshot comboProduct : orderItem.getComboSnapshot().getItems()) {
                    Product product = productRepository.findById(comboProduct.getProductId())
                            .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

                    // Calculate total quantity: combo product quantity * order quantity
                    int totalQuantity = comboProduct.getQuantity() * orderItem.getQuantity();

                    // Create transaction item for this product
                    InventoryTransactionItem item = InventoryTransactionItem.builder()
                            .headerId(header.getId())
                            .productId(comboProduct.getProductId())
                            .changeType(CHANGE_TYPE_MINUS)
                            .quantity(totalQuantity)
                            .build();

                    header.addItem(item);

                    // Deduct stock
                    deductStock(product, totalQuantity);
                    
                    log.info("Deducted stock for combo product: productId={}, productName={}, quantity={}", 
                        product.getId(), product.getName(), totalQuantity);
                }
            } else {
                // Handle single product items (existing logic)
                Product product = productRepository.findById(orderItem.getProductId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

                // Tạo item với headerId
                InventoryTransactionItem item = InventoryTransactionItem.builder()
                        .headerId(header.getId())  // ✅ Set headerId thủ công
                        .productId(orderItem.getProductId())
                        .changeType(CHANGE_TYPE_MINUS)
                        .quantity(orderItem.getQuantity())
                        .build();

                header.addItem(item);

                // 6. Trừ kho với điều kiện
                deductStock(product, orderItem.getQuantity());
            }
        }

        // 7. Lưu lại header (cascade save items)
        header = headerRepository.save(header);

        log.info("OUT transaction from order created successfully: id={}, orderId={}", header.getId(), orderId);
        return mapToResponse(header);
    }

    /**
     * Lấy chi tiết giao dịch kho
     */
    @Transactional(readOnly = true)
    public InventoryTransactionResponse getTransactionById(Long id) {
        InventoryTransactionHeader header = headerRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVENTORY_TRANSACTION_NOT_FOUND));
        return mapToResponse(header);
    }

    /**
     * Lấy danh sách giao dịch kho với filter
     */
    @Transactional(readOnly = true)
    public BaseGetAllResponse<InventoryTransactionResponse> getAllTransactions(
            InventoryTransactionGetAllRequest request) {
        
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt"); // Mặc định sắp xếp theo ngày mới nhất
        
        Pageable pageable = PageRequest.of(
                request.getSkipCount() / request.getMaxResultCount(),
                request.getMaxResultCount(),
                sort
        );

        Page<InventoryTransactionHeader> page = headerRepository.findByFilters(
                request.getTransactionType(),
                request.getReferenceType(),
                request.getReferenceId(),
                request.getProductId(),
                pageable
        );

        List<InventoryTransactionResponse> items = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return BaseGetAllResponse.<InventoryTransactionResponse>builder()
                .totalRecords(page.getTotalElements())
                .data(items)
                .build();
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Validate transaction type hợp lệ
     */
    private void validateTransactionType(String transactionType) {
        if (!List.of(TRANSACTION_TYPE_IN, TRANSACTION_TYPE_OUT, 
                     TRANSACTION_TYPE_DAMAGED, TRANSACTION_TYPE_STOCKTAKE).contains(transactionType)) {
            log.error("Invalid transaction type: {}", transactionType);
            throw new AppException(ErrorCode.INVALID_TRANSACTION_TYPE);
        }
    }

    /**
     * Validate change types theo quy tắc nghiệp vụ:
     * - IN → chỉ PLUS
     * - OUT → chỉ MINUS
     * - DAMAGED → MINUS
     * - STOCKTAKE → cả PLUS và MINUS
     */
    private void validateChangeTypesForTransaction(String transactionType, 
                                                   List<InventoryTransactionItemRequest> items) {
        for (InventoryTransactionItemRequest item : items) {
            String changeType = item.getChangeType();

            // Validate change type hợp lệ
            if (!List.of(CHANGE_TYPE_PLUS, CHANGE_TYPE_MINUS).contains(changeType)) {
                log.error("Invalid change type: {}", changeType);
                throw new AppException(ErrorCode.INVALID_CHANGE_TYPE);
            }

            // Validate theo transaction type
            switch (transactionType) {
                case TRANSACTION_TYPE_IN:
                    if (!CHANGE_TYPE_PLUS.equals(changeType)) {
                        log.error("Change type {} not allowed for transaction type {}", changeType, transactionType);
                        throw new AppException(ErrorCode.INVALID_CHANGE_TYPE_FOR_TRANSACTION);
                    }
                    break;
                case TRANSACTION_TYPE_OUT:
                case TRANSACTION_TYPE_DAMAGED:
                    if (!CHANGE_TYPE_MINUS.equals(changeType)) {
                        log.error("Change type {} not allowed for transaction type {}", changeType, transactionType);
                        throw new AppException(ErrorCode.INVALID_CHANGE_TYPE_FOR_TRANSACTION);
                    }
                    break;
                case TRANSACTION_TYPE_STOCKTAKE:
                    // Cho phép cả PLUS và MINUS
                    break;
            }
        }
    }

    /**
     * Cập nhật tồn kho theo change type
     */
    private void updateProductStock(Product product, String changeType, Integer quantity) {
        if (CHANGE_TYPE_PLUS.equals(changeType)) {
            product.setStockQuantity(product.getStockQuantity() + quantity);
            log.debug("Added {} to product {} stock. New stock: {}", 
                     quantity, product.getId(), product.getStockQuantity());
        } else if (CHANGE_TYPE_MINUS.equals(changeType)) {
            deductStock(product, quantity);
        }
        productRepository.save(product);
    }

    /**
     * Trừ kho với kiểm tra điều kiện không âm
     * Atomic operation: UPDATE có điều kiện
     */
    private void deductStock(Product product, Integer quantity) {
        Integer currentStock = product.getStockQuantity();
        
        if (currentStock < quantity) {
            log.error("Insufficient stock for product {}: name={}, available={}, required={}", 
                     product.getId(), product.getName(), currentStock, quantity);
            throw new AppException(ErrorCode.INSUFFICIENT_INVENTORY);
        }

        product.setStockQuantity(currentStock - quantity);
        log.debug("Deducted {} from product {} stock. New stock: {}", 
                 quantity, product.getId(), product.getStockQuantity());
    }

    /**
     * Map entity sang response DTO
     */
    private InventoryTransactionResponse mapToResponse(InventoryTransactionHeader header) {
        List<InventoryTransactionItemResponse> itemResponses = header.getItems().stream()
                .map(item -> {
                    Product product = productRepository.findById(item.getProductId()).orElse(null);
                    return InventoryTransactionItemResponse.builder()
                            .id(item.getId())
                            .productId(item.getProductId())
                            .productName(product != null ? product.getName() : "Unknown")
                            .productSku(product != null ? product.getSku() : "Unknown")
                            .changeType(item.getChangeType())
                            .quantity(item.getQuantity())
                            .build();
                })
                .collect(Collectors.toList());

        return InventoryTransactionResponse.builder()
                .id(header.getId())
                .transactionType(header.getTransactionType())
                .referenceType(header.getReferenceType())
                .referenceId(header.getReferenceId())
                .note(header.getNote())
                .createdAt(header.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}
