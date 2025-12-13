package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.role.request.RoleCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.role.request.RoleUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.role.response.RoleResponse;
import com.qm.bookstore.qm_bookstore.entity.Role;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.mapper.RoleMapper;
import com.qm.bookstore.qm_bookstore.repository.RoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RoleService {
    
    RoleRepository roleRepository;
    RoleMapper roleMapper;
    
    /**
     * Lấy tất cả roles
     */
    public List<RoleResponse> getAllRoles() {
        log.info("[getAllRoles] Getting all roles");
        return roleRepository.findAll().stream()
                .map(roleMapper::toRoleResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy role theo ID
     */
    public RoleResponse getRoleById(Integer id) {
        log.info("[getRoleById] Getting role by id: {}", id);
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));
        return roleMapper.toRoleResponse(role);
    }
    
    /**
     * Lấy role theo name
     */
    public RoleResponse getRoleByName(String name) {
        log.info("[getRoleByName] Getting role by name: {}", name);
        Role role = roleRepository.findByName(name)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));
        return roleMapper.toRoleResponse(role);
    }
    
    /**
     * Tạo role mới
     */
    @Transactional
    public RoleResponse createRole(RoleCreateRequest request) {
        log.info("[createRole] Creating role with name: {}", request.getName());
        
        // Kiểm tra role đã tồn tại chưa
        if (roleRepository.findByName(request.getName()).isPresent()) {
            throw new AppException(ErrorCode.ROLE_EXISTED);
        }
        
        Role role = roleMapper.toRole(request);
        role = roleRepository.save(role);
        
        log.info("[createRole] Created role with id: {}", role.getId());
        return roleMapper.toRoleResponse(role);
    }
    
    /**
     * Cập nhật role
     */
    @Transactional
    public RoleResponse updateRole(Integer id, RoleUpdateRequest request) {
        log.info("[updateRole] Updating role id: {}", id);
        
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));
        
        // Kiểm tra tên mới có trùng với role khác không
        roleRepository.findByName(request.getName()).ifPresent(existingRole -> {
            if (!existingRole.getId().equals(id)) {
                throw new AppException(ErrorCode.ROLE_EXISTED);
            }
        });
        
        roleMapper.updateRole(role, request);
        role = roleRepository.save(role);
        
        log.info("[updateRole] Updated role id: {}", id);
        return roleMapper.toRoleResponse(role);
    }
    
    /**
     * Xóa role
     */
    @Transactional
    public void deleteRole(Integer id) {
        log.info("[deleteRole] Deleting role id: {}", id);
        
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));
        
        // Kiểm tra role có đang được sử dụng không
        // Note: Nếu có foreign key constraint, sẽ throw exception khi xóa
        roleRepository.delete(role);
        
        log.info("[deleteRole] Deleted role id: {}", id);
    }
}
