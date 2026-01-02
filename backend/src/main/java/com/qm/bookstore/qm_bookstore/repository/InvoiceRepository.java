package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    
    // Find invoice by order ID
    Optional<Invoice> findByOrderId(Long orderId);
    
    // Find by invoice number
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    
    // Check if invoice exists for order
    boolean existsByOrderId(Long orderId);
    
    // Find invoices by buyer
    List<Invoice> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);
    
    // Find invoices by status
    List<Invoice> findByStatusOrderByCreatedAtDesc(String status);
    
    // Find invoices in date range
    @Query("SELECT i FROM Invoice i WHERE i.issuedAt BETWEEN :startDate AND :endDate ORDER BY i.issuedAt DESC")
    List<Invoice> findByIssuedAtBetween(@Param("startDate") LocalDateTime startDate, 
                                        @Param("endDate") LocalDateTime endDate);
    
    // Count invoices by status
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = :status")
    Long countByStatus(@Param("status") String status);
}
