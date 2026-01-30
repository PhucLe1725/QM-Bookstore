package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.entity.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Slf4j
@Service
public class EmailParsingService {
    
    private static final DateTimeFormatter[] DATE_FORMATTERS = {
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"),
        DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")
    };
    
    /**
     * Parse HTML content và trích xuất transaction
     */
    public Transaction parseHtmlContent(String htmlContent) throws Exception {
        Document doc = Jsoup.parse(htmlContent);
        Transaction transaction = extractTransactionData(doc);
        transaction.setFingerprint(generateFingerprint(transaction));
        return transaction;
    }
    
    /**
     * Trích xuất dữ liệu từ HTML table (Sacombank format)
     */
    private Transaction extractTransactionData(Document doc) {
        Transaction transaction = Transaction.builder()
                .amount(BigDecimal.ZERO)
                .transactionDate(LocalDateTime.now())
                .creditAccount("")
                .build();
        
        Elements rows = doc.select("table tr");
        
        for (Element row : rows) {
            Elements cells = row.select("td");
            if (cells.size() >= 2) {
                String label = cells.get(0).text().trim();
                String value = cells.get(1).text().trim();
                
                // Parse theo format Sacombank
                if (label.contains("Tài khoản") && label.contains("Account") && !label.contains("Loại")) {
                    transaction.setCreditAccount(cleanAccountNumber(value));
                }
                else if (label.contains("Ngày") && label.contains("Date")) {
                    transaction.setTransactionDate(parseDateTime(value));
                }
                else if (label.contains("Phát sinh") && label.contains("Transaction")) {
                    BigDecimal amount = parseAmount(value);
                    if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                        transaction.setAmount(amount);
                    }
                }
                else if (label.contains("Nội dung") && label.contains("Description")) {
                    String fullContent = cleanContent(value);
                    String paymentContent = extractPaymentContent(fullContent);
                    transaction.setPaymentDetails(paymentContent);
                }
            }
        }
        
        return transaction;
    }
    
    /**
     * Trích xuất nội dung chuyển khoản (Tất cả ngân hàng)
     */
    private String extractPaymentContent(String fullContent) {
        if (fullContent == null || fullContent.isEmpty()) {
            return "";
        }
        
        // Clean content: remove extra spaces, normalize
        String cleaned = fullContent.trim().replaceAll("\\s+", " ");
        
        // Log để debug
        log.info("📝 Processing payment content: {}", 
                cleaned.substring(0, Math.min(100, cleaned.length())));
        
        // Detect if content contains QMORD pattern (order code)
        boolean hasOrderCode = cleaned.toUpperCase().matches(".*QMORD\\d+.*");
        
        if (!hasOrderCode) {
            // Không có QMORD -> Có thể là giao dịch đi ra
            log.warn("⚠️ Payment content does not contain QMORD pattern: {}", 
                    cleaned.substring(0, Math.min(50, cleaned.length())));
        } else {
            log.info("✅ Found QMORD pattern in content");
        }
        
        log.info("✅ Returning full content (length: {})", cleaned.length());
        
        return cleaned;
    }
    
    /**
     * Parse datetime
     */
    private LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isEmpty()) {
            return LocalDateTime.now();
        }
        
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDateTime.parse(dateTimeStr, formatter);
            } catch (DateTimeParseException e) {
            }
        }
        
        log.warn("Failed to parse date: {}, using current time", dateTimeStr);
        return LocalDateTime.now();
    }
    
    /**
     * Parse amount
     */
    private BigDecimal parseAmount(String amountStr) {
        if (amountStr == null || amountStr.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        String cleaned = amountStr.replaceAll("[^0-9.,]", "").replace(",", "");
        
        try {
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            log.warn("Failed to parse amount: {}", amountStr);
            return BigDecimal.ZERO;
        }
    }
    
    /**
     * Clean account number
     */
    private String cleanAccountNumber(String account) {
        if (account == null) return "";
        return account.replaceAll("[^0-9]", "");
    }
    
    /**
     * Clean content
     */
    private String cleanContent(String content) {
        if (content == null) return "";
        return content.trim().replaceAll("\\s+", " ");
    }
    
    /**
     * Generate SHA-256 fingerprint
     */
    public String generateFingerprint(Transaction transaction) {
        try {
            // Fingerprint = SHA256(transactionDate + amount + creditAccount + paymentDetails)
            // Đảm bảo unique cho mỗi giao dịch
            String data = transaction.getTransactionDate().toString() + 
                         transaction.getAmount().toString() + 
                         transaction.getCreditAccount() + 
                         (transaction.getPaymentDetails() != null ? 
                          transaction.getPaymentDetails().substring(0, Math.min(50, transaction.getPaymentDetails().length())) : "");
            
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
}
