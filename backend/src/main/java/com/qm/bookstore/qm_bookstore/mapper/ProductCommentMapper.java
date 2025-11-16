package com.qm.bookstore.qm_bookstore.mapper;

import com.qm.bookstore.qm_bookstore.dto.product.request.ProductCommentCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.response.ProductCommentResponse;
import com.qm.bookstore.qm_bookstore.entity.ProductComment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductCommentMapper {
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "parentComment", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "user", ignore = true)
    ProductComment toProductComment(ProductCommentCreateRequest request);
    
    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "parentComment.id", target = "parentId")
    @Mapping(source = "user.username", target = "username")
    @Mapping(source = "user.fullName", target = "fullName")
    ProductCommentResponse toProductCommentResponse(ProductComment comment);
    
    List<ProductCommentResponse> toProductCommentResponseList(List<ProductComment> comments);
}
