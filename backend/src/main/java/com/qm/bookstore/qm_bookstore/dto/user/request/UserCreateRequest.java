package com.qm.bookstore.qm_bookstore.dto.user.request;

import com.qm.bookstore.qm_bookstore.entity.User;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreateRequest {
    String username;
    String password;
    String fullName;
    String email;
    String phoneNumber;
    String address;
    Integer roleId;
    Boolean status;
    Integer points;
    BigDecimal totalPurchase;
    User.MembershipLevel membershipLevel;
}
