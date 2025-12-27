package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.BaseGetAllResponse;
import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductCreateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductGetAllRequest;
import com.qm.bookstore.qm_bookstore.dto.product.request.ProductUpdateRequest;
import com.qm.bookstore.qm_bookstore.dto.product.response.ProductResponse;
import com.qm.bookstore.qm_bookstore.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
@Slf4j
public class ProductController {

    ProductService productService;

    @GetMapping
    public ApiResponse<BaseGetAllResponse<ProductResponse>> getAllProducts(ProductGetAllRequest request) {
        log.info("Getting all products with filters: {}", request);
        BaseGetAllResponse<ProductResponse> products = productService.getAllProducts(request);
        return ApiResponse.<BaseGetAllResponse<ProductResponse>>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Products retrieved successfully")
                .result(products)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getProductById(@PathVariable Long id) {
        log.info("Getting product by id: {}", id);
        ProductResponse product = productService.getProductById(id);
        return ApiResponse.<ProductResponse>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Product retrieved successfully")
                .result(product)
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<ProductResponse> createProduct(@RequestBody ProductCreateRequest request) {
        log.info("Creating new product: {}", request.getName());
        ProductResponse product = productService.createProduct(request);
        return ApiResponse.<ProductResponse>builder()
                .success(true)
                .code(HttpStatus.CREATED.value())
                .message("Product created successfully")
                .result(product)
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<ProductResponse> updateProduct(@PathVariable Long id, @RequestBody ProductUpdateRequest request) {
        log.info("Updating product id: {} with data: {}", id, request.getName());
        request.setId(id);
        ProductResponse product = productService.updateProduct(request);
        return ApiResponse.<ProductResponse>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Product updated successfully")
                .result(product)
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ApiResponse<Void> deleteProduct(@PathVariable Long id) {
        log.info("Deleting product id: {}", id);
        productService.deleteProduct(id);
        return ApiResponse.<Void>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Product deleted successfully")
                .build();
    }

    @GetMapping("/category/{categoryId}")
    public ApiResponse<List<ProductResponse>> getProductsByCategory(@PathVariable Long categoryId) {
        log.info("Getting products by category id: {}", categoryId);
        List<ProductResponse> products = productService.getProductsByCategory(categoryId);
        return ApiResponse.<List<ProductResponse>>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Products by category retrieved successfully")
                .result(products)
                .build();
    }

    @GetMapping("/available")
    public ApiResponse<List<ProductResponse>> getAvailableProducts() {
        log.info("Getting available products");
        List<ProductResponse> products = productService.getAvailableProducts();
        return ApiResponse.<List<ProductResponse>>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Available products retrieved successfully")
                .result(products)
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<List<ProductResponse>> searchProductsByName(@RequestParam String name) {
        log.info("Searching products by name: {}", name);
        List<ProductResponse> products = productService.searchProductsByName(name);
        return ApiResponse.<List<ProductResponse>>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Products searched successfully")
                .result(products)
                .build();
    }

    @GetMapping("/search/sku")
    public ApiResponse<List<ProductResponse>> searchProductsBySku(@RequestParam String sku) {
        log.info("Searching products by SKU: {}", sku);
        List<ProductResponse> products = productService.getProductsBySku(sku);
        return ApiResponse.<List<ProductResponse>>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Products searched by SKU successfully")
                .result(products)
                .build();
    }

    @GetMapping("/search/brand")
    public ApiResponse<List<ProductResponse>> searchProductsByBrand(@RequestParam String brand) {
        log.info("Searching products by brand: {}", brand);
        List<ProductResponse> products = productService.getProductsByBrand(brand);
        return ApiResponse.<List<ProductResponse>>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Products searched by brand successfully")
                .result(products)
                .build();
    }

    @GetMapping("/low-stock")
    public ApiResponse<List<ProductResponse>> getLowStockProducts() {
        log.info("Getting low stock products");
        List<ProductResponse> products = productService.getLowStockProducts();
        return ApiResponse.<List<ProductResponse>>builder()
                .success(true)
                .code(HttpStatus.OK.value())
                .message("Low stock products retrieved successfully")
                .result(products)
                .build();
    }
}