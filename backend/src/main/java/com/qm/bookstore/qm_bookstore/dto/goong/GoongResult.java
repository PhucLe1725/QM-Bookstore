package com.qm.bookstore.qm_bookstore.dto.goong;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class GoongResult {
    private GoongGeometry geometry;
    
    @JsonProperty("formatted_address")
    private String formattedAddress;
    
    @JsonProperty("place_id")
    private String placeId;
}
