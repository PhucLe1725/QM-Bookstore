package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.notification.request.NotificationCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductCommentCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductCommentUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.response.ProductCommentResponse;
import com.qm.bookstore.qm_bookstore.entity.Notification;
import com.qm.bookstore.qm_bookstore.entity.Product;
import com.qm.bookstore.qm_bookstore.entity.ProductComment;
import com.qm.bookstore.qm_bookstore.entity.User;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.mapper.ProductCommentMapper;
import com.qm.bookstore.qm_bookstore.repository.ProductCommentRepository;
import com.qm.bookstore.qm_bookstore.repository.ProductRepository;
import com.qm.bookstore.qm_bookstore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
@Slf4j
public class ProductCommentService {

    ProductCommentRepository commentRepository;
    ProductRepository productRepository;
    UserRepository userRepository;
    ProductCommentMapper commentMapper;
    SimpMessagingTemplate messagingTemplate;
    NotificationService notificationService;
    ChatNotificationService chatNotificationService;

    public ProductCommentResponse getCommentById(Long commentId) {
        ProductComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        return commentMapper.toProductCommentResponse(comment);
    }

    public List<ProductCommentResponse> getAllCommentsByProductId(Long productId) {
        List<ProductComment> comments = commentRepository.findByProductIdOrderByCreatedAtDesc(productId);
        return commentMapper.toProductCommentResponseList(comments);
    }

    public List<ProductCommentResponse> getRootCommentsByProductId(Long productId) {
        List<ProductComment> comments = commentRepository.findRootCommentsByProductId(productId);
        return commentMapper.toProductCommentResponseList(comments);
    }

    public List<ProductCommentResponse> getRepliesByParentId(Long parentId) {
        List<ProductComment> replies = commentRepository.findRepliesByParentId(parentId);
        return commentMapper.toProductCommentResponseList(replies);
    }

    public List<ProductCommentResponse> getCommentsByUserId(UUID userId) {
        List<ProductComment> comments = commentRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return commentMapper.toProductCommentResponseList(comments);
    }

    public Long getCommentCountByProductId(Long productId) {
        return commentRepository.countByProductId(productId);
    }

    public Long getReplyCountByCommentId(Long commentId) {
        return commentRepository.countByParentCommentId(commentId);
    }

    @Transactional
    public ProductCommentResponse createComment(ProductCommentCreateRequest request) {
        // Verify product exists
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        ProductComment comment = commentMapper.toProductComment(request);
        comment.setProduct(product);
        comment.setCreatedAt(LocalDateTime.now());

        // If this is a reply, verify parent comment exists
        if (request.getParentId() != null) {
            ProductComment parentComment = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
            comment.setParentComment(parentComment);

            // Save comment first
            comment = commentRepository.save(comment);

            // Send notification to parent comment owner (if they're not replying to themselves)
            if (!parentComment.getUserId().equals(request.getUserId())) {
                sendReplyNotificationToCommentOwner(parentComment, comment, product);
            }
        } else {
            // Save comment first
            comment = commentRepository.save(comment);
        }

        // Get user who created the comment
        User commentUser = userRepository.findById(request.getUserId())
                .orElse(null);

        // If comment is from customer, notify admin and manager
        if (commentUser != null && isCustomer(commentUser)) {
            sendCommentNotificationToAdminAndManager(comment, commentUser, product);
        }

        return commentMapper.toProductCommentResponse(comment);
    }

    private void sendReplyNotificationToCommentOwner(ProductComment parentComment, ProductComment reply, Product product) {
        try {
            User replyUser = userRepository.findById(reply.getUserId()).orElse(null);
            String replyUserName = replyUser != null ? replyUser.getUsername() : "Someone";

            String message = String.format("%s đã phản hồi bình luận của bạn về sản phẩm '%s'", 
                    replyUserName, product.getName());
            
            String anchor = String.format("/products/%d#comment-%d", product.getId(), reply.getId());

            // 1. Save notification to database and get NotificationResponse
            NotificationCreateRequest notificationRequest = new NotificationCreateRequest();
            notificationRequest.setUserId(parentComment.getUserId());
            notificationRequest.setType(Notification.NotificationType.COMMENT_REPLY);
            notificationRequest.setMessage(message);
            notificationRequest.setAnchor(anchor);
            
            // Get the NotificationResponse from creation
            com.qm.bookstore.qm_bookstore.dto.notification.response.NotificationResponse notificationResponse = 
                    notificationService.createNotification(notificationRequest);

            // 2. Broadcast notification via main notification channels (for navbar display)
            chatNotificationService.broadcastPersonalNotification(parentComment.getUserId(), notificationResponse);
            
            log.info("Sent reply notification to user {} for comment {}", parentComment.getUserId(), parentComment.getId());
        } catch (Exception e) {
            log.error("Failed to send reply notification to comment owner", e);
        }
    }

    private void sendCommentNotificationToAdminAndManager(ProductComment comment, User commentUser, Product product) {
        try {
            String message = String.format("Khách hàng '%s' đã bình luận về sản phẩm '%s'", 
                    commentUser.getUsername(), product.getName());
            
            String anchor = String.format("/admin/comments?productId=%d&commentId=%d", 
                    product.getId(), comment.getId());

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
                notificationRequest.setType(Notification.NotificationType.NEW_CUSTOMER_COMMENT);
                notificationRequest.setMessage(message);
                notificationRequest.setAnchor(anchor);
                
                // Get the NotificationResponse from creation
                com.qm.bookstore.qm_bookstore.dto.notification.response.NotificationResponse notificationResponse = 
                        notificationService.createNotification(notificationRequest);
                
                // 2. Broadcast notification via main notification channels (for navbar display)
                chatNotificationService.broadcastPersonalNotification(adminOrManager.getId(), notificationResponse);
            }

            log.info("Sent customer comment notification to {} admin/manager users", adminAndManagers.size());
        } catch (Exception e) {
            log.error("Failed to send comment notification to admin and manager", e);
        }
    }

    private boolean isCustomer(User user) {
        if (user.getRole() == null) {
            return true; // Default to customer if no role
        }
        String roleName = user.getRole().getName().toLowerCase();
        return !roleName.equals("admin") && !roleName.equals("manager");
    }

    @Transactional
    public ProductCommentResponse updateComment(ProductCommentUpdateRequest request) {
        ProductComment comment = commentRepository.findById(request.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        comment.setContent(request.getContent());
        comment = commentRepository.save(comment);

        return commentMapper.toProductCommentResponse(comment);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        ProductComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        commentRepository.delete(comment);
    }
    
    /**
     * Admin: Get all comments with pagination and optional rootOnly filter
     */
    public Page<ProductCommentResponse> getAllComments(Pageable pageable, Boolean rootOnly) {
        log.info("Getting all comments with pagination. Page: {}, Size: {}, Root only: {}", 
                pageable.getPageNumber(), pageable.getPageSize(), rootOnly);
        
        Page<ProductComment> commentPage;
        if (rootOnly != null && rootOnly) {
            commentPage = commentRepository.findAllRootComments(pageable);
        } else {
            commentPage = commentRepository.findAllComments(pageable);
        }
        
        // Map to response and add reply count for root comments
        return commentPage.map(comment -> {
            ProductCommentResponse response = commentMapper.toProductCommentResponse(comment);
            // Add reply count if it's a root comment
            if (comment.getParentComment() == null) {
                Long replyCount = commentRepository.countByParentCommentId(comment.getId());
                // Note: ProductCommentResponse doesn't have replyCount field yet
                // We'll document this difference for frontend
            }
            return response;
        });
    }
}
