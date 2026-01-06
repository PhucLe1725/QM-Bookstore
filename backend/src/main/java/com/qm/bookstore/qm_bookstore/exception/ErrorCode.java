package com.qm.bookstore.qm_bookstore.exception;

public enum ErrorCode {
    // Authentication errors
    USER_NOT_FOUND(1001, "User not found"),
    INVALID_CREDENTIALS(1002, "Invalid username or password"),
    INVALID_REFRESH_TOKEN(1003, "Invalid refresh token"),
    REFRESH_TOKEN_EXPIRED(1004, "Refresh token has expired"),
    USER_ALREADY_EXISTS(1005, "Username already exists"),
    EMAIL_ALREADY_EXISTS(1006, "Email already exists"),
    WRONG_PASSWORD(1007, "Current password is incorrect"),
    PASSWORD_NOT_MATCH(1008, "New password and confirm password do not match"),
    
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
    USER_NOT_PURCHASED_PRODUCT(3104, "You must purchase this product before reviewing"),
    
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

    // Order errors (7000-7099)
    ORDER_NOT_FOUND(7001, "Order not found"),
    ORDER_ACCESS_DENIED(7002, "You don't have permission to access this order"),
    CANNOT_CANCEL_ORDER(7003, "Cannot cancel order with current status"),
    CART_EMPTY(7004, "No items selected in cart for checkout"),
    INSUFFICIENT_STOCK(7005, "Insufficient stock for product: {0}"),
    INVALID_STATUS_TRANSITION(7006, "Invalid status transition from {0} to {1}"),
    VOUCHER_INVALID(7007, "Voucher is invalid or expired"),
    SHIPPING_FEE_CALCULATION_FAILED(7008, "Failed to calculate shipping fee"),

    // System Config errors (8000-8099)
    SYSTEM_CONFIG_NOT_FOUND(8001, "System configuration not found"),
    SYSTEM_CONFIG_ALREADY_EXISTS(8002, "Configuration with this key already exists"),

    // Voucher errors (7100-7199)
    VOUCHER_NOT_FOUND(7101, "Voucher not found"),
    VOUCHER_CODE_EXISTED(7102, "Voucher code already exists"),
    VOUCHER_INACTIVE(7103, "Voucher is not active"),
    VOUCHER_EXPIRED(7104, "Voucher has expired"),
    VOUCHER_NOT_YET_VALID(7105, "Voucher is not yet valid"),
    VOUCHER_USAGE_LIMIT_REACHED(7106, "Voucher usage limit has been reached"),
    ORDER_BELOW_MIN_AMOUNT(7107, "Order total must be at least {0} to use this voucher"),
    INVALID_VOUCHER_DATE_RANGE(7108, "Valid from date must be before valid to date"),
    INVALID_DISCOUNT_PERCENT(7109, "Discount percent must be between 0 and 100"),
    MAX_DISCOUNT_NOT_ALLOWED_FOR_FIXED(7110, "Max discount is only applicable for PERCENT type vouchers"),
    VOUCHER_USER_LIMIT_EXCEEDED(7111, "You have exceeded the usage limit for this voucher"),

    // Transaction errors (7200-7299)
    TRANSACTION_NOT_FOUND(7201, "Transaction not found"),
    TRANSACTION_ALREADY_VERIFIED(7202, "Transaction has already been verified"),
    TRANSACTION_EXPIRED(7203, "Transaction has expired"),
    TRANSACTION_AMOUNT_MISMATCH(7204, "Transaction amount does not match expected amount"),
    TRANSACTION_INVALID_ACCOUNT(7205, "Invalid credit account"),
    EMAIL_FETCH_FAILED(7206, "Failed to fetch emails from server"),
    PAYMENT_ALREADY_CONFIRMED(7207, "Payment has already been confirmed"),
    ORDER_ALREADY_CANCELLED(7208, "Order has already been cancelled"),
    INVALID_PAYMENT_METHOD(7209, "Order does not use prepaid payment method"),
    ORDER_ALREADY_PAID(7210, "Order is already paid"),

    // Shipping & Goong API errors (6000-6099)
    GEOCODING_FAILED(6001, "Failed to convert address to coordinates"),
    ROUTE_CALCULATION_FAILED(6002, "Failed to calculate route"),
    INVALID_ADDRESS(6003, "Invalid address format"),
    GOONG_API_ERROR(6004, "Error calling Goong API"),
    SHIPPING_CALCULATION_FAILED(6005, "Failed to calculate shipping fee"),
    STORE_LOCATION_NOT_CONFIGURED(6006, "Store location not configured in system settings"),

    // Inventory errors (9000-9099)
    INVENTORY_TRANSACTION_NOT_FOUND(9001, "Inventory transaction not found"),
    DUPLICATE_OUT_TRANSACTION(9002, "Inventory has already been deducted for this order"),
    INSUFFICIENT_INVENTORY(9003, "Insufficient inventory for product: {0}. Available: {1}, Required: {2}"),
    INVALID_TRANSACTION_TYPE(9004, "Invalid transaction type: {0}"),
    INVALID_CHANGE_TYPE_FOR_TRANSACTION(9005, "Change type {0} is not allowed for transaction type {1}"),
    INVALID_CHANGE_TYPE(9006, "Invalid change type: {0}. Must be PLUS or MINUS"),
    ORDER_NOT_FOUND_FOR_INVENTORY(9007, "Order not found with ID: {0}"),
    ORDER_ITEMS_EMPTY(9008, "Order has no items to process"),
    INVENTORY_UPDATE_FAILED(9009, "Failed to update inventory for product: {0}"),

    // Invoice errors (9100-9199)
    INVOICE_NOT_FOUND(9101, "Invoice not found"),
    INVOICE_ORDER_NOT_PAID(9102, "Order must be paid before generating invoice"),
    INVOICE_ORDER_CANCELLED(9103, "Cannot generate invoice for cancelled order"),
    INVOICE_ALREADY_EXISTS(9104, "Invoice already exists for this order"),
    INVOICE_AMOUNT_VALIDATION_FAILED(9105, "Invoice amount validation failed"),
    INVOICE_ACCESS_DENIED(9106, "You don't have permission to access this invoice"),
    INVOICE_PDF_GENERATION_FAILED(9107, "Failed to generate invoice PDF"),

    // Product Combo errors (9200-9299)
    PRODUCT_COMBO_NOT_FOUND(9201, "Product combo not found"),
    PRODUCT_COMBO_NAME_EXISTED(9202, "Combo name already exists"),
    PRODUCT_COMBO_EMPTY_ITEMS(9203, "Combo must have at least one product"),
    PRODUCT_COMBO_INVALID_PRICE(9204, "Combo price must be less than total product prices"),
    PRODUCT_COMBO_UNAVAILABLE(9205, "Product combo is not available"),
    COMBO_SNAPSHOT_NOT_FOUND(9206, "Combo snapshot data not found for order item"),

    // Generic errors
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error"),
    INVALID_KEY(1005, "Invalid message key"),
    UNAUTHENTICATED(1006, "Unauthenticated"),
    UNAUTHORIZED(1007, "You do not have permission"),
    INVALID_DOB(1008, "Your age must be at least {min}"),
    ROLE_NOT_EXISTED(1009, "Role does not exist"),
    ROLE_EXISTED(1010, "Role already exists");

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
