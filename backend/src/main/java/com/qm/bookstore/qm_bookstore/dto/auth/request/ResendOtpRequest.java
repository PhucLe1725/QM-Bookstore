package com.qm.bookstore.qm_bookstore.dto.auth.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResendOtpRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email;
}
