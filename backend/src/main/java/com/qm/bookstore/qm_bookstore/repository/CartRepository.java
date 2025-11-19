package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    
    @Query("SELECT c FROM Cart c WHERE c.userId = :userId")
    Optional<Cart> findByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT c FROM Cart c WHERE c.sessionId = :sessionId")
    Optional<Cart> findBySessionId(@Param("sessionId") String sessionId);
    
    boolean existsByUserId(UUID userId);
    
    boolean existsBySessionId(String sessionId);
}
