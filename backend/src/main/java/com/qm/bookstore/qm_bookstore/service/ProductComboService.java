package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.productcombo.request.ProductComboCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.productcombo.request.ProductComboUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.productcombo.response.ProductComboResponse;
import com.qm.bookstore.qm_bookstore.entity.Product;
import com.qm.bookstore.qm_bookstore.entity.ProductCombo;
import com.qm.bookstore.qm_bookstore.entity.ProductComboItem;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.mapper.ProductComboMapper;
import com.qm.bookstore.qm_bookstore.repository.ProductComboItemRepository;
import com.qm.bookstore.qm_bookstore.repository.ProductComboRepository;
import com.qm.bookstore.qm_bookstore.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ProductComboService {
    
    ProductComboRepository productComboRepository;
    ProductComboItemRepository productComboItemRepository;
    ProductRepository productRepository;
    
    /**
     * Tạo combo mới
     */
    @Transactional
    public ProductComboResponse createCombo(ProductComboCreateRequest request) {
        log.info("[createCombo] Creating combo: {}", request.getName());
        
        // Validate tên combo chưa tồn tại
        if (productComboRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.PRODUCT_COMBO_NAME_EXISTED);
        }
        
        // Validate products exist
        List<Long> productIds = request.getItems().stream()
                .map(ProductComboCreateRequest.ComboItemRequest::getProductId)
                .collect(Collectors.toList());
        
        Map<Long, Product> productMap = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        
        // Check all products exist
        for (Long productId : productIds) {
            if (!productMap.containsKey(productId)) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }
        }
        
        // Create combo entity
        ProductCombo combo = ProductCombo.builder()
                .name(request.getName())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .availability(request.getAvailability() != null ? request.getAvailability() : true)
                .comboItems(new ArrayList<>())
                .build();
        
        // Add combo items
        for (ProductComboCreateRequest.ComboItemRequest itemRequest : request.getItems()) {
            Product product = productMap.get(itemRequest.getProductId());
            
            ProductComboItem comboItem = ProductComboItem.builder()
                    .combo(combo)
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .build();
            
            combo.addComboItem(comboItem);
        }
        
        ProductCombo savedCombo = productComboRepository.save(combo);
        log.info("[createCombo] Combo created successfully with ID: {}", savedCombo.getId());
        
        return ProductComboMapper.toResponse(savedCombo);
    }
    
    /**
     * Cập nhật combo
     */
    @Transactional
    public ProductComboResponse updateCombo(Integer comboId, ProductComboUpdateRequest request) {
        log.info("[updateCombo] Updating combo ID: {}", comboId);
        
        ProductCombo combo = productComboRepository.findByIdWithItems(comboId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_COMBO_NOT_FOUND));
        
        // Update basic info
        if (request.getName() != null) {
            if (productComboRepository.existsByNameAndIdNot(request.getName(), comboId)) {
                throw new AppException(ErrorCode.PRODUCT_COMBO_NAME_EXISTED);
            }
            combo.setName(request.getName());
        }
        
        if (request.getPrice() != null) {
            combo.setPrice(request.getPrice());
        }
        
        if (request.getImageUrl() != null) {
            combo.setImageUrl(request.getImageUrl());
        }
        
        if (request.getAvailability() != null) {
            combo.setAvailability(request.getAvailability());
        }
        
        // Update combo items if provided
        if (request.getItems() != null) {
            // Validate new products first
            List<Long> productIds = request.getItems().stream()
                    .map(ProductComboUpdateRequest.ComboItemRequest::getProductId)
                    .collect(Collectors.toList());
            
            Map<Long, Product> productMap = productRepository.findAllById(productIds).stream()
                    .collect(Collectors.toMap(Product::getId, Function.identity()));
            
            for (Long productId : productIds) {
                if (!productMap.containsKey(productId)) {
                    throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
                }
            }
            
            // Clear collection using helper method (handles bidirectional relationship)
            combo.clearComboItems();
            
            // Save combo to trigger orphan removal in database
            productComboRepository.saveAndFlush(combo);
            
            // Add new items
            for (ProductComboUpdateRequest.ComboItemRequest itemRequest : request.getItems()) {
                Product product = productMap.get(itemRequest.getProductId());
                
                ProductComboItem comboItem = ProductComboItem.builder()
                        .combo(combo)
                        .product(product)
                        .quantity(itemRequest.getQuantity())
                        .build();
                
                combo.addComboItem(comboItem);
            }
        }
        
        ProductCombo updatedCombo = productComboRepository.save(combo);
        log.info("[updateCombo] Combo updated successfully");
        
        return ProductComboMapper.toResponse(updatedCombo);
    }
    
    /**
     * Lấy combo theo ID
     */
    @Transactional(readOnly = true)
    public ProductComboResponse getComboById(Integer comboId) {
        log.info("[getComboById] Getting combo ID: {}", comboId);
        
        ProductCombo combo = productComboRepository.findByIdWithItems(comboId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_COMBO_NOT_FOUND));
        
        return ProductComboMapper.toResponse(combo);
    }
    
    /**
     * Lấy tất cả combos (có phân trang)
     */
    @Transactional(readOnly = true)
    public Page<ProductComboResponse> getAllCombos(Pageable pageable) {
        log.info("[getAllCombos] Getting all combos with pagination");
        
        Page<ProductCombo> comboPage = productComboRepository.findAll(pageable);
        
        return comboPage.map(combo -> {
            // Force load combo items
            combo.getComboItems().forEach(item -> {
                if (item.getProduct() != null) {
                    item.getProduct().getName();
                }
            });
            return ProductComboMapper.toResponse(combo);
        });
    }
    
    /**
     * Lấy combos theo availability
     */
    @Transactional(readOnly = true)
    public Page<ProductComboResponse> getCombosByAvailability(Boolean availability, Pageable pageable) {
        log.info("[getCombosByAvailability] Getting combos with availability: {}", availability);
        
        Page<ProductCombo> comboPage = productComboRepository.findByAvailability(availability, pageable);
        
        return comboPage.map(combo -> {
            combo.getComboItems().forEach(item -> {
                if (item.getProduct() != null) {
                    item.getProduct().getName();
                }
            });
            return ProductComboMapper.toResponse(combo);
        });
    }
    
    /**
     * Tìm kiếm combos theo tên
     */
    @Transactional(readOnly = true)
    public Page<ProductComboResponse> searchCombosByName(String name, Pageable pageable) {
        log.info("[searchCombosByName] Searching combos with name: {}", name);
        
        Page<ProductCombo> comboPage = productComboRepository.findByNameContainingIgnoreCase(name, pageable);
        
        return comboPage.map(combo -> {
            combo.getComboItems().forEach(item -> {
                if (item.getProduct() != null) {
                    item.getProduct().getName();
                }
            });
            return ProductComboMapper.toResponse(combo);
        });
    }
    
    /**
     * Lấy combos có chứa product cụ thể
     */
    @Transactional(readOnly = true)
    public List<ProductComboResponse> getCombosByProductId(Long productId) {
        log.info("[getCombosByProductId] Getting combos containing product ID: {}", productId);
        
        // Validate product exists
        if (!productRepository.existsById(productId)) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        
        List<ProductCombo> combos = productComboRepository.findByProductId(productId);
        
        combos.forEach(combo -> {
            combo.getComboItems().forEach(item -> {
                if (item.getProduct() != null) {
                    item.getProduct().getName();
                }
            });
        });
        
        return ProductComboMapper.toResponseList(combos);
    }
    
    /**
     * Xóa combo
     */
    @Transactional
    public void deleteCombo(Integer comboId) {
        log.info("[deleteCombo] Deleting combo ID: {}", comboId);
        
        ProductCombo combo = productComboRepository.findById(comboId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_COMBO_NOT_FOUND));
        
        productComboRepository.delete(combo);
        
        log.info("[deleteCombo] Combo deleted successfully");
    }
    
    /**
     * Toggle availability của combo
     */
    @Transactional
    public ProductComboResponse toggleAvailability(Integer comboId) {
        log.info("[toggleAvailability] Toggling availability for combo ID: {}", comboId);
        
        ProductCombo combo = productComboRepository.findById(comboId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_COMBO_NOT_FOUND));
        
        combo.setAvailability(!combo.getAvailability());
        ProductCombo updatedCombo = productComboRepository.save(combo);
        
        log.info("[toggleAvailability] Availability toggled to: {}", updatedCombo.getAvailability());
        
        return ProductComboMapper.toSimpleResponse(updatedCombo);
    }
    
    /**
     * Đếm số combos
     */
    public long countCombos() {
        return productComboRepository.count();
    }
    
    public long countAvailableCombos() {
        return productComboRepository.countByAvailability(true);
    }
}
