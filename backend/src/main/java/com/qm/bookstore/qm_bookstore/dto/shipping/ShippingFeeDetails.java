package com.qm.bookstore.qm_bookstore.dto.shipping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingFeeDetails {
    private Double baseFee;
    private Double distanceFee;
    private Double totalFee;
    private Double distanceInKm;
    private Integer estimatedDurationInMinutes;
    private Boolean isFreeShipping;
    private Double freeShippingThreshold;
}
