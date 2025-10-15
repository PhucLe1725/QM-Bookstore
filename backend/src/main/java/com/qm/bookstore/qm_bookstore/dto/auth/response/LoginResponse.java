package com.qm.bookstore.qm_bookstore.dto.auth.response;

import com.qm.bookstore.qm_bookstore.dto.user.response.UserResponse;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginResponse {
    String accessToken;
    String refreshToken;
    UserResponse userResponse;
}
