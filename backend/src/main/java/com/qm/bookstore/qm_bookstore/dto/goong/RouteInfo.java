package com.qm.bookstore.qm_bookstore.dto.goong;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteInfo {
    private Double distanceInKm;
    private Integer durationInMinutes;
}
