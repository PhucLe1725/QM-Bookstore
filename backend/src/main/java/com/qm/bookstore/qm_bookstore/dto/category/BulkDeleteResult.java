package com.qm.bookstore.qm_bookstore.dto.category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkDeleteResult {
    private int deletedCount;
    private List<FailedDelete> failed;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FailedDelete {
        private Long id;
        private String name;
        private String reason;
    }
}
