package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.PendingUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PendingUserRepository extends JpaRepository<PendingUser, UUID> {
    
    Optional<PendingUser> findByEmail(String email);
    
    Optional<PendingUser> findByUsername(String username);
    
    boolean existsByEmail(String email);
    
    boolean existsByUsername(String username);
    
    // Xóa các pending users đã hết hạn OTP
    void deleteByOtpExpiryBefore(LocalDateTime dateTime);
}
