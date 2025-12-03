package com.qm.bookstore.qm_bookstore.mapper;

import com.qm.bookstore.qm_bookstore.dto.voucher.request.VoucherCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.voucher.request.VoucherUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.voucher.response.VoucherResponse;
import com.qm.bookstore.qm_bookstore.entity.Voucher;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import java.time.LocalDateTime;

@Mapper(componentModel = "spring")
public interface VoucherMapper {
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "usedCount", constant = "0")
    @Mapping(target = "status", constant = "true")
    @Mapping(target = "createdAt", ignore = true)
    Voucher toVoucher(VoucherCreateRequest request);
    
    @Mapping(target = "remainingUsage", expression = "java(voucher.getUsageLimit() - voucher.getUsedCount())")
    @Mapping(target = "isActive", expression = "java(isVoucherActive(voucher))")
    VoucherResponse toVoucherResponse(Voucher voucher);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "discountAmount", ignore = true)
    @Mapping(target = "discountType", ignore = true)
    @Mapping(target = "applyTo", ignore = true)
    @Mapping(target = "usedCount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateVoucher(@MappingTarget Voucher voucher, VoucherUpdateRequest request);
    
    @Named("isVoucherActive")
    default Boolean isVoucherActive(Voucher voucher) {
        if (voucher == null || !voucher.getStatus()) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        return !now.isBefore(voucher.getValidFrom()) && !now.isAfter(voucher.getValidTo());
    }
}
