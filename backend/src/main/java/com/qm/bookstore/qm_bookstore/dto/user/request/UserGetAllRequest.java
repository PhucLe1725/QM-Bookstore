package com.qm.bookstore.qm_bookstore.dto.user.request;

import com.qm.bookstore.qm_bookstore.dto.base.request.BaseGetAllRequest;
import lombok.AccessLevel;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.FieldDefaults;

@Data
@EqualsAndHashCode(callSuper = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserGetAllRequest extends BaseGetAllRequest {
    String username;
    String email;
    Integer roleId;
}
