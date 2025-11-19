package com.qm.bookstore.qm_bookstore.dto.cart.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ToggleItemSelectionRequest {
    
    @NotNull(message = "Selected status is required")
    Boolean selected;
}
