package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {
    
    /**
     * Find system config by key
     */
    Optional<SystemConfig> findByConfigKey(String configKey);
    
    /**
     * Check if config key exists
     */
    boolean existsByConfigKey(String configKey);
    
    /**
     * Delete by config key
     */
    void deleteByConfigKey(String configKey);
}
