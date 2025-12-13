package com.qm.bookstore.qm_bookstore.mapper;

import com.qm.bookstore.qm_bookstore.dto.role.request.RoleCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.role.request.RoleUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.role.response.RoleResponse;
import com.qm.bookstore.qm_bookstore.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    
    RoleResponse toRoleResponse(Role role);
    
    Role toRole(RoleCreateRequest request);
    
    void updateRole(@MappingTarget Role role, RoleUpdateRequest request);
}
