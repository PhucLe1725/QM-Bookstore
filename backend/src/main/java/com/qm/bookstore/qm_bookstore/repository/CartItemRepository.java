package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.CartItem;
import com.qm.bookstore.qm_bookstore.entity.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.cartId = :cartId")
    List<CartItem> findByCartId(@Param("cartId") Long cartId);
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.cartId = :cartId AND ci.isSelected = true")
    List<CartItem> findSelectedItemsByCartId(@Param("cartId") Long cartId);
    
    @Query("SELECT ci FROM CartItem ci JOIN ci.cart c WHERE c.userId = :userId AND ci.isSelected = true")
    List<CartItem> findSelectedItemsByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.cartId = :cartId AND ci.productId = :productId")
    Optional<CartItem> findByCartIdAndProductId(@Param("cartId") Long cartId, @Param("productId") Long productId);
    
    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.cartId = :cartId")
    void deleteByCartId(@Param("cartId") Long cartId);
    
    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.cartId = :cartId AND ci.isSelected = true")
    void deleteSelectedItemsByCartId(@Param("cartId") Long cartId);
    
    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.cart.userId = :userId AND ci.isSelected = true")
    void deleteSelectedItemsByUserId(@Param("userId") UUID userId);
    
    boolean existsByCartIdAndProductId(Long cartId, Long productId);
    
    // New methods for combo support
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.cartId = :cartId AND ci.comboId = :comboId AND ci.itemType = 'COMBO'")
    Optional<CartItem> findByCartIdAndComboId(@Param("cartId") Long cartId, @Param("comboId") Integer comboId);
    
    @Query("SELECT ci FROM CartItem ci WHERE ci.cartId = :cartId AND ci.itemType = :itemType")
    List<CartItem> findByCartIdAndItemType(@Param("cartId") Long cartId, @Param("itemType") ItemType itemType);
    
    @Query("""
        SELECT ci FROM CartItem ci
        LEFT JOIN FETCH ci.product p
        LEFT JOIN FETCH ci.combo c
        LEFT JOIN FETCH c.comboItems citem
        LEFT JOIN FETCH citem.product
        WHERE ci.cartId = :cartId
        """)
    List<CartItem> findByCartIdWithDetails(@Param("cartId") Long cartId);
    
    boolean existsByCartIdAndComboId(Long cartId, Integer comboId);}