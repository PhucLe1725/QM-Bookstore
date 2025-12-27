package com.qm.bookstore.qm_bookstore.dto.category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryTreeDTO {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private Boolean status;
    
    @Builder.Default
    private List<CategoryTreeDTO> children = new ArrayList<>();
}
