package com.qm.bookstore.qm_bookstore.dto.goong;

import com.fasterxml.jackson.annotation.JsonProperty;
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
