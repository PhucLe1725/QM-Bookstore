package com.qm.bookstore.qm_bookstore.dto.systemconfig.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfigResponse {
    
    private Long id;
    private String configKey;
    private String configValue;
    private String valueType;
    private String description;
    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;
}
