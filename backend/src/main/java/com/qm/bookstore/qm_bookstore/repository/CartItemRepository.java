package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.cartId = :cartId")
    List<CartItem> findByCartId(@Param("cartId") Long cartId);
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.cartId = :cartId AND ci.isSelected = true")
    List<CartItem> findSelectedItemsByCartId(@Param("cartId") Long cartId);
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.cartId = :cartId AND ci.productId = :productId")
    Optional<CartItem> findByCartIdAndProductId(@Param("cartId") Long cartId, @Param("productId") Long productId);
    
    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.cartId = :cartId")
    void deleteByCartId(@Param("cartId") Long cartId);
    
    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.cartId = :cartId AND ci.isSelected = true")
    void deleteSelectedItemsByCartId(@Param("cartId") Long cartId);
    
    boolean existsByCartIdAndProductId(Long cartId, Long productId);
}
