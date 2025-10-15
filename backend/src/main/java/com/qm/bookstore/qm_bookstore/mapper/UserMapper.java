package com.qm.bookstore.qm_bookstore.mapper;

import com.qm.bookstore.qm_bookstore.dto.user.request.UserCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.user.request.UserUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.user.response.UserResponse;
import com.qm.bookstore.qm_bookstore.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "passwordHash", source = "password")
    User toUser(UserCreateRequest request);


    @Mapping(source = "role.id", target = "roleId")
    @Mapping(source = "role.name", target = "roleName")
    UserResponse toUserResponse(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "passwordHash", source = "password")
    @Mapping(target = "role", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
    
}
