package com.qm.bookstore.qm_bookstore.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "carts", 
    indexes = {
        @Index(name = "idx_cart_user_id", columnList = "user_id"),
        @Index(name = "idx_cart_session_id", columnList = "session_id")
    }
)
public class Cart {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "user_id", unique = true)
    UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    User user;

    @Column(name = "session_id", length = 100, unique = true)
    String sessionId;

    @Builder.Default
    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT NOW()")
    LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT NOW()")
    LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @Builder.Default
    List<CartItem> cartItems = new ArrayList<>();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
