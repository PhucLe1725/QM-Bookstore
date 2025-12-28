package com.qm.bookstore.qm_bookstore.dto.user.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChangePasswordRequest {
    
    @NotBlank(message = "Current password is required")
    String currentPassword;
    
    @NotBlank(message = "New password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    String newPassword;
    
    @NotBlank(message = "Confirm password is required")
    String confirmPassword;
}
