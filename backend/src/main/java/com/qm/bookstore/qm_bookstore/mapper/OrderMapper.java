package com.qm.bookstore.qm_bookstore.mapper;

import com.qm.bookstore.qm_bookstore.dto.order.response.CheckoutResponse;
import com.qm.bookstore.qm_bookstore.dto.order.response.OrderDetailResponse;
import com.qm.bookstore.qm_bookstore.dto.order.response.OrderResponse;
import com.qm.bookstore.qm_bookstore.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {
    
    // Map Order entity to CheckoutResponse
    @Mapping(source = "id", target = "orderId")
    @Mapping(target = "paymentUrl", ignore = true) // Will be set manually in service
    CheckoutResponse toCheckoutResponse(Order order);
    
    // Map Order entity to OrderResponse (without items - will be added in service)
    @Mapping(source = "id", target = "orderId")
    @Mapping(target = "itemCount", ignore = true)
    @Mapping(target = "items", ignore = true)
    OrderResponse toOrderResponse(Order order);
    
    // Map Order entity to OrderDetailResponse (without items and complex objects)
    @Mapping(source = "id", target = "orderId")
    @Mapping(target = "voucher", ignore = true) // Will be set manually in service
    @Mapping(target = "receiver", ignore = true) // Will be set manually in service
    @Mapping(target = "items", ignore = true)
    OrderDetailResponse toOrderDetailResponse(Order order);
}
