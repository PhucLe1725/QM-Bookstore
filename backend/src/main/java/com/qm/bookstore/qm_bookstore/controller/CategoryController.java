package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.category.CategoryDTO;
import com.qm.bookstore.qm_bookstore.dto.category.CategoryTreeDTO;
import com.qm.bookstore.qm_bookstore.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    
    private final CategoryService categoryService;
    
    /**
     * GET /api/categories/tree
     * Returns hierarchical tree structure for mega-menu
     * Only includes: id, name, slug, children
     */
    @GetMapping("/tree")
    public ResponseEntity<List<CategoryTreeDTO>> getCategoryTree() {
        List<CategoryTreeDTO> tree = categoryService.getCategoryTree();
        return ResponseEntity.ok(tree);
    }
    
    /**
     * GET /api/categories?parent_id={id|null}
     * Returns flat list of direct children
     * - No parent_id → returns root categories (parent_id IS NULL)
     * - With parent_id → returns direct children of that category
     */
    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getCategoriesByParent(
            @RequestParam(required = false) Long parent_id
    ) {
        List<CategoryDTO> categories = categoryService.getCategoriesByParent(parent_id);
        return ResponseEntity.ok(categories);
    }
    
    /**
     * GET /api/categories/{id}
     * Get single category by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long id) {
        CategoryDTO category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(category);
    }
    
    /**
     * GET /api/categories/slug/{slug}
     * Get category by slug (for URL routing)
     */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<CategoryDTO> getCategoryBySlug(@PathVariable String slug) {
        CategoryDTO category = categoryService.getCategoryBySlug(slug);
        return ResponseEntity.ok(category);
    }
    
    /**
     * GET /api/categories/all
     * Get all categories as flat list (for admin/management)
     */
    @GetMapping("/all")
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        List<CategoryDTO> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
}
