package com.qm.bookstore.qm_bookstore.service;

import com.qm.bookstore.qm_bookstore.dto.shipping.Coordinates;
import com.qm.bookstore.qm_bookstore.dto.systemconfig.request.CreateSystemConfigRequest;
import com.qm.bookstore.qm_bookstore.dto.systemconfig.request.UpdateSystemConfigRequest;
import com.qm.bookstore.qm_bookstore.dto.systemconfig.response.SystemConfigResponse;
import com.qm.bookstore.qm_bookstore.entity.SystemConfig;
import com.qm.bookstore.qm_bookstore.exception.AppException;
import com.qm.bookstore.qm_bookstore.exception.ErrorCode;
import com.qm.bookstore.qm_bookstore.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;

    /**
     * Get all system configs
     */
    public Page<SystemConfigResponse> getAllConfigs(Pageable pageable) {
        log.info("[getAllConfigs] Fetching all system configs");
        
        Page<SystemConfig> configs = systemConfigRepository.findAll(pageable);
        return configs.map(this::mapToResponse);
    }

    /**
     * Get system config by ID
     */
    public SystemConfigResponse getConfigById(Long id) {
        log.info("[getConfigById] Fetching config with id={}", id);
        
        SystemConfig config = systemConfigRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SYSTEM_CONFIG_NOT_FOUND));
        
        return mapToResponse(config);
    }

    /**
     * Get system config by key
     */
    public SystemConfigResponse getConfigByKey(String configKey) {
        log.info("[getConfigByKey] Fetching config with key={}", configKey);
        
        SystemConfig config = systemConfigRepository.findByConfigKey(configKey)
                .orElseThrow(() -> new AppException(ErrorCode.SYSTEM_CONFIG_NOT_FOUND));
        
        return mapToResponse(config);
    }

    /**
     * Create new system config
     */
    @Transactional
    public SystemConfigResponse createConfig(CreateSystemConfigRequest request) {
        log.info("[createConfig] Creating config with key={}", request.getConfigKey());
        
        // Check if config key already exists
        if (systemConfigRepository.existsByConfigKey(request.getConfigKey())) {
            throw new AppException(ErrorCode.SYSTEM_CONFIG_ALREADY_EXISTS);
        }
        
        SystemConfig config = SystemConfig.builder()
                .configKey(request.getConfigKey())
                .configValue(request.getConfigValue())
                .valueType(request.getValueType())
                .description(request.getDescription())
                .build();
        
        SystemConfig savedConfig = systemConfigRepository.save(config);
        log.info("[createConfig] Created config with id={}", savedConfig.getId());
        
        return mapToResponse(savedConfig);
    }

    /**
     * Update system config
     */
    @Transactional
    public SystemConfigResponse updateConfig(Long id, UpdateSystemConfigRequest request) {
        log.info("[updateConfig] Updating config with id={}", id);
        
        SystemConfig config = systemConfigRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SYSTEM_CONFIG_NOT_FOUND));
        
        // Update only provided fields
        if (request.getConfigValue() != null) {
            config.setConfigValue(request.getConfigValue());
        }
        if (request.getValueType() != null) {
            config.setValueType(request.getValueType());
        }
        if (request.getDescription() != null) {
            config.setDescription(request.getDescription());
        }
        
        SystemConfig updatedConfig = systemConfigRepository.save(config);
        log.info("[updateConfig] Updated config with id={}", updatedConfig.getId());
        
        return mapToResponse(updatedConfig);
    }

    /**
     * Delete system config
     */
    @Transactional
    public void deleteConfig(Long id) {
        log.info("[deleteConfig] Deleting config with id={}", id);
        
        if (!systemConfigRepository.existsById(id)) {
            throw new AppException(ErrorCode.SYSTEM_CONFIG_NOT_FOUND);
        }
        
        systemConfigRepository.deleteById(id);
        log.info("[deleteConfig] Deleted config with id={}", id);
    }

    /**
     * Helper: Get config value as String (for public use)
     */
    public String getConfigValue(String configKey, String defaultValue) {
        return systemConfigRepository.findByConfigKey(configKey)
                .map(SystemConfig::getConfigValue)
                .orElse(defaultValue);
    }

    /**
     * Helper: Get config value as Integer
     */
    public Integer getConfigValueAsInt(String configKey, Integer defaultValue) {
        return systemConfigRepository.findByConfigKey(configKey)
                .map(config -> {
                    try {
                        return Integer.parseInt(config.getConfigValue());
                    } catch (NumberFormatException e) {
                        log.warn("[getConfigValueAsInt] Invalid number format for key={}, using default", configKey);
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    /**
     * Helper: Get config value as Boolean
     */
    public Boolean getConfigValueAsBoolean(String configKey, Boolean defaultValue) {
        return systemConfigRepository.findByConfigKey(configKey)
                .map(config -> Boolean.parseBoolean(config.getConfigValue()))
                .orElse(defaultValue);
    }

    /**
     * Helper: Get config value as Double
     */
    public Double getConfigValueAsDouble(String configKey, Double defaultValue) {
        return systemConfigRepository.findByConfigKey(configKey)
                .map(config -> {
                    try {
                        return Double.parseDouble(config.getConfigValue());
                    } catch (NumberFormatException e) {
                        log.warn("[getConfigValueAsDouble] Invalid number format for key={}, using default", configKey);
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    /**
     * Get store location coordinates from system config
     */
    public Coordinates getStoreLocation() {
        Double latitude = getConfigValueAsDouble("store_latitude", null);
        Double longitude = getConfigValueAsDouble("store_longitude", null);
        
        if (latitude == null || longitude == null) {
            log.error("[getStoreLocation] Store location not configured");
            throw new AppException(ErrorCode.STORE_LOCATION_NOT_CONFIGURED);
        }
        
        return new Coordinates(latitude, longitude);
    }

    /**
     * Get free shipping threshold from system config
     */
    public Double getFreeShippingThreshold() {
        return getConfigValueAsDouble("free_shipping_threshold", 0.0);
    }

    /**
     * Map SystemConfig to SystemConfigResponse
     */
    private SystemConfigResponse mapToResponse(SystemConfig config) {
        return SystemConfigResponse.builder()
                .id(config.getId())
                .configKey(config.getConfigKey())
                .configValue(config.getConfigValue())
                .valueType(config.getValueType())
                .description(config.getDescription())
                .updatedAt(config.getUpdatedAt())
                .createdAt(config.getCreatedAt())
                .build();
    }
}
