package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.base.response.BaseGetAllResponse;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductGetAllRequest;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.response.ProductResponse;
import com.qm.bookstore.qm_bookstore.entity.Category;
import com.qm.bookstore.qm_bookstore.entity.Product;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.mapper.ProductMapper;
import com.qm.bookstore.qm_bookstore.repository.CategoryRepository;
import com.qm.bookstore.qm_bookstore.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
@Slf4j
public class ProductService {

    ProductRepository productRepository;
    CategoryRepository categoryRepository;
    ProductMapper productMapper;

    public ProductResponse getProductById(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        return productMapper.toProductResponse(product);
    }

    public BaseGetAllResponse<ProductResponse> getAllProducts(ProductGetAllRequest request) {
        // Create pageable with field name mapping for native query
        Sort sort = Sort.unsorted();
        if (request.getSortBy() != null && !request.getSortBy().isEmpty()) {
            Sort.Direction direction = "desc".equalsIgnoreCase(request.getSortDirection()) 
                ? Sort.Direction.DESC : Sort.Direction.ASC;
            
            // Map camelCase to snake_case for native query
            String sortField = convertToSnakeCase(request.getSortBy());
            sort = Sort.by(direction, sortField);
        }
        
        Pageable pageable = PageRequest.of(
            request.getSkipCount() / request.getMaxResultCount(),
            request.getMaxResultCount(),
            sort
        );

        // Get products with filters
        Page<Product> productPage = productRepository.findProductsWithFilters(
            request.getName(),
            request.getSku(),
            request.getCategoryId(),
            request.getBrand(),
            request.getMinPrice(),
            request.getMaxPrice(),
            request.getAvailability(),
            pageable
        );

        List<ProductResponse> productResponses = productMapper.toProductResponseList(productPage.getContent());

        return BaseGetAllResponse.<ProductResponse>builder()
                .data(productResponses)
                .totalRecords(productPage.getTotalElements())
                .build();
    }
    
    // Helper method to convert camelCase to snake_case for database column names
    private String convertToSnakeCase(String camelCase) {
        if (camelCase == null || camelCase.isEmpty()) {
            return camelCase;
        }
        return camelCase.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }

    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request) {
        // Check if SKU already exists
        if (request.getSku() != null && productRepository.existsBySku(request.getSku())) {
            throw new AppException(ErrorCode.PRODUCT_SKU_ALREADY_EXISTS);
        }
        
        Product product = productMapper.toProduct(request);
        
        // Set category if provided
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            product.setCategory(category);
        }
        
        // Set default values
        if (product.getStockQuantity() == null) {
            product.setStockQuantity(0);
        }
        if (product.getAvailability() == null) {
            product.setAvailability(true);
        }
        
        LocalDateTime now = LocalDateTime.now();
        product.setCreatedAt(now);
        product.setUpdatedAt(now);
        
        product = productRepository.save(product);
        
        return productMapper.toProductResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(ProductUpdateRequest request) {
        Product product = productRepository.findById(request.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        
        // Check if SKU already exists (and it's not the current product's SKU)
        if (request.getSku() != null && !request.getSku().equals(product.getSku()) 
            && productRepository.existsBySku(request.getSku())) {
            throw new AppException(ErrorCode.PRODUCT_SKU_ALREADY_EXISTS);
        }
        
        // Update basic fields
        if (request.getName() != null) {
            product.setName(request.getName());
        }
        if (request.getSku() != null) {
            product.setSku(request.getSku());
        }
        if (request.getShortDescription() != null) {
            product.setShortDescription(request.getShortDescription());
        }
        if (request.getFullDescription() != null) {
            product.setFullDescription(request.getFullDescription());
        }
        if (request.getPrice() != null) {
            product.setPrice(request.getPrice());
        }
        if (request.getBrand() != null) {
            product.setBrand(request.getBrand());
        }
        if (request.getImageUrl() != null) {
            product.setImageUrl(request.getImageUrl());
        }
        if (request.getStockQuantity() != null) {
            product.setStockQuantity(request.getStockQuantity());
        }
        if (request.getReorderLevel() != null) {
            product.setReorderLevel(request.getReorderLevel());
        }
        if (request.getReorderQuantity() != null) {
            product.setReorderQuantity(request.getReorderQuantity());
        }
        if (request.getAvailability() != null) {
            product.setAvailability(request.getAvailability());
        }
        
        // Update category
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            product.setCategory(category);
        }
        
        product.setUpdatedAt(LocalDateTime.now());
        product = productRepository.save(product);
        
        return productMapper.toProductResponse(product);
    }

    @Transactional
    public void deleteProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        productRepository.delete(product);
    }

    public List<ProductResponse> getProductsByCategory(Long categoryId) {
        List<Product> products = productRepository.findByCategoryId(categoryId);
        return productMapper.toProductResponseList(products);
    }

    public List<ProductResponse> getAvailableProducts() {
        List<Product> products = productRepository.findByAvailabilityTrue();
        return productMapper.toProductResponseList(products);
    }

    public List<ProductResponse> searchProductsByName(String name) {
        List<Product> products = productRepository.findByNameContainingIgnoreCase(name);
        return productMapper.toProductResponseList(products);
    }

    public List<ProductResponse> getProductsBySku(String sku) {
        List<Product> products = productRepository.findBySkuContainingIgnoreCase(sku);
        return productMapper.toProductResponseList(products);
    }

    public List<ProductResponse> getProductsByBrand(String brand) {
        List<Product> products = productRepository.findByBrandContainingIgnoreCase(brand);
        return productMapper.toProductResponseList(products);
    }

    public List<ProductResponse> getLowStockProducts() {
        List<Product> products = productRepository.findLowStockProducts();
        return productMapper.toProductResponseList(products);
    }
}