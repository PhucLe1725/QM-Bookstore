package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.goong.*;
import com.qm.bookstore.qm_bookstore.dto.shipping.Coordinates;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoongService {

    @Value("${goong.api.key}")
    private String goongApiKey;

    @Value("${goong.api.geocode.url:https://rsapi.goong.io/geocode}")
    private String geocodeUrl;

    @Value("${goong.api.direction.url:https://rsapi.goong.io/Direction}")
    private String directionUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Geocode address to coordinates
     * Cache results to avoid repeated API calls for same address
     */
    @Cacheable(value = "geocoding", key = "#address", unless = "#result == null")
    public Coordinates geocodeAddress(String address) {
        log.info("[geocodeAddress] Converting address to coordinates: {}", address);
        
        try {
            String encodedAddress = URLEncoder.encode(address, StandardCharsets.UTF_8.toString());
            String url = String.format("%s?address=%s&api_key=%s", geocodeUrl, encodedAddress, goongApiKey);
            
            log.debug("[geocodeAddress] Calling Goong API: {}", url.replace(goongApiKey, "***"));
            
            GoongGeocodeResponse response = restTemplate.getForObject(url, GoongGeocodeResponse.class);
            
            if (response != null && response.getResults() != null && !response.getResults().isEmpty()) {
                GoongLocation location = response.getResults().get(0).getGeometry().getLocation();
                Coordinates coords = new Coordinates(location.getLat(), location.getLng());
                
                log.info("[geocodeAddress] Successfully geocoded: {} -> lat={}, lng={}", 
                        address, coords.getLat(), coords.getLng());
                
                return coords;
            }
            
            log.error("[geocodeAddress] No results found for address: {}", address);
            throw new AppException(ErrorCode.GEOCODING_FAILED);
            
        } catch (UnsupportedEncodingException e) {
            log.error("[geocodeAddress] Error encoding address: {}", address, e);
            throw new AppException(ErrorCode.INVALID_ADDRESS);
        } catch (Exception e) {
            log.error("[geocodeAddress] Error calling Goong API for address: {}", address, e);
            throw new AppException(ErrorCode.GOONG_API_ERROR);
        }
    }

    /**
     * Calculate route distance and duration between two coordinates
     * Cache results to avoid repeated API calls
     */
    @Cacheable(value = "routes", key = "#origin.lat + ',' + #origin.lng + '-' + #destination.lat + ',' + #destination.lng", unless = "#result == null")
    public RouteInfo calculateRoute(Coordinates origin, Coordinates destination) {
        log.info("[calculateRoute] Calculating route from ({},{}) to ({},{})",
                origin.getLat(), origin.getLng(), destination.getLat(), destination.getLng());
        
        try {
            String url = UriComponentsBuilder.fromHttpUrl(directionUrl)
                    .queryParam("origin", String.format("%f,%f", origin.getLat(), origin.getLng()))
                    .queryParam("destination", String.format("%f,%f", destination.getLat(), destination.getLng()))
                    .queryParam("vehicle", "car")
                    .queryParam("api_key", goongApiKey)
                    .toUriString();
            
            log.debug("[calculateRoute] Calling Goong API: {}", url.replace(goongApiKey, "***"));
            
            GoongDirectionResponse response = restTemplate.getForObject(url, GoongDirectionResponse.class);
            
            if (response != null && response.getRoutes() != null && !response.getRoutes().isEmpty()) {
                GoongRoute route = response.getRoutes().get(0);
                GoongLeg leg = route.getLegs().get(0);
                
                double distanceKm = leg.getDistance().getValue() / 1000.0;
                int durationMinutes = (int) Math.round(leg.getDuration().getValue() / 60.0);
                
                RouteInfo routeInfo = RouteInfo.builder()
                        .distanceInKm(distanceKm)
                        .durationInMinutes(durationMinutes)
                        .build();
                
                log.info("[calculateRoute] Route calculated: distance={}km, duration={}min", 
                        distanceKm, durationMinutes);
                
                return routeInfo;
            }
            
            log.error("[calculateRoute] No routes found");
            throw new AppException(ErrorCode.ROUTE_CALCULATION_FAILED);
            
        } catch (Exception e) {
            log.error("[calculateRoute] Error calling Goong API", e);
            throw new AppException(ErrorCode.GOONG_API_ERROR);
        }
    }
}
