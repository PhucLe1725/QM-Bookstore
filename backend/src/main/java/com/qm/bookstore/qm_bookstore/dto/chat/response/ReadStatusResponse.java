package com.qm.bookstore.qm_bookstore.dto.chat.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReadStatusResponse {
    boolean success;
    int markedCount;
    String message;
}