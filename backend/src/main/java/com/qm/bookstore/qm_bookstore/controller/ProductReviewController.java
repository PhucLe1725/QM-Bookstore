package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductReviewCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductReviewUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.response.ProductReviewResponse;
import com.qm.bookstore.qm_bookstore.dto.product.response.ProductReviewStatsResponse;
import com.qm.bookstore.qm_bookstore.service.ProductReviewService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/product-reviews")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ProductReviewController {
    
    ProductReviewService productReviewService;
    
    @PostMapping
    public ApiResponse<ProductReviewResponse> createReview(@RequestBody ProductReviewCreateRequest request) {
        ProductReviewResponse response = productReviewService.createReview(request);
        return ApiResponse.<ProductReviewResponse>builder()
                .result(response)
                .build();
    }
    
    @PutMapping("/{id}")
    public ApiResponse<ProductReviewResponse> updateReview(
            @PathVariable Long id,
            @RequestBody ProductReviewUpdateRequest request) {
        request.setId(id);
        ProductReviewResponse response = productReviewService.updateReview(request);
        return ApiResponse.<ProductReviewResponse>builder()
                .result(response)
                .build();
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<String> deleteReview(@PathVariable Long id) {
        productReviewService.deleteReview(id);
        return ApiResponse.<String>builder()
                .result("Review deleted successfully")
                .build();
    }
    
    @GetMapping("/{id}")
    public ApiResponse<ProductReviewResponse> getReviewById(@PathVariable Long id) {
        ProductReviewResponse response = productReviewService.getReviewById(id);
        return ApiResponse.<ProductReviewResponse>builder()
                .result(response)
                .build();
    }
    
    @GetMapping("/product/{productId}")
    public ApiResponse<List<ProductReviewResponse>> getReviewsByProductId(@PathVariable Long productId) {
        List<ProductReviewResponse> reviews = productReviewService.getReviewsByProductId(productId);
        return ApiResponse.<List<ProductReviewResponse>>builder()
                .result(reviews)
                .build();
    }
    
    @GetMapping("/user/{userId}")
    public ApiResponse<List<ProductReviewResponse>> getReviewsByUserId(@PathVariable UUID userId) {
        List<ProductReviewResponse> reviews = productReviewService.getReviewsByUserId(userId);
        return ApiResponse.<List<ProductReviewResponse>>builder()
                .result(reviews)
                .build();
    }
    
    @GetMapping("/my-reviews")
    public ApiResponse<List<ProductReviewResponse>> getMyReviews() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        // Get user from username (you need UserService for this)
        // For now, assume you have userId from token
        // This is a placeholder - you'll need to get actual userId
        UUID userId = UUID.fromString(authentication.getName()); // This needs proper implementation
        
        List<ProductReviewResponse> reviews = productReviewService.getReviewsByUserId(userId);
        return ApiResponse.<List<ProductReviewResponse>>builder()
                .result(reviews)
                .build();
    }
    
    @GetMapping("/stats/product/{productId}")
    public ApiResponse<ProductReviewStatsResponse> getReviewStats(@PathVariable Long productId) {
        ProductReviewStatsResponse stats = productReviewService.getReviewStats(productId);
        return ApiResponse.<ProductReviewStatsResponse>builder()
                .result(stats)
                .build();
    }
    
    @GetMapping("/product/{productId}/my-review")
    public ApiResponse<ProductReviewResponse> getMyReviewForProduct(@PathVariable Long productId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = UUID.fromString(authentication.getName()); // This needs proper implementation
        
        ProductReviewResponse review = productReviewService.getUserReviewForProduct(productId, userId);
        return ApiResponse.<ProductReviewResponse>builder()
                .result(review)
                .build();
    }
    
    @GetMapping("/product/{productId}/check-purchase")
    public ApiResponse<Boolean> checkUserPurchasedProduct(@PathVariable Long productId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = UUID.fromString(authentication.getName());
        
        boolean hasPurchased = productReviewService.hasUserPurchasedProduct(productId, userId);
        return ApiResponse.<Boolean>builder()
                .result(hasPurchased)
                .build();
    }
    
    /**
     * Admin: Get all reviews with pagination and optional filters
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<Page<ProductReviewResponse>> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        log.info("Admin getting all reviews. Page: {}, Size: {}, Rating: {}", page, size, rating);
        
        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ProductReviewResponse> reviews = productReviewService.getAllReviews(pageable, rating);
        
        return ApiResponse.<Page<ProductReviewResponse>>builder()
                .success(true)
                .code(200)
                .message("Lấy danh sách reviews thành công")
                .result(reviews)
                .build();
    }
}
