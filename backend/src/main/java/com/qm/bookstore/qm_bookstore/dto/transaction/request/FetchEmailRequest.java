package com.qm.bookstore.qm_bookstore.dto.transaction.request;

import jakarta.validation.constraints.Min;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FetchEmailRequest {
    
    @Min(value = 1, message = "Max emails must be at least 1")
    @Builder.Default
    Integer maxEmails = 10;
}
