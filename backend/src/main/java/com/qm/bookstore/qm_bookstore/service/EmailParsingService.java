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
                .orderNumber("")
                .debitAccount("")
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
                    extractDetailsFromContent(fullContent, transaction);
                }
            }
        }
        
        return transaction;
    }
    
    /**
     * Trích xuất nội dung chuyển khoản thực tế
     * Format: MBVCB.11988234142.5337BFTVG2TH3UE I.QMORD12.CT tu ...
     * → Lấy: "5337BFTVG2TH3UE I.QMORD12"
     */
    private String extractPaymentContent(String fullContent) {
        if (fullContent == null || fullContent.isEmpty()) {
            return "";
        }
        
        if (fullContent.startsWith("MBVCB.")) {
            int firstDot = fullContent.indexOf(".", 6);
            if (firstDot != -1) {
                int secondDot = fullContent.indexOf(".", firstDot + 1);
                if (secondDot != -1) {
                    int ctTuIndex = fullContent.indexOf(".CT tu");
                    if (ctTuIndex != -1 && ctTuIndex > secondDot) {
                        return fullContent.substring(secondDot + 1, ctTuIndex).trim();
                    }
                }
            }
        }
        
        return fullContent;
    }
    
    /**
     * Extract chi tiết từ nội dung đầy đủ
     */
    private void extractDetailsFromContent(String content, Transaction transaction) {
        if (content == null || content.isEmpty()) return;
        
        // Extract tài khoản gửi (sau "CT tu")
        int fromIndex = content.indexOf("CT tu ");
        if (fromIndex != -1) {
            String remaining = content.substring(fromIndex);
            String[] parts = remaining.split("\\s+");
            for (int i = 0; i < parts.length; i++) {
                String part = parts[i].replaceAll("[^0-9]", "");
                if (part.length() >= 8 && part.length() <= 20) {
                    transaction.setDebitAccount(part);
                    
                    StringBuilder senderName = new StringBuilder();
                    for (int j = i + 1; j < parts.length && !parts[j].equals("toi"); j++) {
                        senderName.append(parts[j]).append(" ");
                    }
                    transaction.setRemitterName(senderName.toString().trim());
                    break;
                }
            }
        }
        
        // Extract mã giao dịch MBVCB
        if (content.startsWith("MBVCB.")) {
            int dotIndex = content.indexOf(".", 6);
            if (dotIndex != -1) {
                transaction.setOrderNumber(content.substring(0, dotIndex));
            }
        }
        
        transaction.setBeneficiaryBank("Sacombank");
        
        // Extract beneficiary name
        int toIndex = content.indexOf("toi ");
        if (toIndex != -1) {
            String afterTo = content.substring(toIndex + 4);
            String[] parts = afterTo.split("\\s+");
            boolean foundAccount = false;
            StringBuilder beneficiaryName = new StringBuilder();
            for (String part : parts) {
                String digits = part.replaceAll("[^0-9]", "");
                if (!foundAccount && digits.length() >= 8) {
                    foundAccount = true;
                    continue;
                }
                if (foundAccount && !part.equals("tai")) {
                    beneficiaryName.append(part).append(" ");
                } else if (part.equals("tai")) {
                    break;
                }
            }
            transaction.setBeneficiaryName(beneficiaryName.toString().trim());
        }
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
                // Try next format
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
            String data = transaction.getTransactionDate().toString() + 
                         transaction.getAmount().toString() + 
                         transaction.getDebitAccount() + 
                         transaction.getCreditAccount();
            
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
