package com.qm.bookstore.qm_bookstore.dto.shipping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingCalculationResponse {
    private String receiverAddress;
    private Coordinates receiverCoordinates;
    private Coordinates storeCoordinates;
    private ShippingFeeDetails feeDetails;
}
