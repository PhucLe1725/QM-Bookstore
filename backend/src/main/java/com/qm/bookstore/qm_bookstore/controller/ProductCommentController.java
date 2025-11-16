package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductCommentCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductCommentUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.response.ProductCommentResponse;
import com.qm.bookstore.qm_bookstore.service.ProductCommentService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/product-comments")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
@Slf4j
public class ProductCommentController {

    ProductCommentService commentService;

    /**
     * Lấy comment theo ID
     */
    @GetMapping("/{id}")
    public ApiResponse<ProductCommentResponse> getCommentById(@PathVariable Long id) {
        log.info("Getting comment by id: {}", id);
        ProductCommentResponse comment = commentService.getCommentById(id);
        return ApiResponse.<ProductCommentResponse>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Comment retrieved successfully")
                .result(comment)
                .build();
    }

    /**
     * Lấy tất cả comments của một product (bao gồm cả replies)
     */
    @GetMapping("/product/{productId}")
    public ApiResponse<List<ProductCommentResponse>> getAllCommentsByProductId(@PathVariable Long productId) {
        log.info("Getting all comments for product: {}", productId);
        List<ProductCommentResponse> comments = commentService.getAllCommentsByProductId(productId);
        return ApiResponse.<List<ProductCommentResponse>>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Comments retrieved successfully")
                .result(comments)
                .build();
    }

    /**
     * Lấy chỉ các comments gốc (không phải reply) của một product
     */
    @GetMapping("/product/{productId}/root")
    public ApiResponse<List<ProductCommentResponse>> getRootCommentsByProductId(@PathVariable Long productId) {
        log.info("Getting root comments for product: {}", productId);
        List<ProductCommentResponse> comments = commentService.getRootCommentsByProductId(productId);
        return ApiResponse.<List<ProductCommentResponse>>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Root comments retrieved successfully")
                .result(comments)
                .build();
    }

    /**
     * Lấy tất cả replies của một comment
     */
    @GetMapping("/{commentId}/replies")
    public ApiResponse<List<ProductCommentResponse>> getRepliesByCommentId(@PathVariable Long commentId) {
        log.info("Getting replies for comment: {}", commentId);
        List<ProductCommentResponse> replies = commentService.getRepliesByParentId(commentId);
        return ApiResponse.<List<ProductCommentResponse>>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Replies retrieved successfully")
                .result(replies)
                .build();
    }

    /**
     * Đếm số lượng replies của một comment
     */
    @GetMapping("/{commentId}/replies/count")
    public ApiResponse<Long> getReplyCountByCommentId(@PathVariable Long commentId) {
        log.info("Getting reply count for comment: {}", commentId);
        Long count = commentService.getReplyCountByCommentId(commentId);
        return ApiResponse.<Long>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Reply count retrieved successfully")
                .result(count)
                .build();
    }

    /**
     * Lấy tất cả comments của một user
     */
    @GetMapping("/user/{userId}")
    public ApiResponse<List<ProductCommentResponse>> getCommentsByUserId(@PathVariable UUID userId) {
        log.info("Getting comments by user: {}", userId);
        List<ProductCommentResponse> comments = commentService.getCommentsByUserId(userId);
        return ApiResponse.<List<ProductCommentResponse>>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("User comments retrieved successfully")
                .result(comments)
                .build();
    }

    /**
     * Đếm số lượng comments của một product
     */
    @GetMapping("/product/{productId}/count")
    public ApiResponse<Long> getCommentCountByProductId(@PathVariable Long productId) {
        log.info("Getting comment count for product: {}", productId);
        Long count = commentService.getCommentCountByProductId(productId);
        return ApiResponse.<Long>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Comment count retrieved successfully")
                .result(count)
                .build();
    }

    /**
     * Tạo comment hoặc reply mới
     */
    @PostMapping
    public ApiResponse<ProductCommentResponse> createComment(@RequestBody ProductCommentCreateRequest request) {
        log.info("Creating comment for product: {}, parent: {}", request.getProductId(), request.getParentId());
        ProductCommentResponse comment = commentService.createComment(request);
        return ApiResponse.<ProductCommentResponse>builder()
                .success(true)
                .code(HttpStatus.CREATED.value())
                .message(request.getParentId() != null ? "Reply created successfully" : "Comment created successfully")
                .result(comment)
                .build();
    }

    /**
     * Cập nhật comment
     */
    @PutMapping("/{id}")
    public ApiResponse<ProductCommentResponse> updateComment(
            @PathVariable Long id,
            @RequestBody ProductCommentUpdateRequest request) {
        log.info("Updating comment: {}", id);
        request.setId(id);
        ProductCommentResponse comment = commentService.updateComment(request);
        return ApiResponse.<ProductCommentResponse>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Comment updated successfully")
                .result(comment)
                .build();
    }

    /**
     * Xóa comment (sẽ xóa cả replies do CASCADE)
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteComment(@PathVariable Long id) {
        log.info("Deleting comment: {}", id);
        commentService.deleteComment(id);
        return ApiResponse.<Void>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Comment deleted successfully")
                .build();
    }
}
