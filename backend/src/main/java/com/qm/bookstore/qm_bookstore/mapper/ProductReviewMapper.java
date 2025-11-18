package com.qm.bookstore.qm_bookstore.mapper;

import com.qm.bookstore.qm_bookstore.dto.product.request.ProductReviewCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.response.ProductReviewResponse;
import com.qm.bookstore.qm_bookstore.entity.ProductReview;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductReviewMapper {
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    ProductReview toProductReview(ProductReviewCreateRequest request);
    
    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "user.username", target = "username")
    @Mapping(source = "user.fullName", target = "fullName")
    ProductReviewResponse toProductReviewResponse(ProductReview productReview);
}
