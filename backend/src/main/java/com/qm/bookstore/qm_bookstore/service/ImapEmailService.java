package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.entity.Transaction;
import jakarta.mail.*;
import jakarta.mail.internet.MimeMultipart;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

@Slf4j
@Service
public class ImapEmailService {
    
    @Value("${spring.mail.username}")
    private String username;
    
    @Value("${spring.mail.password}")
    private String password;
    
    @Autowired
    private EmailParsingService emailParsingService;
    
    /**
     * Fetch emails từ Gmail IMAP
     */
    public List<Transaction> fetchEmailsFromInbox(int maxEmails) throws Exception {
        List<Transaction> transactions = new ArrayList<>();
        
        Properties properties = new Properties();
        properties.put("mail.store.protocol", "imaps");
        properties.put("mail.imap.host", "imap.gmail.com");
        properties.put("mail.imap.port", "993");
        properties.put("mail.imap.ssl.enable", "true");
        properties.put("mail.imap.connectiontimeout", "10000");
        properties.put("mail.imap.timeout", "10000");
        
        Session session = Session.getInstance(properties);
        Store store = null;
        Folder inbox = null;
        
        try {
            store = session.getStore("imaps");
            log.info("Connecting to Gmail IMAP with user: {}", username);
            store.connect("imap.gmail.com", username, password);
            
            // Mở inbox với READ_WRITE để mark email as SEEN
            inbox = store.getFolder("INBOX");
            inbox.open(Folder.READ_WRITE);
            
            Message[] messages = inbox.getMessages();
            int count = Math.min(maxEmails, messages.length);
            
            log.info("Found {} messages in inbox, processing last {}", messages.length, count);
            
            // Đọc từ email mới nhất
            for (int i = messages.length - 1; i >= messages.length - count && i >= 0; i--) {
                Message message = messages[i];
                
                // Get sender info
                String from = message.getFrom()[0].toString();
                String subject = message.getSubject() != null ? message.getSubject() : "";
                
                // Filter: Chỉ lấy email thông báo giao dịch từ sacombank
                boolean isBankNotification = from.toLowerCase().contains("sacombank");
                if (isBankNotification) {
                    
                    // Check email đã đọc chưa
                    if (message.isSet(Flags.Flag.SEEN)) {
                        log.info("⏭️ Skipping already processed email from: {}", from);
                        continue;
                    }
                    
                    try {
                        log.info("📧 Processing email from: {} | Subject: {}", from, subject);
                        String htmlContent = getHtmlFromMessage(message);
                        Transaction transaction = emailParsingService.parseHtmlContent(htmlContent);
                        
                        // Check logic lọc: Chỉ lấy giao dịch có QMORD pattern (chuyển vào)
                        if (transaction.getPaymentDetails() != null && 
                            transaction.getPaymentDetails().toUpperCase().matches(".*QMORD\\d+.*")) {
                            transactions.add(transaction);
                            log.info("✅ Added transaction with payment content: {}", 
                                    transaction.getPaymentDetails().substring(0, 
                                    Math.min(50, transaction.getPaymentDetails().length())));
                        } else {
                            log.info("⏭️ Skipping transaction (no QMORD pattern in payment details)");
                        }
                        
                        // Mark as SEEN
                        message.setFlag(Flags.Flag.SEEN, true);
                        log.info("✅ Marked email as SEEN");
                        
                    } catch (Exception e) {
                        log.error("❌ Error parsing email from {}: {}", from, e.getMessage(), e);
                    }
                } else {
                    // Skip non-bank emails
                    log.debug("⏭️ Skipping non-bank email from: {}", from);
                }
            }
            
            log.info("Successfully processed {} transactions", transactions.size());
            
        } catch (MessagingException e) {
            log.error("Failed to fetch emails from IMAP: {}", e.getMessage(), e);
            throw new Exception("Failed to connect to email server: " + e.getMessage(), e);
        } finally {
            if (inbox != null && inbox.isOpen()) {
                inbox.close(false);
            }
            if (store != null && store.isConnected()) {
                store.close();
            }
        }
        
        return transactions;
    }
    
    /**
     * Extract HTML từ email message
     */
    private String getHtmlFromMessage(Message message) throws MessagingException, IOException {
        Object content = message.getContent();
        
        if (content instanceof String) {
            return (String) content;
        } else if (content instanceof MimeMultipart) {
            return getHtmlFromMimeMultipart((MimeMultipart) content);
        }
        
        return "";
    }
    
    private String getHtmlFromMimeMultipart(MimeMultipart mimeMultipart) throws MessagingException, IOException {
        StringBuilder result = new StringBuilder();
        int count = mimeMultipart.getCount();
        
        for (int i = 0; i < count; i++) {
            BodyPart bodyPart = mimeMultipart.getBodyPart(i);
            
            if (bodyPart.isMimeType("text/html")) {
                result.append(bodyPart.getContent().toString());
            } else if (bodyPart.getContent() instanceof MimeMultipart) {
                result.append(getHtmlFromMimeMultipart((MimeMultipart) bodyPart.getContent()));
            }
        }
        
        return result.toString();
    }
}
