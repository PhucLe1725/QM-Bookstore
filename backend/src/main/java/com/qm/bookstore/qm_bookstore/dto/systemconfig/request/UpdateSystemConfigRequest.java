package com.qm.bookstore.qm_bookstore.dto.systemconfig.request;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSystemConfigRequest {
    
    private String configValue;
    
    private String valueType;  // string, number, boolean, json
    
    private String description;
}
