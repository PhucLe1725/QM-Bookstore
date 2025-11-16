package com.qm.bookstore.qm_bookstore.service;


import com.qm.bookstore.qm_bookstore.dto.base.response.BaseGetAllResponse;
import com.qm.bookstore.qm_bookstore.dto.user.request.UserCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.user.request.UserProfileUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.user.request.UserUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.user.response.UserResponse;
import com.qm.bookstore.qm_bookstore.entity.Role;
import com.qm.bookstore.qm_bookstore.entity.User;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.mapper.UserMapper;
import com.qm.bookstore.qm_bookstore.repository.RoleRepository;
import com.qm.bookstore.qm_bookstore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;



@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
@Slf4j
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private RoleRepository roleRepository;

    public UserResponse getUserById(UUID userId) {
        return userRepository.findById(userId)
                .map(userMapper::toUserResponse)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public UserResponse getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(userMapper::toUserResponse)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public BaseGetAllResponse<UserResponse> getAllUsers() {
        List<UserResponse> userResponses = userRepository.findAllUsers()
                .stream()
                .map(userMapper::toUserResponse)
                .toList();

        return BaseGetAllResponse.<UserResponse>builder()
                .data(userResponses)
                .totalRecords(userRepository.getTotalRecords())
                .build();
    }

    public BaseGetAllResponse<UserResponse> getAllUsersWithSortAndPaging(Integer skipCount, 
                                                                        Integer maxResultCount,
                                                                        String sortBy,
                                                                        String sortDirection) {
        List<UserResponse> userResponses = userRepository.findAllUsersWithSortAndLimit(
                skipCount, maxResultCount, sortBy, sortDirection)
                .stream()
                .map(userMapper::toUserResponse)
                .toList();

        return BaseGetAllResponse.<UserResponse>builder()
                .data(userResponses)
                .totalRecords(userRepository.getTotalRecords())
                .build();
    }

    public UserResponse createUser(UserCreateRequest request) {
        User user = userMapper.toUser(request);
    
        user.setPasswordHash(new BCryptPasswordEncoder().encode(request.getPassword()));
        
        if (request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));
            user.setRole(role);
        } else {
            user.setRole(roleRepository.findByName("customer")
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED)));
        }

        // Set default values if not provided
        if (user.getStatus() == null) {
            user.setStatus(true);
        }
        if (user.getPoints() == null) {
            user.setPoints(0);
        }
        if (user.getBalance() == null) {
            user.setBalance(BigDecimal.ZERO);
        }
        if (user.getTotalPurchase() == null) {
            user.setTotalPurchase(BigDecimal.ZERO);
        }
        if (user.getMembershipLevel() == null) {
            user.setMembershipLevel(User.MembershipLevel.BASIC);
        }

        LocalDateTime now = LocalDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        
        user = userRepository.save(user);
        return userMapper.toUserResponse(user);
    }

    public UserResponse updateUser(UserUpdateRequest request) {
        User user = userRepository.findById(request.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        if (request.getUsername() != null) {
            user.setUsername(request.getUsername());
        }
        
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPasswordHash(new BCryptPasswordEncoder().encode(request.getPassword()));
        }
        
        if (request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));
            user.setRole(role);
        }
        
        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }
        
        if (request.getPoints() != null) {
            user.setPoints(request.getPoints());
        }
        
        if (request.getBalance() != null) {
            user.setBalance(request.getBalance());
        }
        
        if (request.getTotalPurchase() != null) {
            user.setTotalPurchase(request.getTotalPurchase());
        }
        
        if (request.getMembershipLevel() != null) {
            user.setMembershipLevel(request.getMembershipLevel());
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        return userMapper.toUserResponse(user);
    }

    public void deleteUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        userRepository.delete(user);
    }

    public UserResponse updateProfile(UUID userId, UserProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // Only update allowed fields
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        return userMapper.toUserResponse(user);
    }

    public UserResponse getMyProfile(String username) {
        return userRepository.findByUsername(username)
                .map(userMapper::toUserResponse)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }


}
