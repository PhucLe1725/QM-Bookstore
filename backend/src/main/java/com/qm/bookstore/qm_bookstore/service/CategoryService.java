package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.category.*;
import com.qm.bookstore.qm_bookstore.entity.Category;
import com.qm.bookstore.qm_bookstore.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    
    private final CategoryRepository categoryRepository;
    
    /**
     * Get category tree structure (recursive hierarchy)
     * Only returns id, name, slug, children
     */
    @Transactional(readOnly = true)
    public List<CategoryTreeDTO> getCategoryTree() {
        // Fetch all active categories
        List<Category> allCategories = categoryRepository.findByStatusTrueOrderByIdAsc();
        
        // Build tree from flat list
        return buildTree(allCategories);
    }
    
    /**
     * Get direct children of a parent category
     * @param parentId - null for root categories, specific ID for children
     */
    @Transactional(readOnly = true)
    public List<CategoryDTO> getCategoriesByParent(Long parentId) {
        List<Category> categories;
        
        if (parentId == null) {
            // Get root categories
            categories = categoryRepository.findByParentIdIsNullAndStatusTrueOrderByIdAsc();
        } else {
            // Get direct children
            categories = categoryRepository.findByParentIdAndStatusTrueOrderByIdAsc(parentId);
        }
        
        return categories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Build hierarchical tree from flat list of categories
     */
    private List<CategoryTreeDTO> buildTree(List<Category> categories) {
        // Create a map for quick lookup
        Map<Long, CategoryTreeDTO> categoryMap = categories.stream()
                .collect(Collectors.toMap(
                        Category::getId,
                        this::convertToTreeDTO
                ));
        
        List<CategoryTreeDTO> roots = new ArrayList<>();
        
        // Build the tree structure
        for (Category category : categories) {
            CategoryTreeDTO dto = categoryMap.get(category.getId());
            
            if (category.getParentId() == null) {
                // Root category
                roots.add(dto);
            } else {
                // Child category - add to parent
                CategoryTreeDTO parent = categoryMap.get(category.getParentId());
                if (parent != null) {
                    parent.getChildren().add(dto);
                }
            }
        }
        
        return roots;
    }
    
    /**
     * Convert Category entity to CategoryTreeDTO (for tree structure)
     */
    private CategoryTreeDTO convertToTreeDTO(Category category) {
        return CategoryTreeDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .status(category.getStatus())
                .children(new ArrayList<>())
                .build();
    }
    
    /**
     * Convert Category entity to CategoryDTO (for flat list)
     */
    private CategoryDTO convertToDTO(Category category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .parentId(category.getParentId())
                .status(category.getStatus())
                .build();
    }
    
    /**
     * Convert Category entity to CategoryDetailDTO (with timestamps)
     */
    private CategoryDetailDTO convertToDetailDTO(Category category) {
        return CategoryDetailDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .parentId(category.getParentId())
                .status(category.getStatus())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
    
    /**
     * Get all categories (for admin/management)
     */
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findByStatusTrueOrderByIdAsc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get single category by ID
     */
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return convertToDTO(category);
    }
    
    /**
     * Get category by slug
     */
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug);
        if (category == null) {
            throw new RuntimeException("Category not found with slug: " + slug);
        }
        return convertToDTO(category);
    }
    
    // ========== ADMIN CRUD OPERATIONS ==========
    
    /**
     * Create new category
     */
    @Transactional
    public CategoryDetailDTO createCategory(CreateCategoryRequest request) {
        // Validate name uniqueness
        if (categoryRepository.existsByName(request.getName())) {
            throw new RuntimeException("Category name already exists: " + request.getName());
        }
        
        // Auto-generate slug if not provided
        String slug = request.getSlug();
        if (slug == null || slug.trim().isEmpty()) {
            slug = generateSlug(request.getName());
        }
        
        // Validate slug uniqueness
        if (categoryRepository.findBySlug(slug) != null) {
            throw new RuntimeException("Category slug already exists: " + slug);
        }
        
        // Validate parent exists if provided
        if (request.getParentId() != null) {
            if (!categoryRepository.existsById(request.getParentId())) {
                throw new RuntimeException("Parent category not found with id: " + request.getParentId());
            }
        }
        
        // Create new category
        Category category = new Category();
        category.setName(request.getName());
        category.setSlug(slug);
        category.setDescription(request.getDescription());
        category.setParentId(request.getParentId());
        category.setStatus(request.getStatus() != null ? request.getStatus() : true);
        
        Category saved = categoryRepository.save(category);
        return convertToDetailDTO(saved);
    }
    
    /**
     * Update existing category
     */
    @Transactional
    public CategoryDetailDTO updateCategory(Long id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        
        // Update name if provided
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            if (!request.getName().equals(category.getName())) {
                if (categoryRepository.existsByNameAndIdNot(request.getName(), id)) {
                    throw new RuntimeException("Category name already exists: " + request.getName());
                }
                category.setName(request.getName());
            }
        }
        
        // Update slug if provided
        if (request.getSlug() != null && !request.getSlug().trim().isEmpty()) {
            if (!request.getSlug().equals(category.getSlug())) {
                if (categoryRepository.existsBySlugAndIdNot(request.getSlug(), id)) {
                    throw new RuntimeException("Category slug already exists: " + request.getSlug());
                }
                category.setSlug(request.getSlug());
            }
        }
        
        // Update description
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }
        
        // Update parent
        if (request.getParentId() != null) {
            // Check circular reference
            if (request.getParentId().equals(id)) {
                throw new RuntimeException("Cannot set parent to itself");
            }
            
            // Check if new parent is a descendant
            List<Long> descendants = categoryRepository.findAllDescendantIds(id);
            if (descendants.contains(request.getParentId())) {
                throw new RuntimeException("Cannot set parent to itself or its descendants");
            }
            
            // Validate parent exists
            if (!categoryRepository.existsById(request.getParentId())) {
                throw new RuntimeException("Parent category not found with id: " + request.getParentId());
            }
            
            category.setParentId(request.getParentId());
        }
        
        // Update status
        if (request.getStatus() != null) {
            category.setStatus(request.getStatus());
        }
        
        Category updated = categoryRepository.save(category);
        return convertToDetailDTO(updated);
    }
    
    /**
     * Delete category
     */
    @Transactional
    public DeleteResult deleteCategory(Long id, Boolean force) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        
        // Check if category has children
        long childrenCount = categoryRepository.countByParentId(id);
        
        if (childrenCount > 0 && (force == null || !force)) {
            throw new RuntimeException("Cannot delete category with children. Use force=true to delete all children.");
        }
        
        List<Long> deletedIds = new ArrayList<>();
        
        if (force != null && force && childrenCount > 0) {
            // Get all descendants
            List<Long> descendantIds = categoryRepository.findAllDescendantIds(id);
            descendantIds.add(id);
            
            // Check if any descendant has products
            for (Long descendantId : descendantIds) {
                long productCount = categoryRepository.countProductsByCategoryId(descendantId);
                if (productCount > 0) {
                    Category cat = categoryRepository.findById(descendantId).orElse(null);
                    String name = cat != null ? cat.getName() : "Unknown";
                    throw new RuntimeException("Cannot delete category tree because category '" + name + "' (id: " + descendantId + ") has " + productCount + " products");
                }
            }
            
            // Delete all descendants and the category
            categoryRepository.deleteAllById(descendantIds);
            deletedIds.addAll(descendantIds);
        } else {
            // Check if category has products
            long productCount = categoryRepository.countProductsByCategoryId(id);
            if (productCount > 0) {
                throw new RuntimeException("Cannot delete category with products. Please reassign or delete products first.");
            }
            
            // Delete single category
            categoryRepository.deleteById(id);
            deletedIds.add(id);
        }
        
        return DeleteResult.builder()
                .deletedCount(deletedIds.size())
                .deletedIds(deletedIds)
                .build();
    }
    
    /**
     * Toggle category status
     */
    @Transactional
    public CategoryDetailDTO toggleStatus(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        
        category.setStatus(!category.getStatus());
        Category updated = categoryRepository.save(category);
        
        return convertToDetailDTO(updated);
    }
    
    /**
     * Move category to new parent
     */
    @Transactional
    public CategoryDetailDTO moveCategory(Long id, Long newParentId) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        
        // Validate newParent exists if not null
        if (newParentId != null) {
            // Check circular reference
            if (newParentId.equals(id)) {
                throw new RuntimeException("Cannot move category into itself");
            }
            
            // Check if new parent is a descendant
            List<Long> descendants = categoryRepository.findAllDescendantIds(id);
            if (descendants.contains(newParentId)) {
                throw new RuntimeException("Cannot move category into itself or its descendants");
            }
            
            // Validate parent exists
            if (!categoryRepository.existsById(newParentId)) {
                throw new RuntimeException("Parent category not found with id: " + newParentId);
            }
        }
        
        category.setParentId(newParentId);
        Category updated = categoryRepository.save(category);
        
        return convertToDetailDTO(updated);
    }
    
    /**
     * Bulk delete categories
     */
    @Transactional
    public BulkDeleteResult bulkDeleteCategories(List<Long> categoryIds, Boolean force) {
        List<BulkDeleteResult.FailedDelete> failed = new ArrayList<>();
        List<Long> successfullyDeleted = new ArrayList<>();
        
        for (Long id : categoryIds) {
            try {
                DeleteResult result = deleteCategory(id, force);
                successfullyDeleted.addAll(result.getDeletedIds());
            } catch (Exception e) {
                Category category = categoryRepository.findById(id).orElse(null);
                String name = category != null ? category.getName() : "Unknown";
                
                failed.add(BulkDeleteResult.FailedDelete.builder()
                        .id(id)
                        .name(name)
                        .reason(e.getMessage())
                        .build());
            }
        }
        
        return BulkDeleteResult.builder()
                .deletedCount(successfullyDeleted.size())
                .failed(failed)
                .build();
    }
    
    /**
     * Generate slug from name (Vietnamese support)
     */
    private String generateSlug(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "";
        }
        
        // Normalize and convert to lowercase
        String slug = name.toLowerCase().trim();
        
        // Vietnamese character mapping
        slug = slug.replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a");
        slug = slug.replaceAll("[èéẹẻẽêềếệểễ]", "e");
        slug = slug.replaceAll("[ìíịỉĩ]", "i");
        slug = slug.replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o");
        slug = slug.replaceAll("[ùúụủũưừứựửữ]", "u");
        slug = slug.replaceAll("[ỳýỵỷỹ]", "y");
        slug = slug.replaceAll("đ", "d");
        
        // Remove accents from other characters
        slug = Normalizer.normalize(slug, Normalizer.Form.NFD);
        slug = slug.replaceAll("\\p{M}", "");
        
        // Replace spaces with hyphens
        slug = slug.replaceAll("\\s+", "-");
        
        // Remove non-alphanumeric characters except hyphens
        slug = slug.replaceAll("[^a-z0-9-]", "");
        
        // Replace multiple hyphens with single hyphen
        slug = slug.replaceAll("-+", "-");
        
        // Trim hyphens from start and end
        slug = slug.replaceAll("^-|-$", "");
        
        return slug;
    }
}
