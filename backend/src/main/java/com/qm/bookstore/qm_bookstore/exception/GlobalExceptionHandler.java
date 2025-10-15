package com.qm.bookstore.qm_bookstore.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse<Object>> handlingException(Exception exception) {
        ApiResponse<Object> apiResponse = ApiResponse.<Object>builder()
                .success(false)
                .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                .message(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage())
                .error(exception.getMessage())
                .build();

        return ResponseEntity.badRequest().body(apiResponse);
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse<Object>> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        ApiResponse<Object> apiResponse = ApiResponse.<Object>builder()
                .success(false)
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .error(exception.getMessage())
                .build();

        return ResponseEntity.badRequest().body(apiResponse);
    }

    @ExceptionHandler(value = RuntimeException.class)
    ResponseEntity<ApiResponse<Object>> handlingRuntimeException(RuntimeException exception) {
        ApiResponse<Object> apiResponse = ApiResponse.<Object>builder()
                .success(false)
                .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                .message(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage())
                .error(exception.getMessage())
                .build();

        return ResponseEntity.badRequest().body(apiResponse);
    }

    @ExceptionHandler(value = MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiResponse<Object>> handlingMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException exception) {
        String message = String.format("Parameter '%s' with value '%s' could not be converted to type '%s'", 
                exception.getName(), exception.getValue(), exception.getRequiredType().getSimpleName());
        
        ApiResponse<Object> apiResponse = ApiResponse.<Object>builder()
                .success(false)
                .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                .message("Invalid parameter type")
                .error(message)
                .build();

        return ResponseEntity.badRequest().body(apiResponse);
    }
}
