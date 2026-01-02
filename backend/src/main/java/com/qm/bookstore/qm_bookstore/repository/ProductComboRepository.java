package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.ProductCombo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductComboRepository extends JpaRepository<ProductCombo, Integer> {
    
    /**
     * Tìm combo theo availability status
     */
    List<ProductCombo> findByAvailability(Boolean availability);
    
    Page<ProductCombo> findByAvailability(Boolean availability, Pageable pageable);
    
    /**
     * Tìm combo theo tên (case-insensitive, contains)
     */
    @Query("SELECT pc FROM ProductCombo pc WHERE LOWER(pc.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<ProductCombo> searchByName(@Param("name") String name);
    
    Page<ProductCombo> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    /**
     * Tìm combo có chứa product cụ thể
     */
    @Query("SELECT DISTINCT pc FROM ProductCombo pc " +
           "JOIN pc.comboItems ci " +
           "WHERE ci.product.id = :productId")
    List<ProductCombo> findByProductId(@Param("productId") Long productId);
    
    /**
     * Tìm combo với items được join (fetch eagerly)
     */
    @Query("SELECT pc FROM ProductCombo pc " +
           "LEFT JOIN FETCH pc.comboItems " +
           "WHERE pc.id = :id")
    Optional<ProductCombo> findByIdWithItems(@Param("id") Integer id);
    
    /**
     * Đếm số combo available
     */
    long countByAvailability(Boolean availability);
    
    /**
     * Kiểm tra tên combo đã tồn tại chưa
     */
    boolean existsByName(String name);
    
    boolean existsByNameAndIdNot(String name, Integer id);
}
