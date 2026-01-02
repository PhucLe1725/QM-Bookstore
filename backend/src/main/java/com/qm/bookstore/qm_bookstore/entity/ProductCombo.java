package com.qm.bookstore.qm_bookstore.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "product_combos")
public class ProductCombo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;
    
    @Column(nullable = false, length = 255)
    String name;
    
    @Column(nullable = false, precision = 12, scale = 2)
    BigDecimal price;
    
    @Column(name = "image_url", columnDefinition = "TEXT")
    String imageUrl;
    
    @Column(nullable = false)
    Boolean availability = true;
    
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
    
    // Relationship: One combo has many combo items
    @OneToMany(mappedBy = "combo", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    List<ProductComboItem> comboItems = new ArrayList<>();
    
    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }
    
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Helper methods for bidirectional relationship
    public void addComboItem(ProductComboItem item) {
        comboItems.add(item);
        item.setCombo(this);
    }
    
    public void removeComboItem(ProductComboItem item) {
        comboItems.remove(item);
        item.setCombo(null);
    }
    
    public void clearComboItems() {
        comboItems.forEach(item -> item.setCombo(null));
        comboItems.clear();
    }
}
