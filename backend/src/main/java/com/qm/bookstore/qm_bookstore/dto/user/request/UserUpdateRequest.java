package com.qm.bookstore.qm_bookstore.dto.user.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    UUID id;
    String username;
    String password;
    String email;
    Integer roleId;
}
