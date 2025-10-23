package com.qm.bookstore.qm_bookstore.dto.user.request;

import com.qm.bookstore.qm_bookstore.dto.base.request.BaseGetAllRequest;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserGetAllRequest extends BaseGetAllRequest {
    String username;
    String email;
    Integer roleId;
}
