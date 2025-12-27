package com.qm.bookstore.qm_bookstore.dto.shipping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeocodeResponse {
    private String address;
    private Coordinates coordinates;
}
