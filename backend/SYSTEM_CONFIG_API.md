# System Config API Documentation

## Overview
System Config API allows administrators to manage system-wide configuration settings stored in a key-value format. Each configuration has a type hint (string, number, boolean, json) for proper value interpretation.

---

## Endpoints

### 1. Get All System Configs (Public Access)
**GET** `/api/system-config`

**Authentication:** Not required (public access for system use)

**Query Parameters:**
- `page` (default: 0)
- `size` (default: 20)
- `sortBy` (default: "configKey")

**Request:**
```
GET /api/system-config?page=0&size=10&sortBy=configKey
```

**Response:**
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "content": [
      {
        "id": 1,
        "configKey": "default_shipping_fee",
        "configValue": "25000",
        "valueType": "number",
        "description": "Default shipping fee in VND",
        "updatedAt": "2025-11-28T10:00:00",
        "createdAt": "2025-11-28T10:00:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 6,
    "totalPages": 1
  }
}
```

---
---

### 2. Get Config by ID (Public Access)
**GET** `/api/system-config/{id}`

**Authentication:** Not required (public access for system use)

**Request:**
```
GET /api/system-config/1
```

**Response:**
{
  "code": 1000,
  "message": "Success",
  "result": {
    "id": 1,
    "configKey": "default_shipping_fee",
    "configValue": "25000",
    "valueType": "number",
    "description": "Default shipping fee in VND",
    "updatedAt": "2025-11-28T10:00:00",
    "createdAt": "2025-11-28T10:00:00"
  }
}
```
---

### 3. Get Config by Key (Public Access)
**GET** `/api/system-config/key/{configKey}`

**Authentication:** Not required (public access for system use)

**Request:**
```
GET /api/system-config/key/default_shipping_fee
```

**Response:**
**Response:**
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "id": 1,
    "configKey": "default_shipping_fee",
    "configValue": "25000",
    "valueType": "number",
    "description": "Default shipping fee in VND",
    "updatedAt": "2025-11-28T10:00:00",
    "createdAt": "2025-11-28T10:00:00"
  }
}
```

---

### 4. Create Config (Admin Only)
**POST** `/api/system-config`

**Request:**
```json
{
  "configKey": "max_order_items",
  "configValue": "50",
  "valueType": "number",
  "description": "Maximum items per order"
}
```

**Response:**
```json
{
  "code": 1000,
  "message": "System config created successfully",
  "result": {
    "id": 7,
    "configKey": "max_order_items",
    "configValue": "50",
    "valueType": "number",
    "description": "Maximum items per order",
    "updatedAt": "2025-11-28T11:00:00",
    "createdAt": "2025-11-28T11:00:00"
  }
}
```

---

### 5. Update Config (Admin Only)
**PUT** `/api/system-config/{id}`

**Request:**
```json
{
  "configValue": "30000",
  "valueType": "number",
  "description": "Updated default shipping fee"
}
```

**Response:**
```json
{
  "code": 1000,
  "message": "System config updated successfully",
  "result": {
    "id": 1,
    "configKey": "default_shipping_fee",
    "configValue": "30000",
    "valueType": "number",
    "description": "Updated default shipping fee",
    "updatedAt": "2025-11-28T12:00:00",
    "createdAt": "2025-11-28T10:00:00"
  }
}
```

---

### 6. Delete Config (Admin Only)
**DELETE** `/api/system-config/{id}`

**Request:**
```
DELETE /api/system-config/7
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "code": 1000,
  "message": "System config deleted successfully"
}
```

---

## Error Codes

| Code | Message |
|------|---------|
| 8001 | System configuration not found |
| 8002 | Configuration with this key already exists |

---

## Usage in Code

### Service Helper Methods

The `SystemConfigService` provides helper methods to retrieve typed values:

```java
// Get as String
String shippingFee = systemConfigService.getConfigValue("default_shipping_fee", "25000");

// Get as Integer
Integer maxCartItems = systemConfigService.getConfigValueAsInt("max_cart_items", 20);

// Get as Boolean
Boolean maintenanceMode = systemConfigService.getConfigValueAsBoolean("maintenance_mode", false);
```

### Example: Using Config in OrderService

```java
@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final SystemConfigService systemConfigService;
    
    public BigDecimal calculateShippingFee(String fulfillmentMethod) {
        if ("pickup".equals(fulfillmentMethod)) {
            return BigDecimal.ZERO;
        }
        
        // Get shipping fee from system config
        Integer shippingFee = systemConfigService.getConfigValueAsInt("default_shipping_fee", 25000);
        return new BigDecimal(shippingFee);
    }
}
```

---

## Frontend Integration

### TypeScript Types

```typescript
export interface SystemConfig {
  id: number;
  configKey: string;
  configValue: string;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  updatedAt: string;
  createdAt: string;
}

export interface CreateSystemConfigRequest {
  configKey: string;
  configValue: string;
  valueType?: string;
  description?: string;
}

export interface UpdateSystemConfigRequest {
  configValue?: string;
  valueType?: string;
  description?: string;
}
```

### React Admin Component Example

```tsx
import React, { useState, useEffect } from 'react';
import { SystemConfig } from '@/types/systemConfig';
import { systemConfigApi } from '@/api/systemConfigApi';

export const SystemConfigManager: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    const response = await systemConfigApi.getAll({ page: 0, size: 100 });
    setConfigs(response.content);
  };

  const handleUpdate = async (id: number, newValue: string) => {
    await systemConfigApi.update(id, { configValue: newValue });
    loadConfigs();
  };

  const handleCreate = async (key: string, value: string, type: string) => {
    await systemConfigApi.create({
      configKey: key,
      configValue: value,
      valueType: type
    });
    loadConfigs();
  };

  return (
    <div className="config-manager">
      <h2>System Configuration</h2>
      
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
            <th>Type</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {configs.map(config => (
            <tr key={config.id}>
              <td>{config.configKey}</td>
              <td>
                {editingConfig?.id === config.id ? (
                  <input
                    value={editingConfig.configValue}
                    onChange={(e) => setEditingConfig({...editingConfig, configValue: e.target.value})}
                  />
                ) : (
                  config.configValue
                )}
              </td>
              <td>{config.valueType}</td>
              <td>{config.description}</td>
              <td>
                {editingConfig?.id === config.id ? (
                  <>
                    <button onClick={() => handleUpdate(config.id, editingConfig.configValue)}>Save</button>
                    <button onClick={() => setEditingConfig(null)}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setEditingConfig(config)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
---

## Security

### Public Endpoints (No Authentication Required)
- `GET /api/system-config` - View all configurations
- `GET /api/system-config/{id}` - View configuration by ID
- `GET /api/system-config/key/{configKey}` - View configuration by key

These endpoints are public to allow the system to retrieve configurations for features like:
- Calculating shipping fees
- Checking maintenance mode
- Validating cart limits
- Auto-canceling orders

### Admin-Only Endpoints
All modification endpoints require **ADMIN** role:
```java
@PreAuthorize("hasRole('admin')")
```

Only administrators can:
- Create new configurations
- Update existing configurations
- Delete configurations

This ensures system configurations can be read by any service/component, while only admins can modify them.ions
- Update existing configurations
- Delete configurations

---

## Sample Configurations

| Key | Value | Type | Description |
|-----|-------|------|-------------|
| `default_shipping_fee` | 25000 | number | Default shipping fee in VND |
| `free_shipping_threshold` | 500000 | number | Minimum order for free shipping |
| `tax_rate` | 0.1 | number | Tax rate (10%) |
| `maintenance_mode` | false | boolean | Enable/disable maintenance mode |
| `max_cart_items` | 20 | number | Maximum items in cart |
| `order_auto_cancel_hours` | 24 | number | Auto-cancel unpaid orders after X hours |
