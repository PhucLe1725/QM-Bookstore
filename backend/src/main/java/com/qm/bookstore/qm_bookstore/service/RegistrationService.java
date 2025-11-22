package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.auth.request.RegisterRequest;
import com.qm.bookstore.qm_bookstore.dto.auth.request.VerifyOtpRequest;
import com.qm.bookstore.qm_bookstore.entity.PendingUser;
import com.qm.bookstore.qm_bookstore.entity.Role;
import com.qm.bookstore.qm_bookstore.entity.User;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.repository.PendingUserRepository;
import com.qm.bookstore.qm_bookstore.repository.RoleRepository;
import com.qm.bookstore.qm_bookstore.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RegistrationService {

    PendingUserRepository pendingUserRepository;
    UserRepository userRepository;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;
    EmailService emailService;

    /**
     * Step 1: Register và gửi OTP
     */
    @Transactional
    public String register(RegisterRequest request) {
        log.info("Starting registration process for email: {}", request.getEmail());

        // 1. Hash password ngay lập tức
        String passwordHash = passwordEncoder.encode(request.getPassword());

        // 2. Kiểm tra xung đột trong bảng users
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Email already exists in users table: {}", request.getEmail());
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("Username already exists in users table: {}", request.getUsername());
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }

        // 3. Generate OTP (6 digits)
        String otpCode = generateOtp();
        LocalDateTime otpExpiry = LocalDateTime.now().plusMinutes(5);

        // 4. Kiểm tra pending_users theo email
        PendingUser pendingUser = pendingUserRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (pendingUser != null) {
            // Email đã tồn tại trong pending → GHI ĐÈ
            log.info("Updating existing pending user for email: {}", request.getEmail());
            pendingUser.setUsername(request.getUsername());
            pendingUser.setPhoneNumber(request.getPhoneNumber());
            pendingUser.setPasswordHash(passwordHash);
            pendingUser.setOtpCode(otpCode);
            pendingUser.setOtpExpiry(otpExpiry);
            pendingUser.setUpdatedAt(LocalDateTime.now());
        } else {
            // Kiểm tra username trong pending_users
            if (pendingUserRepository.existsByUsername(request.getUsername())) {
                log.warn("Username already exists in pending_users table: {}", request.getUsername());
                throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
            }

            // Email chưa có → TẠO MỚI
            log.info("Creating new pending user for email: {}", request.getEmail());
            pendingUser = PendingUser.builder()
                    .email(request.getEmail())
                    .username(request.getUsername())
                    .phoneNumber(request.getPhoneNumber())
                    .passwordHash(passwordHash)
                    .otpCode(otpCode)
                    .otpExpiry(otpExpiry)
                    .build();
        }

        pendingUserRepository.save(pendingUser);

        // 5. Gửi OTP qua email (tách biệt khỏi logic lưu trữ)
        try {
            emailService.sendOtpEmail(request.getEmail(), otpCode);
            log.info("OTP sent successfully to: {}", request.getEmail());
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", request.getEmail(), e);
            // Không throw exception để không rollback transaction
            // User có thể resend OTP sau
        }

        return "OTP has been sent to your email. Please verify within 5 minutes.";
    }

    /**
     * Step 2: Verify OTP và tạo tài khoản
     */
    @Transactional
    public String verifyOtp(VerifyOtpRequest request) {
        log.info("Verifying OTP for email: {}", request.getEmail());

        // 1. Tìm pending user theo email
        PendingUser pendingUser = pendingUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("No pending registration found for email: {}", request.getEmail());
                    return new AppException(ErrorCode.PENDING_USER_NOT_FOUND);
                });

        // 2. Kiểm tra OTP hết hạn
        if (LocalDateTime.now().isAfter(pendingUser.getOtpExpiry())) {
            log.warn("OTP expired for email: {}", request.getEmail());
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }

        // 3. Kiểm tra OTP code
        if (!pendingUser.getOtpCode().equals(request.getOtpCode())) {
            log.warn("Invalid OTP code for email: {}", request.getEmail());
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        // 4. OTP hợp lệ → Tạo tài khoản thật
        Role customerRole = roleRepository.findByName("customer")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));

        User newUser = User.builder()
                .username(pendingUser.getUsername())
                .email(pendingUser.getEmail())
                .phoneNumber(pendingUser.getPhoneNumber())
                .passwordHash(pendingUser.getPasswordHash())  // Đã hash từ bước đầu
                .role(customerRole)
                .status(true)
                .build();

        userRepository.save(newUser);
        log.info("User account created successfully for: {}", pendingUser.getEmail());

        // 5. Xóa pending user
        pendingUserRepository.delete(pendingUser);
        log.info("Pending user deleted for: {}", pendingUser.getEmail());

        return "Account created successfully. You can now login.";
    }

    /**
     * Step 3: Resend OTP
     */
    @Transactional
    public String resendOtp(String email) {
        log.info("Resending OTP for email: {}", email);

        // Tìm pending user
        PendingUser pendingUser = pendingUserRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("No pending registration found for email: {}", email);
                    return new AppException(ErrorCode.PENDING_USER_NOT_FOUND);
                });

        // Generate OTP mới
        String newOtpCode = generateOtp();
        LocalDateTime newOtpExpiry = LocalDateTime.now().plusMinutes(5);

        pendingUser.setOtpCode(newOtpCode);
        pendingUser.setOtpExpiry(newOtpExpiry);
        pendingUser.setUpdatedAt(LocalDateTime.now());

        pendingUserRepository.save(pendingUser);

        // Gửi OTP mới
        try {
            emailService.sendOtpEmail(email, newOtpCode);
            log.info("New OTP sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", email, e);
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
        }

        return "New OTP has been sent to your email.";
    }

    /**
     * Generate 6-digit OTP
     */
    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);  // 100000 - 999999
        return String.valueOf(otp);
    }

    /**
     * Cleanup expired pending users (scheduled task)
     */
    @Transactional
    public void cleanupExpiredPendingUsers() {
        log.info("Cleaning up expired pending users");
        pendingUserRepository.deleteByOtpExpiryBefore(LocalDateTime.now());
    }
}
