package com.qm.bookstore.qm_bookstore.controller;

import com.qm.bookstore.qm_bookstore.dto.base.response.ApiResponse;
import com.qm.bookstore.qm_bookstore.dto.systemconfig.request.CreateSystemConfigRequest;
import com.qm.bookstore.qm_bookstore.dto.systemconfig.request.UpdateSystemConfigRequest;
import com.qm.bookstore.qm_bookstore.dto.systemconfig.response.SystemConfigResponse;
import com.qm.bookstore.qm_bookstore.service.SystemConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/system-config")
@RequiredArgsConstructor
@Slf4j
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    /**
     * Get all system configs - Public access for system use
     * GET /api/system-config
     */
    @GetMapping
    public ApiResponse<Page<SystemConfigResponse>> getAllConfigs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "configKey") String sortBy) {

        log.info("[getAllConfigs] Fetching all configs, page={}, size={}", page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        Page<SystemConfigResponse> configs = systemConfigService.getAllConfigs(pageable);

        return ApiResponse.<Page<SystemConfigResponse>>builder()
                .code(1000)
                .message("Success")
                .result(configs)
                .build();
    }

    /**
     * Get system config by ID - Public access for system use
     * GET /api/system-config/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<SystemConfigResponse> getConfigById(@PathVariable Long id) {

        log.info("[getConfigById] Fetching config with id={}", id);

        SystemConfigResponse config = systemConfigService.getConfigById(id);

        return ApiResponse.<SystemConfigResponse>builder()
                .code(1000)
                .message("Success")
                .result(config)
                .build();
    }

    /**
    /**
     * Get system config by key - Public access for system use
     * GET /api/system-config/key/{configKey}
     */
    @GetMapping("/key/{configKey}")
    public ApiResponse<SystemConfigResponse> getConfigByKey(@PathVariable String configKey) {
        log.info("[getConfigByKey] Fetching config with key={}", configKey);

        SystemConfigResponse config = systemConfigService.getConfigByKey(configKey);

        return ApiResponse.<SystemConfigResponse>builder()
                .code(1000)
                .message("Success")
                .result(config)
                .build();
    }

    /**
     * Create new system config - Admin only
     * POST /api/system-config
     */
    @PostMapping
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<SystemConfigResponse> createConfig(
            @Valid @RequestBody CreateSystemConfigRequest request) {

        log.info("[createConfig] Creating config with key={}", request.getConfigKey());

        SystemConfigResponse config = systemConfigService.createConfig(request);

        return ApiResponse.<SystemConfigResponse>builder()
                .code(1000)
                .message("System config created successfully")
                .result(config)
                .build();
    }

    /**
     * Update system config - Admin only
     * PUT /api/system-config/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<SystemConfigResponse> updateConfig(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSystemConfigRequest request) {

        log.info("[updateConfig] Updating config with id={}", id);

        SystemConfigResponse config = systemConfigService.updateConfig(id, request);

        return ApiResponse.<SystemConfigResponse>builder()
                .code(1000)
                .message("System config updated successfully")
                .result(config)
                .build();
    }

    /**
     * Delete system config - Admin only
     * DELETE /api/system-config/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ApiResponse<Void> deleteConfig(@PathVariable Long id) {

        log.info("[deleteConfig] Deleting config with id={}", id);

        systemConfigService.deleteConfig(id);

        return ApiResponse.<Void>builder()
                .code(1000)
                .message("System config deleted successfully")
                .build();
    }
}
