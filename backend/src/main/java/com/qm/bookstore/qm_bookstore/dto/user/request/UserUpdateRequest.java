package com.qm.bookstore.qm_bookstore.dto.user.request;

import com.qm.bookstore.qm_bookstore.entity.User;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    UUID id;
    String username;
    String password;
    String fullName;
    String email;
    String phoneNumber;
    String address;
    Integer roleId;
    Boolean status;
    Integer points;
    BigDecimal balance;
    BigDecimal totalPurchase;
    User.MembershipLevel membershipLevel;
}
