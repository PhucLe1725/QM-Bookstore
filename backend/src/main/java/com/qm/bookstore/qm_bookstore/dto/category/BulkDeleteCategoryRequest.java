package com.qm.bookstore.qm_bookstore.dto.category;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkDeleteCategoryRequest {
    
    @NotEmpty(message = "Category IDs list cannot be empty")
    private List<Long> categoryIds;
    
    @Builder.Default
    private Boolean force = false;
}
