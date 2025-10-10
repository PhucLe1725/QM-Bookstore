package com.qm.bookstore.qm_bookstore.dto.base.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BaseGetAllResponse<T> {
    List<T> data;
    long totalRecords;
}

