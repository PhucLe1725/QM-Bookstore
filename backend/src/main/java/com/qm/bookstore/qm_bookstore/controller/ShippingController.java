package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.shipping.GeocodeResponse;
import com.qm.bookstore.qm_bookstore.dto.shipping.ShippingCalculationRequest;
import com.qm.bookstore.qm_bookstore.dto.shipping.ShippingCalculationResponse;
import com.qm.bookstore.qm_bookstore.service.ShippingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for shipping-related operations
 * Provides endpoints for shipping fee calculation and address geocoding
 */
@RestController
@RequestMapping("/api/shipping")
@RequiredArgsConstructor
@Slf4j
public class ShippingController {

    private final ShippingService shippingService;

    /**
     * Calculate shipping fee based on receiver address and order subtotal
     * POST /api/shipping/calculate
     *
     * @param request The shipping calculation request containing address and subtotal
     * @return Shipping calculation response with fee details
     */
    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<ShippingCalculationResponse>> calculateShippingFee(
            @Valid @RequestBody ShippingCalculationRequest request) {
        log.info("[calculateShippingFee] Received request: address={}, subtotal={}, lat={}, lng={}",
                request.getReceiverAddress(), request.getSubtotal(), 
                request.getReceiverLat(), request.getReceiverLng());

        ShippingCalculationResponse response = shippingService.calculateShippingFee(
                request.getReceiverAddress(),
                request.getSubtotal(),
                request.getReceiverLat(),
                request.getReceiverLng()
        );

        log.info("[calculateShippingFee] Successfully calculated shipping fee: {}",
                response.getFeeDetails().getTotalFee());

        return ResponseEntity.ok(
                ApiResponse.<ShippingCalculationResponse>builder()
                        .success(true)
                        .code(1000)
                        .message("Shipping fee calculated successfully")
                        .result(response)
                        .build()
        );
    }

    /**
     * Geocode an address to get coordinates
     * POST /api/shipping/geocode
     *
     * @param address The address to geocode (as JSON: {"address": "..."})
     * @return Geocoding response with coordinates
     */
    @PostMapping("/geocode")
    public ResponseEntity<ApiResponse<GeocodeResponse>> geocodeAddress(
            @RequestBody String address) {
        log.info("[geocodeAddress] Received geocoding request for address: {}", address);

        // Extract address from JSON if needed
        String cleanAddress = address.replaceAll("\\{\"address\":\\s*\"(.+)\"\\}", "$1");

        GeocodeResponse response = shippingService.geocodeAddress(cleanAddress);

        log.info("[geocodeAddress] Successfully geocoded address: lat={}, lng={}",
                response.getCoordinates().getLat(), response.getCoordinates().getLng());

        return ResponseEntity.ok(
                ApiResponse.<GeocodeResponse>builder()
                        .success(true)
                        .code(1000)
                        .message("Address geocoded successfully")
                        .result(response)
                        .build()
        );
    }
}
