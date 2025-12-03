package com.qm.bookstore.qm_bookstore.dto.order.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CancelOrderRequest {
    
    @NotBlank(message = "Reason is required")
    String reason;
}
