package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.ProductComboItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductComboItemRepository extends JpaRepository<ProductComboItem, Integer> {
    
    /**
     * Tìm tất cả items của một combo
     */
    List<ProductComboItem> findByComboId(Integer comboId);
    
    /**
     * Tìm tất cả combos chứa product cụ thể
     */
    List<ProductComboItem> findByProductId(Long productId);
    
    /**
     * Tìm item cụ thể trong combo
     */
    Optional<ProductComboItem> findByComboIdAndProductId(Integer comboId, Long productId);
    
    /**
     * Kiểm tra product đã có trong combo chưa
     */
    boolean existsByComboIdAndProductId(Integer comboId, Long productId);
    
    /**
     * Xóa tất cả items của combo
     */
    @Modifying
    @Query("DELETE FROM ProductComboItem pci WHERE pci.combo.id = :comboId")
    void deleteByComboId(@Param("comboId") Integer comboId);
    
    /**
     * Đếm số products trong combo
     */
    long countByComboId(Integer comboId);
}
