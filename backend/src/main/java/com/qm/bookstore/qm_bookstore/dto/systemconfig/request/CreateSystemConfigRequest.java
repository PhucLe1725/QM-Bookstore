package com.qm.bookstore.qm_bookstore.dto.systemconfig.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSystemConfigRequest {
    
    @NotBlank(message = "Config key is required")
    private String configKey;
    
    @NotBlank(message = "Config value is required")
    private String configValue;
    
    private String valueType;  // string, number, boolean, json
    
    private String description;
}
