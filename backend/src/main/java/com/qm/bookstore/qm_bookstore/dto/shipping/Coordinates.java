package com.qm.bookstore.qm_bookstore.dto.shipping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Coordinates {
    private Double lat;
    private Double lng;
    
    public Coordinates(double lat, double lng) {
        this.lat = lat;
        this.lng = lng;
    }
}
