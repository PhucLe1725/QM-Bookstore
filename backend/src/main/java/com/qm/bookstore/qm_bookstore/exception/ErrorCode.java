package com.qm.bookstore.qm_bookstore.exception;

public enum ErrorCode {
    // Authentication errors
    USER_NOT_FOUND(1001, "User not found"),
    INVALID_CREDENTIALS(1002, "Invalid username or password"),
    INVALID_REFRESH_TOKEN(1003, "Invalid refresh token"),
    REFRESH_TOKEN_EXPIRED(1004, "Refresh token has expired"),
    USER_ALREADY_EXISTS(1005, "Username already exists"),
    EMAIL_ALREADY_EXISTS(1006, "Email already exists"),
    
    // OTP & Registration errors
    INVALID_OTP(1010, "Invalid OTP code"),
    OTP_EXPIRED(1011, "OTP code has expired. Please request a new one"),
    PENDING_USER_NOT_FOUND(1012, "No pending registration found for this email"),
    EMAIL_SEND_FAILED(1013, "Failed to send verification email"),

    // Chat errors
    CHAT_MESSAGE_NOT_FOUND(2001, "Chat message not found"),
    CHAT_SAVE_FAILED(2002, "Failed to save chat message"),
    CHAT_UNAUTHORIZED(2003, "Unauthorized to access this chat"),

    // Product errors
    PRODUCT_NOT_FOUND(3001, "Product not found"),
    PRODUCT_SKU_ALREADY_EXISTS(3002, "Product SKU already exists"),
    PRODUCT_OUT_OF_STOCK(3003, "Product is out of stock"),
    
    // Review errors
    REVIEW_NOT_FOUND(3101, "Review not found"),
    REVIEW_ALREADY_EXISTS(3102, "You have already reviewed this product"),
    INVALID_RATING(3103, "Rating must be between 1 and 5"),
    
    // Category errors
    CATEGORY_NOT_FOUND(4001, "Category not found"),
    
    // Cart errors
    CART_NOT_FOUND(6001, "Cart not found"),
    CART_ITEM_NOT_FOUND(6002, "Cart item not found"),
    NO_ITEMS_SELECTED(6003, "No items selected for checkout"),
    INVALID_REQUEST(6004, "Invalid request"),
    PRODUCT_ALREADY_IN_CART(6005, "Product is already in your cart. Please update quantity from cart page"),

    // Notification errors
    NOTIFICATION_NOT_FOUND(5001, "Notification not found"),
    NOTIFICATION_ACCESS_DENIED(5002, "Access denied to this notification"),

    // Generic errors
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error"),
    INVALID_KEY(1005, "Invalid message key"),
    UNAUTHENTICATED(1006, "Unauthenticated"),
    UNAUTHORIZED(1007, "You do not have permission"),
    INVALID_DOB(1008, "Your age must be at least {min}"),
    ROLE_NOT_EXISTED(1009, "Role does not exist");

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    private int code;
    private String message;

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
