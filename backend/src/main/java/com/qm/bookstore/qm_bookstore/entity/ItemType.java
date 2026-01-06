package com.qm.bookstore.qm_bookstore.entity;

/**
 * Enum representing the type of item in cart or order
 * - PRODUCT: Single product item
 * - COMBO: Product combo/bundle item
 */
public enum ItemType {
    /**
     * Regular single product
     */
    PRODUCT,
    
    /**
     * Product combo/bundle
     */
    COMBO
}
