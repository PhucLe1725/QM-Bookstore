package com.qm.bookstore.qm_bookstore.dto.user.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserProfileUpdateRequest {
    String fullName;
    String phoneNumber;
    String address;
    String email;
}
