package com.qm.bookstore.qm_bookstore.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "product_combos")
@Data
public class ProductCombo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "combo_id", nullable = false)
    private Product combo;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;
}
