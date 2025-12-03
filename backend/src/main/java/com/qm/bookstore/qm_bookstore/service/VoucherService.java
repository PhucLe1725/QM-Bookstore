package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.voucher.request.ValidateVoucherRequest;
import com.qm.bookstore.qm_bookstore.dto.voucher.request.VoucherCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.voucher.request.VoucherUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.voucher.response.ValidateVoucherResponse;
import com.qm.bookstore.qm_bookstore.dto.voucher.response.VoucherResponse;
import com.qm.bookstore.qm_bookstore.entity.Voucher;
import com.qm.bookstore.qm_bookstore.entity.VoucherUsage;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.mapper.VoucherMapper;
import com.qm.bookstore.qm_bookstore.repository.VoucherRepository;
import com.qm.bookstore.qm_bookstore.repository.VoucherUsageRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class VoucherService {

    VoucherRepository voucherRepository;
    VoucherUsageRepository voucherUsageRepository;
    VoucherMapper voucherMapper;

    /**
     * Tạo voucher mới
     */
    @Transactional
    public VoucherResponse createVoucher(VoucherCreateRequest request) {
        log.info("[createVoucher] Creating voucher with code: {}", request.getCode());

        // Kiểm tra code đã tồn tại
        if (voucherRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.VOUCHER_CODE_EXISTED);
        }

        // Validate logic
        validateVoucherLogic(request);

        Voucher voucher = voucherMapper.toVoucher(request);
        voucher = voucherRepository.save(voucher);

        log.info("[createVoucher] Created voucher id={}", voucher.getId());
        return voucherMapper.toVoucherResponse(voucher);
    }

    /**
     * Cập nhật voucher
     */
    @Transactional
    public VoucherResponse updateVoucher(Long id, VoucherUpdateRequest request) {
        log.info("[updateVoucher] Updating voucher id={}", id);

        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        voucherMapper.updateVoucher(voucher, request);
        voucher = voucherRepository.save(voucher);

        return voucherMapper.toVoucherResponse(voucher);
    }

    /**
     * Xóa voucher
     */
    @Transactional
    public void deleteVoucher(Long id) {
        log.info("[deleteVoucher] Deleting voucher id={}", id);

        if (!voucherRepository.existsById(id)) {
            throw new AppException(ErrorCode.VOUCHER_NOT_FOUND);
        }

        voucherRepository.deleteById(id);
    }

    /**
     * Lấy voucher theo ID
     */
    public VoucherResponse getVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        return voucherMapper.toVoucherResponse(voucher);
    }

    /**
     * Lấy danh sách voucher với filter
     */
    public Page<VoucherResponse> getVouchers(Boolean status, String applyTo, Pageable pageable) {
        Page<Voucher> vouchers = voucherRepository.findByFilters(status, applyTo, pageable);
        return vouchers.map(voucherMapper::toVoucherResponse);
    }

    /**
     * Lấy danh sách voucher available (public)
     */
    public List<VoucherResponse> getAvailableVouchers() {
        LocalDateTime now = LocalDateTime.now();
        List<Voucher> vouchers = voucherRepository.findAvailableVouchers(now);
        return vouchers.stream()
                .map(voucherMapper::toVoucherResponse)
                .toList();
    }

    /**
     * CORE: Validate voucher theo logic nghiệp vụ (overload for convenience)
     */
    public ValidateVoucherResponse validateVoucher(String voucherCode, BigDecimal orderTotal, BigDecimal shippingFee) {
        ValidateVoucherRequest request = ValidateVoucherRequest.builder()
                .voucherCode(voucherCode)
                .orderTotal(orderTotal)
                .shippingFee(shippingFee)
                .build();
        return validateVoucher(request);
    }

    /**
     * CORE: Validate voucher với userId để check per-user limit
     */
    public ValidateVoucherResponse validateVoucher(String voucherCode, BigDecimal orderTotal, BigDecimal shippingFee, UUID userId) {
        ValidateVoucherRequest request = ValidateVoucherRequest.builder()
                .voucherCode(voucherCode)
                .orderTotal(orderTotal)
                .shippingFee(shippingFee)
                .userId(userId)
                .build();
        return validateVoucher(request);
    }

    /**
     * CORE: Validate voucher theo logic nghiệp vụ
     */
    public ValidateVoucherResponse validateVoucher(ValidateVoucherRequest request) {
        log.info("[validateVoucher] Validating voucher code: {}", request.getVoucherCode());

        // Step 1: Tìm voucher với status = TRUE
        Voucher voucher = voucherRepository.findActiveVoucherByCode(request.getVoucherCode())
                .orElse(null);

        if (voucher == null) {
            return createInvalidResponse("Voucher không tồn tại hoặc đã bị vô hiệu hóa");
        }

        // Step 2: Kiểm tra thời gian hiệu lực
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(voucher.getValidFrom())) {
            return createInvalidResponse("Voucher chưa đến thời gian sử dụng");
        }
        if (now.isAfter(voucher.getValidTo())) {
            return createInvalidResponse("Voucher đã hết hạn");
        }

        // Step 3: Kiểm tra lượt dùng
        if (voucher.getUsedCount() >= voucher.getUsageLimit()) {
            return createInvalidResponse("Voucher đã hết lượt sử dụng");
        }

        // Step 3.5: Kiểm tra per-user limit (nếu có userId)
        if (request.getUserId() != null && voucher.getPerUserLimit() != null && voucher.getPerUserLimit() > 0) {
            long userUsageCount = voucherUsageRepository.countByVoucherIdAndUserId(voucher.getId(), request.getUserId());
            if (userUsageCount >= voucher.getPerUserLimit()) {
                return createInvalidResponse("Bạn đã sử dụng hết số lượt cho phép với voucher này");
            }
        }

        // Step 4: Tính toán discount theo apply_to
        BigDecimal discountValue;
        String applyTo = voucher.getApplyTo();

        if ("ORDER".equals(applyTo)) {
            discountValue = calculateOrderDiscount(voucher, request.getOrderTotal());
        } else if ("SHIPPING".equals(applyTo)) {
            discountValue = calculateShippingDiscount(voucher, request.getOrderTotal(), request.getShippingFee());
        } else {
            return createInvalidResponse("Loại voucher không hợp lệ");
        }

        // Step 5: Kiểm tra discount > 0
        if (discountValue.compareTo(BigDecimal.ZERO) <= 0) {
            return createInvalidResponse("Voucher không áp dụng được cho đơn hàng này");
        }

        // Return success
        log.info("[validateVoucher] Voucher valid, discount: {}, applyTo: {}", discountValue, applyTo);
        return ValidateVoucherResponse.builder()
                .valid(true)
                .discountValue(discountValue)
                .applyTo(applyTo)
                .code(voucher.getCode())
                .discountType(voucher.getDiscountType())
                .discountAmount(voucher.getDiscountAmount())
                .message("Áp dụng voucher thành công")
                .build();
    }

    /**
     * Tăng used_count khi đơn hàng hoàn tất thanh toán
     */
    @Transactional
    public void incrementVoucherUsage(Long voucherId) {
        log.info("[incrementVoucherUsage] Incrementing usage for voucher id={}", voucherId);
        
        int updated = voucherRepository.incrementUsedCount(voucherId);
        if (updated == 0) {
            log.warn("[incrementVoucherUsage] Failed to increment, voucher may have reached limit");
        }
    }

    /**
     * Record voucher usage cho user và order cụ thể
     */
    @Transactional
    public void recordVoucherUsage(Long voucherId, UUID userId, Long orderId) {
        log.info("[recordVoucherUsage] Recording usage for voucher={}, user={}, order={}", 
                voucherId, userId, orderId);
        
        // Kiểm tra đã record chưa (tránh duplicate)
        if (voucherUsageRepository.existsByVoucherIdAndOrderId(voucherId, orderId)) {
            log.warn("[recordVoucherUsage] Usage already recorded for this order");
            return;
        }
        
        VoucherUsage usage = VoucherUsage.builder()
                .voucherId(voucherId)
                .userId(userId)
                .orderId(orderId)
                .build();
        
        voucherUsageRepository.save(usage);
        log.info("[recordVoucherUsage] Usage recorded successfully");
    }

    /**
     * Giảm used_count (rollback khi hủy đơn đã thanh toán)
     */
    @Transactional
    public void decrementVoucherUsage(Long voucherId) {
        log.info("[decrementVoucherUsage] Decrementing usage for voucher id={}", voucherId);
        
        int updated = voucherRepository.decrementUsedCount(voucherId);
        if (updated == 0) {
            log.warn("[decrementVoucherUsage] Failed to decrement, used_count may be 0");
        }
    }

    // ========== HELPER METHODS ==========

    /**
     * Tính discount cho ORDER
     */
    private BigDecimal calculateOrderDiscount(Voucher voucher, BigDecimal orderTotal) {
        // Kiểm tra min_order_amount
        if (orderTotal.compareTo(voucher.getMinOrderAmount()) < 0) {
            log.info("[calculateOrderDiscount] Order total {} < min {}", orderTotal, voucher.getMinOrderAmount());
            return BigDecimal.ZERO;
        }

        BigDecimal discount;
        if ("FIXED".equals(voucher.getDiscountType())) {
            discount = voucher.getDiscountAmount();
        } else if ("PERCENT".equals(voucher.getDiscountType())) {
            discount = orderTotal
                    .multiply(voucher.getDiscountAmount())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

            // Apply max_discount nếu có
            if (voucher.getMaxDiscount() != null && discount.compareTo(voucher.getMaxDiscount()) > 0) {
                discount = voucher.getMaxDiscount();
            }
        } else {
            return BigDecimal.ZERO;
        }

        // Discount không vượt order_total
        if (discount.compareTo(orderTotal) > 0) {
            discount = orderTotal;
        }

        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Tính discount cho SHIPPING
     */
    private BigDecimal calculateShippingDiscount(Voucher voucher, BigDecimal orderTotal, BigDecimal shippingFee) {
        // Kiểm tra min_order_amount (nếu > 0)
        if (voucher.getMinOrderAmount().compareTo(BigDecimal.ZERO) > 0 
            && orderTotal.compareTo(voucher.getMinOrderAmount()) < 0) {
            log.info("[calculateShippingDiscount] Order total {} < min {}", orderTotal, voucher.getMinOrderAmount());
            return BigDecimal.ZERO;
        }

        BigDecimal discount;
        if ("FIXED".equals(voucher.getDiscountType())) {
            discount = voucher.getDiscountAmount();
        } else if ("PERCENT".equals(voucher.getDiscountType())) {
            discount = shippingFee
                    .multiply(voucher.getDiscountAmount())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

            // Apply max_discount nếu có
            if (voucher.getMaxDiscount() != null && discount.compareTo(voucher.getMaxDiscount()) > 0) {
                discount = voucher.getMaxDiscount();
            }
        } else {
            return BigDecimal.ZERO;
        }

        // Discount không vượt shipping_fee
        if (discount.compareTo(shippingFee) > 0) {
            discount = shippingFee;
        }

        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Validate logic khi tạo voucher
     */
    private void validateVoucherLogic(VoucherCreateRequest request) {
        // validTo phải sau validFrom
        if (request.getValidTo().isBefore(request.getValidFrom())) {
            throw new AppException(ErrorCode.INVALID_VOUCHER_DATE_RANGE);
        }

        // Nếu PERCENT, discountAmount phải <= 100
        if ("PERCENT".equals(request.getDiscountType())) {
            if (request.getDiscountAmount().compareTo(new BigDecimal("100")) > 0) {
                throw new AppException(ErrorCode.INVALID_DISCOUNT_PERCENT);
            }
        }

        // maxDiscount chỉ dùng cho PERCENT
        if ("FIXED".equals(request.getDiscountType()) && request.getMaxDiscount() != null) {
            throw new AppException(ErrorCode.MAX_DISCOUNT_NOT_ALLOWED_FOR_FIXED);
        }
    }

    /**
     * Tạo invalid response
     */
    private ValidateVoucherResponse createInvalidResponse(String message) {
        return ValidateVoucherResponse.builder()
                .valid(false)
                .discountValue(BigDecimal.ZERO)
                .message(message)
                .build();
    }
}
