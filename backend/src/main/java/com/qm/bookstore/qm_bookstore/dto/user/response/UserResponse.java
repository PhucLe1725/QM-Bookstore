package com.qm.bookstore.qm_bookstore.dto.user.response;

import com.qm.bookstore.qm_bookstore.entity.User;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    UUID id;
    String username;
    String fullName;
    String email;
    String phoneNumber;
    String address;
    Integer roleId;
    String roleName;
    Boolean status;
    Integer points;
    BigDecimal balance;
    BigDecimal totalPurchase;
    User.MembershipLevel membershipLevel;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
