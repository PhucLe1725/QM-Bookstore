package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByNameContainingIgnoreCase(String name);
    Optional<Product> findBySku(String sku);
    List<Product> findByBrandContainingIgnoreCase(String brand);
    List<Product> findBySkuContainingIgnoreCase(String sku);
    List<Product> findByAvailabilityTrue();
    boolean existsBySku(String sku);
    
    @Query("SELECT p FROM Product p WHERE p.availability = true AND p.stockQuantity > 0")
    List<Product> findAvailableProducts();
    
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.availability = true AND p.stockQuantity > 0")
    List<Product> findAvailableProductsByCategory(@Param("categoryId") Long categoryId);
    
    @Query("SELECT p FROM Product p WHERE p.stockQuantity <= p.reorderLevel AND p.reorderLevel > 0")
    List<Product> findLowStockProducts();
    
    // Paginated queries with filters
    @Query(value = "SELECT p.* FROM products p WHERE " +
           "(:name IS NULL OR CAST(p.name AS TEXT) ILIKE CONCAT('%', CAST(:name AS TEXT), '%')) AND " +
           "(:sku IS NULL OR CAST(p.sku AS TEXT) ILIKE CONCAT('%', CAST(:sku AS TEXT), '%')) AND " +
           "(:categoryId IS NULL OR p.category_id = :categoryId) AND " +
           "(:brand IS NULL OR CAST(p.brand AS TEXT) ILIKE CONCAT('%', CAST(:brand AS TEXT), '%')) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:availability IS NULL OR p.availability = :availability)", 
           countQuery = "SELECT COUNT(*) FROM products p WHERE " +
           "(:name IS NULL OR CAST(p.name AS TEXT) ILIKE CONCAT('%', CAST(:name AS TEXT), '%')) AND " +
           "(:sku IS NULL OR CAST(p.sku AS TEXT) ILIKE CONCAT('%', CAST(:sku AS TEXT), '%')) AND " +
           "(:categoryId IS NULL OR p.category_id = :categoryId) AND " +
           "(:brand IS NULL OR CAST(p.brand AS TEXT) ILIKE CONCAT('%', CAST(:brand AS TEXT), '%')) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:availability IS NULL OR p.availability = :availability)",
           nativeQuery = true)
    Page<Product> findProductsWithFilters(
            @Param("name") String name,
            @Param("sku") String sku,
            @Param("categoryId") Long categoryId,
            @Param("brand") String brand,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("availability") Boolean availability,
            Pageable pageable);
    
    @Query("SELECT COUNT(p) FROM Product p WHERE " +
           "(:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:sku IS NULL OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :sku, '%'))) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:brand IS NULL OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :brand, '%'))) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:availability IS NULL OR p.availability = :availability)")
    Long countProductsWithFilters(
            @Param("name") String name,
            @Param("sku") String sku,
            @Param("categoryId") Long categoryId,
            @Param("brand") String brand,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("availability") Boolean availability);
}
