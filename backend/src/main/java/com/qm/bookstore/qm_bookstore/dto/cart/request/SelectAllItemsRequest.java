package com.qm.bookstore.qm_bookstore.dto.cart.request;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SelectAllItemsRequest {
    
    @NotNull(message = "Selected is required")
    Boolean selected;
}
