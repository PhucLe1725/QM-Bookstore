package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.transaction.response.ConfirmPaymentResponse;
import com.qm.bookstore.qm_bookstore.dto.transaction.response.TransactionResponse;
import com.qm.bookstore.qm_bookstore.dto.transaction.response.VerifyTransactionResponse;
import com.qm.bookstore.qm_bookstore.entity.Order;
import com.qm.bookstore.qm_bookstore.entity.Transaction;
import com.qm.bookstore.qm_bookstore.entity.User;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.mapper.TransactionMapper;
import com.qm.bookstore.qm_bookstore.repository.OrderRepository;
import com.qm.bookstore.qm_bookstore.repository.TransactionRepository;
import com.qm.bookstore.qm_bookstore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

        private final TransactionRepository transactionRepository;
        private final TransactionMapper transactionMapper;
        private final ImapEmailService imapEmailService;
        private final OrderRepository orderRepository;
        private final UserRepository userRepository;
        private final UserService userService;

        private final SystemConfigService systemConfigService;

        // Removed @Value fields as they are now loaded dynamically from
        // SystemConfigService

        /**
         * Fetch emails và lưu transactions
         */
        @Transactional
        public List<TransactionResponse> fetchFromEmail(Integer maxEmails) {
                try {
                        log.info("[fetchFromEmail] Fetching max {} emails", maxEmails);

                        List<Transaction> transactions = imapEmailService.fetchEmailsFromInbox(maxEmails);
                        List<Transaction> savedTransactions = new ArrayList<>();

                        for (Transaction transaction : transactions) {
                                // Check duplicate by fingerprint
                                if (!transactionRepository.existsByFingerprint(transaction.getFingerprint())) {
                                        Transaction saved = transactionRepository.save(transaction);
                                        savedTransactions.add(saved);
                                        log.info("[fetchFromEmail] Saved new transaction: {}", saved.getId());
                                } else {
                                        log.info("[fetchFromEmail] Duplicate transaction ignored: {}",
                                                        transaction.getFingerprint());
                                }
                        }

                        return savedTransactions.stream()
                                        .map(transactionMapper::toTransactionResponse)
                                        .collect(Collectors.toList());

                } catch (Exception e) {
                        log.error("[fetchFromEmail] Error: {}", e.getMessage(), e);
                        throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
                }
        }

        /**
         * Verify transaction với order
         */
        @Transactional
        public VerifyTransactionResponse verifyTransaction(Long transactionId, BigDecimal expectedAmount,
                        String orderCode) {
                log.info("[verifyTransaction] Verifying transaction {} for order {} with amount {}",
                                transactionId, orderCode, expectedAmount);

                Transaction transaction = transactionRepository.findById(transactionId)
                                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

                // Check already verified
                if (transaction.getVerified()) {
                        return VerifyTransactionResponse.builder()
                                        .verified(false)
                                        .transactionId(transactionId)
                                        .message("Transaction already verified")
                                        .build();
                }

                // Check timeout (24h)
                int timeoutHours = systemConfigService.getConfigValueAsInt("transaction_timeout_hours", 24);
                if (isTransactionExpired(transaction, timeoutHours)) {
                        return VerifyTransactionResponse.builder()
                                        .verified(false)
                                        .transactionId(transactionId)
                                        .message("Transaction expired (over " + timeoutHours + " hours)")
                                        .build();
                }

                // Check credit account
                String businessAccount = systemConfigService.getConfigValue("vietqr_account_no", "17251725");
                if (!businessAccount.equals(transaction.getCreditAccount())) {
                        return VerifyTransactionResponse.builder()
                                        .verified(false)
                                        .transactionId(transactionId)
                                        .message("Wrong credit account")
                                        .build();
                }
                // Check amount
                if (transaction.getAmount().compareTo(expectedAmount) != 0) {
                        return VerifyTransactionResponse.builder()
                                        .verified(false)
                                        .transactionId(transactionId)
                                        .message("Amount mismatch")
                                        .build();
                }

                // Check order code in payment details
                if (transaction.getPaymentDetails() == null ||
                                !transaction.getPaymentDetails().toUpperCase().contains(orderCode.toUpperCase())) {
                        return VerifyTransactionResponse.builder()
                                        .verified(false)
                                        .transactionId(transactionId)
                                        .message("Order code not found in payment details")
                                        .build();
                }

                // All checks passed - mark as verified
                transaction.setVerified(true);
                transactionRepository.save(transaction);

                log.info("[verifyTransaction] Transaction {} verified successfully", transactionId);

                return VerifyTransactionResponse.builder()
                                .verified(true)
                                .transactionId(transactionId)
                                .message("Transaction verified successfully")
                                .build();
        }

        /**
         * Search transactions by order code
         */
        public List<TransactionResponse> searchByOrderCode(String orderCode) {
                log.info("[searchByOrderCode] Searching for order code: {}", orderCode);

                List<Transaction> transactions = transactionRepository
                                .findByPaymentDetailsContainingIgnoreCase(orderCode);

                return transactions.stream()
                                .map(transactionMapper::toTransactionResponse)
                                .collect(Collectors.toList());
        }

        /**
         * Get all transactions
         */
        public List<TransactionResponse> getAllTransactions() {
                return transactionRepository.findAll().stream()
                                .map(transactionMapper::toTransactionResponse)
                                .collect(Collectors.toList());
        }

        /**
         * Check if transaction expired
         */

        private boolean isTransactionExpired(Transaction transaction) {
                int timeoutHours = systemConfigService.getConfigValueAsInt("transaction_timeout_hours", 24);
                return isTransactionExpired(transaction, timeoutHours);
        }

        private boolean isTransactionExpired(Transaction transaction, int timeoutHours) {
                Duration duration = Duration.between(transaction.getTransactionDate(), LocalDateTime.now());
                return duration.toHours() > timeoutHours;
        }

        /**
         * Confirm payment for order
         */
        @Transactional
        public ConfirmPaymentResponse confirmPayment(Long transactionId, Long orderId,
                        BigDecimal transactionAmount) {
                log.info("[confirmPayment] Confirming payment - TransactionId: {}, OrderId: {}, Amount: {}",
                                transactionId, orderId, transactionAmount);

                Transaction transaction = transactionRepository.findById(transactionId)
                                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

                // Check if already verified/confirmed
                if (transaction.getVerified()) {
                        throw new AppException(ErrorCode.PAYMENT_ALREADY_CONFIRMED);
                }

                // Generate transfer content based on orderId (QMORD<orderId>)
                String expectedTransferContent = "QMORD" + orderId;

                // Check if payment details contain the order code
                if (transaction.getPaymentDetails() == null ||
                                !transaction.getPaymentDetails().toUpperCase()
                                                .contains(expectedTransferContent.toUpperCase())) {
                        return ConfirmPaymentResponse.builder()
                                        .confirmed(false)
                                        .transactionId(transactionId)
                                        .orderId(orderId)
                                        .message("Order code not found in payment details")
                                        .build();
                }

                // Check amount
                if (transaction.getAmount().compareTo(transactionAmount) != 0) {
                        return ConfirmPaymentResponse.builder()
                                        .confirmed(false)
                                        .transactionId(transactionId)
                                        .orderId(orderId)
                                        .message("Amount mismatch")
                                        .build();
                }

                // Check credit account
                String businessAccount = systemConfigService.getConfigValue("vietqr_account_no", "17251725");
                if (!businessAccount.equals(transaction.getCreditAccount())) {
                        return ConfirmPaymentResponse.builder()
                                        .confirmed(false)
                                        .transactionId(transactionId)
                                        .orderId(orderId)
                                        .message("Invalid credit account")
                                        .build();
                }
                // Update transaction
                transaction.setVerified(true);
                transactionRepository.save(transaction);

                // Cập nhật totalPurchase và membership level khi thanh toán QR thành công
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

                User user = userRepository.findById(order.getUserId())
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                BigDecimal currentTotal = user.getTotalPurchase() != null ? user.getTotalPurchase() : BigDecimal.ZERO;
                BigDecimal newTotal = currentTotal.add(order.getTotalAmount());
                user.setTotalPurchase(newTotal);

                // Tự động nâng cấp membership level
                userService.updateMembershipLevel(user);

                userRepository.save(user);

                log.info("[confirmPayment] Updated totalPurchase for user {}: {} -> {} and membership level: {}",
                                user.getId(), currentTotal, newTotal, user.getMembershipLevel());

                log.info("[confirmPayment] Payment confirmed successfully for order {}", orderId);

                return ConfirmPaymentResponse.builder()
                                .confirmed(true)
                                .transactionId(transactionId)
                                .orderId(orderId)
                                .message("Payment confirmed successfully")
                                .build();
        }
}
