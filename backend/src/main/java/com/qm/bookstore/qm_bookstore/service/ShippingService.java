package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.goong.RouteInfo;
import com.qm.bookstore.qm_bookstore.dto.shipping.*;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service for calculating shipping fees based on distance and order subtotal
 * Uses Goong API for geocoding and route calculation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ShippingService {

    private final GoongService goongService;
    private final SystemConfigService systemConfigService;

    @Value("${shipping.base-fee:15000}")
    private Double baseFee;

    @Value("${shipping.per-km-fee:3000}")
    private Double perKmFee;

    @Value("${shipping.base-distance-km:5}")
    private Double baseDistanceKm;

    /**
     * Calculate shipping fee based on receiver address and order subtotal
     *
     * @param receiverAddress The delivery address
     * @param subtotal The order subtotal amount
     * @param receiverLat Optional: Receiver latitude (if already available from frontend)
     * @param receiverLng Optional: Receiver longitude (if already available from frontend)
     * @return Shipping calculation response with fee details
     */
    public ShippingCalculationResponse calculateShippingFee(String receiverAddress, Double subtotal, 
                                                           Double receiverLat, Double receiverLng) {
        log.info("[calculateShippingFee] Calculating shipping for address={}, subtotal={}, lat={}, lng={}", 
                receiverAddress, subtotal, receiverLat, receiverLng);

        try {
            // Step 1: Get receiver coordinates
            Coordinates receiverCoords;
            if (receiverLat != null && receiverLng != null) {
                // Use coordinates from frontend (already geocoded by map selection)
                receiverCoords = Coordinates.builder()
                        .lat(receiverLat)
                        .lng(receiverLng)
                        .build();
                log.debug("[calculateShippingFee] Using coordinates from frontend: {}", receiverCoords);
            } else {
                // Geocode the receiver address
                receiverCoords = goongService.geocodeAddress(receiverAddress);
                log.debug("[calculateShippingFee] Geocoded receiver coordinates: {}", receiverCoords);
            }

            // Step 2: Get store location from system config
            Coordinates storeCoords = systemConfigService.getStoreLocation();
            log.debug("[calculateShippingFee] Store coordinates: {}", storeCoords);

            // Step 3: Calculate route between store and receiver
            RouteInfo routeInfo = goongService.calculateRoute(storeCoords, receiverCoords);
            log.debug("[calculateShippingFee] Route info: distance={} km, duration={} mins",
                    routeInfo.getDistanceInKm(), routeInfo.getDurationInMinutes());

            // Step 4: Calculate shipping fee
            Double shippingFee = calculateFee(routeInfo.getDistanceInKm());
            log.debug("[calculateShippingFee] Calculated fee: {}", shippingFee);

            // Step 5: Check for free shipping
            Double freeShippingThreshold = systemConfigService.getFreeShippingThreshold();
            boolean isFreeShipping = subtotal >= freeShippingThreshold && freeShippingThreshold > 0;
            Double finalFee = isFreeShipping ? 0.0 : shippingFee;

            log.info("[calculateShippingFee] Final fee={}, isFreeShipping={}, threshold={}",
                    finalFee, isFreeShipping, freeShippingThreshold);

            // Step 6: Build response
            ShippingFeeDetails feeDetails = ShippingFeeDetails.builder()
                    .baseFee(baseFee)
                    .distanceFee(shippingFee - baseFee)
                    .totalFee(finalFee)
                    .distanceInKm(routeInfo.getDistanceInKm())
                    .estimatedDurationInMinutes(routeInfo.getDurationInMinutes())
                    .isFreeShipping(isFreeShipping)
                    .freeShippingThreshold(freeShippingThreshold)
                    .build();

            return ShippingCalculationResponse.builder()
                    .receiverAddress(receiverAddress)
                    .receiverCoordinates(receiverCoords)
                    .storeCoordinates(storeCoords)
                    .feeDetails(feeDetails)
                    .build();

        } catch (AppException e) {
            log.error("[calculateShippingFee] AppException occurred: code={}, message={}",
                    e.getErrorCode(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[calculateShippingFee] Unexpected error: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.SHIPPING_CALCULATION_FAILED);
        }
    }

    /**
     * Calculate fee based on distance
     * Formula: baseFee for first baseDistanceKm, then add perKmFee for each additional km
     *
     * @param distanceInKm The distance in kilometers
     * @return The calculated shipping fee
     */
    private Double calculateFee(Double distanceInKm) {
        if (distanceInKm <= baseDistanceKm) {
            return baseFee;
        }
        Double additionalDistance = distanceInKm - baseDistanceKm;
        return baseFee + (additionalDistance * perKmFee);
    }

    /**
     * Geocode an address to coordinates
     * This method is exposed for other services that need geocoding
     *
     * @param address The address to geocode
     * @return Geocoding response with coordinates
     */
    public GeocodeResponse geocodeAddress(String address) {
        log.info("[geocodeAddress] Geocoding address={}", address);
        try {
            Coordinates coordinates = goongService.geocodeAddress(address);
            return GeocodeResponse.builder()
                    .address(address)
                    .coordinates(coordinates)
                    .build();
        } catch (AppException e) {
            log.error("[geocodeAddress] AppException: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[geocodeAddress] Unexpected error: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.GEOCODING_FAILED);
        }
    }
}
