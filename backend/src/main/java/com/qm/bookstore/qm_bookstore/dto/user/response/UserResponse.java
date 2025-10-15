package com.qm.bookstore.qm_bookstore.dto.user.response;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    UUID id;
    String username;
    String email;
    Long roleId;
    String roleName;
    OffsetDateTime createdAt;
    OffsetDateTime updatedAt;
}
