package com.qm.bookstore.qm_bookstore.exception;

public enum ErrorCode {
    // Authentication errors
    USER_NOT_FOUND(1001, "User not found"),
    INVALID_CREDENTIALS(1002, "Invalid username or password"),
    INVALID_REFRESH_TOKEN(1003, "Invalid refresh token"),
    REFRESH_TOKEN_EXPIRED(1004, "Refresh token has expired"),


    // Generic errors
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error"),
    INVALID_KEY(1005, "Invalid message key"),
    UNAUTHENTICATED(1006, "Unauthenticated"),
    UNAUTHORIZED(1007, "You do not have permission"),
    INVALID_DOB(1008, "Your age must be at least {min}")
    ;

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
