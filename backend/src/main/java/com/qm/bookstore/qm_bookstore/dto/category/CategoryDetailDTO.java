package com.qm.bookstore.qm_bookstore.dto.category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDetailDTO {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private Long parentId;
    private Boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
