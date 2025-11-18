package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.notification.request.NotificationCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductReviewCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductReviewUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.response.ProductReviewResponse;
import com.qm.bookstore.qm_bookstore.dto.product.response.ProductReviewStatsResponse;
import com.qm.bookstore.qm_bookstore.entity.Notification;
import com.qm.bookstore.qm_bookstore.entity.Product;
import com.qm.bookstore.qm_bookstore.entity.ProductReview;
import com.qm.bookstore.qm_bookstore.entity.User;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.mapper.ProductReviewMapper;
import com.qm.bookstore.qm_bookstore.repository.ProductRepository;
import com.qm.bookstore.qm_bookstore.repository.ProductReviewRepository;
import com.qm.bookstore.qm_bookstore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
@Slf4j
public class ProductReviewService {
    
    ProductReviewRepository productReviewRepository;
    ProductRepository productRepository;
    UserRepository userRepository;
    ProductReviewMapper productReviewMapper;
    NotificationService notificationService;
    ChatNotificationService chatNotificationService;
    
    @Transactional
    public ProductReviewResponse createReview(ProductReviewCreateRequest request) {
        // Validate rating
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new AppException(ErrorCode.INVALID_RATING);
        }
        
        // Check if product exists
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        
        // Check if user exists
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // Check if user already reviewed this product
        if (productReviewRepository.existsByProductIdAndUserId(request.getProductId(), request.getUserId())) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }
        
        // Create review
        ProductReview review = productReviewMapper.toProductReview(request);
        review.setProduct(product);
        review.setCreatedAt(LocalDateTime.now());
        review = productReviewRepository.save(review);
        
        // Send notification to admin and manager
        sendReviewNotificationToAdminAndManager(review, user, product);
        
        // Reload to get user relationship
        review = productReviewRepository.findById(review.getId())
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        
        return productReviewMapper.toProductReviewResponse(review);
    }
    
    @Transactional
    public ProductReviewResponse updateReview(ProductReviewUpdateRequest request) {
        // Validate rating
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new AppException(ErrorCode.INVALID_RATING);
        }
        
        ProductReview review = productReviewRepository.findById(request.getId())
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        
        if (request.getRating() != null) {
            review.setRating(request.getRating());
        }
        
        if (request.getContent() != null) {
            review.setContent(request.getContent());
        }
        
        review = productReviewRepository.save(review);
        return productReviewMapper.toProductReviewResponse(review);
    }
    
    public void deleteReview(Long reviewId) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        productReviewRepository.delete(review);
    }
    
    public ProductReviewResponse getReviewById(Long reviewId) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        return productReviewMapper.toProductReviewResponse(review);
    }
    
    public List<ProductReviewResponse> getReviewsByProductId(Long productId) {
        List<ProductReview> reviews = productReviewRepository.findByProductId(productId);
        return reviews.stream()
                .map(productReviewMapper::toProductReviewResponse)
                .toList();
    }
    
    public List<ProductReviewResponse> getReviewsByUserId(UUID userId) {
        List<ProductReview> reviews = productReviewRepository.findByUserId(userId);
        return reviews.stream()
                .map(productReviewMapper::toProductReviewResponse)
                .toList();
    }
    
    public ProductReviewStatsResponse getReviewStats(Long productId) {
        Long totalReviews = productReviewRepository.countByProductId(productId);
        Double averageRating = productReviewRepository.getAverageRatingByProductId(productId);
        
        return ProductReviewStatsResponse.builder()
                .productId(productId)
                .totalReviews(totalReviews)
                .averageRating(averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0)
                .build();
    }
    
    public ProductReviewResponse getUserReviewForProduct(Long productId, UUID userId) {
        ProductReview review = productReviewRepository.findByProductIdAndUserId(productId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        return productReviewMapper.toProductReviewResponse(review);
    }
    
    private void sendReviewNotificationToAdminAndManager(ProductReview review, User reviewUser, Product product) {
        try {
            String message = String.format("Khách hàng '%s' đã đánh giá %d sao sản phẩm '%s'", 
                    reviewUser.getUsername(), review.getRating(), product.getName());
            
            String anchor = String.format("/admin/reviews?productId=%d&reviewId=%d", 
                    product.getId(), review.getId());
            
            // Find all admin and manager users
            List<User> adminAndManagers = userRepository.findAll().stream()
                    .filter(user -> user.getRole() != null && 
                            (user.getRole().getName().equalsIgnoreCase("admin") || 
                             user.getRole().getName().equalsIgnoreCase("manager")))
                    .toList();
            
            // Send notification to each admin and manager
            for (User adminOrManager : adminAndManagers) {
                // 1. Save notification to database and get NotificationResponse
                NotificationCreateRequest notificationRequest = new NotificationCreateRequest();
                notificationRequest.setUserId(adminOrManager.getId());
                notificationRequest.setType(Notification.NotificationType.NEW_REVIEW);
                notificationRequest.setMessage(message);
                notificationRequest.setAnchor(anchor);
                
                // Get the NotificationResponse from creation
                com.qm.bookstore.qm_bookstore.dto.notification.response.NotificationResponse notificationResponse = 
                        notificationService.createNotification(notificationRequest);
                
                // 2. Broadcast notification via main notification channels (for navbar display)
                chatNotificationService.broadcastPersonalNotification(adminOrManager.getId(), notificationResponse);
            }
            
            log.info("Sent review notification to {} admin/manager users", adminAndManagers.size());
        } catch (Exception e) {
            log.error("Failed to send review notification to admin and manager", e);
        }
    }
}
