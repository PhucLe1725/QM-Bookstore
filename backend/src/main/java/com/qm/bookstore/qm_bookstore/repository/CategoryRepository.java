package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByName(String name);

    // Find all active categories ordered by id
    List<Category> findByStatusTrueOrderByIdAsc();

    // Find ALL categories (including inactive) ordered by id - for admin
    List<Category> findAllByOrderByIdAsc();

    // Find root categories (parent_id is null)
    List<Category> findByParentIdIsNullAndStatusTrueOrderByIdAsc();

    // Find direct children of a category
    List<Category> findByParentIdAndStatusTrueOrderByIdAsc(Long parentId);

    // Find by slug
    Category findBySlug(String slug);

    // Check if name exists excluding specific ID (for update)
    boolean existsByNameAndIdNot(String name, Long id);

    // Check if slug exists excluding specific ID (for update)
    boolean existsBySlugAndIdNot(String slug, Long id);

    // Count direct children
    long countByParentId(Long parentId);

    // Find all children (direct only)
    List<Category> findByParentId(Long parentId);

    // Count products by category
    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.id = :categoryId")
    long countProductsByCategoryId(@Param("categoryId") Long categoryId);

    // Get all descendants recursively (PostgreSQL CTE)
    @Query(value = "WITH RECURSIVE category_tree AS ( " +
            "SELECT id, parent_id FROM categories WHERE id = :categoryId " +
            "UNION ALL " +
            "SELECT c.id, c.parent_id FROM categories c " +
            "INNER JOIN category_tree ct ON c.parent_id = ct.id " +
            ") SELECT id FROM category_tree WHERE id != :categoryId", nativeQuery = true)
    List<Long> findAllDescendantIds(@Param("categoryId") Long categoryId);
}
