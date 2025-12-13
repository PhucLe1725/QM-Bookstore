# Role Management API - Frontend Implementation Guide

## Overview
This guide provides complete API documentation and implementation examples for Role CRUD operations in the QM Bookstore admin panel.

**Base URL**: `http://localhost:8080/api/roles`  
**Authentication**: Required - JWT Bearer Token  
**Authorization**: Admin role required (`ROLE_ADMIN`)

---

## Table of Contents
1. [API Endpoints](#api-endpoints)
2. [TypeScript Interfaces](#typescript-interfaces)
3. [API Service Implementation](#api-service-implementation)
4. [React Components Examples](#react-components-examples)
5. [State Management (Redux Toolkit)](#state-management-redux-toolkit)
6. [Validation Rules](#validation-rules)
7. [Error Handling](#error-handling)

---

## API Endpoints

### 1. Get All Roles
**Endpoint**: `GET /api/roles`  
**Description**: Retrieve all roles in the system  
**Authorization**: Admin only

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "code": 1000,
  "message": "Success",
  "result": [
    {
      "id": 1,
      "name": "user"
    },
    {
      "id": 2,
      "name": "admin"
    }
  ]
}
```

---

### 2. Get Role by ID
**Endpoint**: `GET /api/roles/{id}`  
**Description**: Retrieve a specific role by ID  
**Authorization**: Admin only

**Path Parameters**:
- `id` (Long): Role ID

**Request Example**:
```
GET /api/roles/1
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "id": 1,
    "name": "user"
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "code": 1009,
  "message": "Role does not exist"
}
```

---

### 3. Get Role by Name
**Endpoint**: `GET /api/roles/name/{name}`  
**Description**: Retrieve a role by its name  
**Authorization**: Admin only

**Path Parameters**:
- `name` (String): Role name

**Request Example**:
```
GET /api/roles/name/admin
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "id": 2,
    "name": "admin"
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "code": 1009,
  "message": "Role does not exist"
}
```

---

### 4. Create Role
**Endpoint**: `POST /api/roles`  
**Description**: Create a new role  
**Authorization**: Admin only

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "moderator"
}
```

**Validation Rules**:
- `name`: Required, 1-50 characters, lowercase letters and underscores only (pattern: `^[a-z_]+$`)

**Response** (200 OK):
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "id": 3,
    "name": "moderator"
  }
}
```

**Error Responses**:

**400 Bad Request** (Validation Error):
```json
{
  "code": 1003,
  "message": "Name must contain only lowercase letters and underscores",
  "errors": {
    "name": "must match \"^[a-z_]+$\""
  }
}
```

**409 Conflict** (Role Already Exists):
```json
{
  "code": 1010,
  "message": "Role already exists"
}
```

---

### 5. Update Role
**Endpoint**: `PUT /api/roles/{id}`  
**Description**: Update an existing role  
**Authorization**: Admin only

**Path Parameters**:
- `id` (Long): Role ID to update

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "super_admin"
}
```

**Response** (200 OK):
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "id": 2,
    "name": "super_admin"
  }
}
```

**Error Responses**:

**404 Not Found**:
```json
{
  "code": 1009,
  "message": "Role does not exist"
}
```

**409 Conflict** (Name Already Used):
```json
{
  "code": 1010,
  "message": "Role already exists"
}
```

---

### 6. Delete Role
**Endpoint**: `DELETE /api/roles/{id}`  
**Description**: Delete a role (hard delete)  
**Authorization**: Admin only

**Path Parameters**:
- `id` (Long): Role ID to delete

**Request Example**:
```
DELETE /api/roles/3
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "code": 1000,
  "message": "Success",
  "result": "Role deleted successfully"
}
```

**Error Response** (404 Not Found):
```json
{
  "code": 1009,
  "message": "Role does not exist"
}
```

---

## TypeScript Interfaces

```typescript
// types/role.types.ts

/**
 * Role entity interface
 */
export interface Role {
  id: number;
  name: string;
}

/**
 * Request interface for creating a new role
 */
export interface RoleCreateRequest {
  name: string; // lowercase letters and underscores only, 1-50 chars
}

/**
 * Request interface for updating a role
 */
export interface RoleUpdateRequest {
  name: string; // lowercase letters and underscores only, 1-50 chars
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  result?: T;
  errors?: Record<string, string>;
}

/**
 * Role management state
 */
export interface RoleState {
  roles: Role[];
  selectedRole: Role | null;
  loading: boolean;
  error: string | null;
}
```

---

## API Service Implementation

```typescript
// services/roleService.ts

import axios, { AxiosInstance } from 'axios';
import { Role, RoleCreateRequest, RoleUpdateRequest, ApiResponse } from '../types/role.types';

class RoleService {
  private api: AxiosInstance;
  private readonly BASE_URL = '/api/roles';

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add JWT token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    const response = await this.api.get<ApiResponse<Role[]>>(this.BASE_URL);
    return response.data.result || [];
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: number): Promise<Role> {
    const response = await this.api.get<ApiResponse<Role>>(`${this.BASE_URL}/${id}`);
    if (!response.data.result) {
      throw new Error('Role not found');
    }
    return response.data.result;
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<Role> {
    const response = await this.api.get<ApiResponse<Role>>(`${this.BASE_URL}/name/${name}`);
    if (!response.data.result) {
      throw new Error('Role not found');
    }
    return response.data.result;
  }

  /**
   * Create a new role
   */
  async createRole(data: RoleCreateRequest): Promise<Role> {
    const response = await this.api.post<ApiResponse<Role>>(this.BASE_URL, data);
    if (!response.data.result) {
      throw new Error('Failed to create role');
    }
    return response.data.result;
  }

  /**
   * Update a role
   */
  async updateRole(id: number, data: RoleUpdateRequest): Promise<Role> {
    const response = await this.api.put<ApiResponse<Role>>(`${this.BASE_URL}/${id}`, data);
    if (!response.data.result) {
      throw new Error('Failed to update role');
    }
    return response.data.result;
  }

  /**
   * Delete a role
   */
  async deleteRole(id: number): Promise<string> {
    const response = await this.api.delete<ApiResponse<string>>(`${this.BASE_URL}/${id}`);
    return response.data.result || 'Role deleted successfully';
  }

  /**
   * Validate role name format
   */
  validateRoleName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim() === '') {
      return { valid: false, error: 'Role name is required' };
    }

    if (name.length > 50) {
      return { valid: false, error: 'Role name must be 50 characters or less' };
    }

    const pattern = /^[a-z_]+$/;
    if (!pattern.test(name)) {
      return {
        valid: false,
        error: 'Role name must contain only lowercase letters and underscores',
      };
    }

    return { valid: true };
  }
}

export default new RoleService();
```

---

## React Components Examples

### 1. Role List Component

```typescript
// components/admin/RoleList.tsx

import React, { useEffect, useState } from 'react';
import { Role } from '../../types/role.types';
import roleService from '../../services/roleService';
import { toast } from 'react-toastify';

const RoleList: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await roleService.getAllRoles();
      setRoles(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete role "${name}"?`)) {
      return;
    }

    try {
      await roleService.deleteRole(id);
      toast.success('Role deleted successfully');
      loadRoles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete role');
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <button
          onClick={() => {/* Navigate to create page */}}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create New Role
        </button>
      </div>

      <div className="bg-white shadow-md rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {role.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {role.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {/* Navigate to edit page */}}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role.id, role.name)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {roles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No roles found. Create your first role.
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleList;
```

---

### 2. Role Create/Edit Form Component

```typescript
// components/admin/RoleForm.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RoleCreateRequest } from '../../types/role.types';
import roleService from '../../services/roleService';
import { toast } from 'react-toastify';

interface RoleFormProps {
  mode: 'create' | 'edit';
}

const RoleForm: React.FC<RoleFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [formData, setFormData] = useState<RoleCreateRequest>({
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');

  useEffect(() => {
    if (mode === 'edit' && id) {
      loadRole(parseInt(id));
    }
  }, [mode, id]);

  const loadRole = async (roleId: number) => {
    try {
      const role = await roleService.getRoleById(roleId);
      setFormData({ name: role.name });
    } catch (err: any) {
      toast.error('Failed to load role');
      navigate('/admin/roles');
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const validation = roleService.validateRoleName(formData.name);
    if (!validation.valid && validation.error) {
      newErrors.name = validation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (mode === 'create') {
        await roleService.createRole(formData);
        toast.success('Role created successfully');
      } else if (id) {
        await roleService.updateRole(parseInt(id), formData);
        toast.success('Role updated successfully');
      }
      
      navigate('/admin/roles');
    } catch (err: any) {
      if (err.response?.data?.code === 1010) {
        setErrors({ name: 'Role name already exists' });
      } else if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.message || `Failed to ${mode} role`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (initialLoading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h1 className="text-2xl font-bold mb-6">
          {mode === 'create' ? 'Create New Role' : 'Edit Role'}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Role Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.name ? 'border-red-500' : ''
              }`}
              placeholder="e.g., moderator, super_admin"
            />
            {errors.name && (
              <p className="text-red-500 text-xs italic mt-1">{errors.name}</p>
            )}
            <p className="text-gray-600 text-xs mt-1">
              Must contain only lowercase letters and underscores (a-z, _)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/admin/roles')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Role' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleForm;
```

---

## State Management (Redux Toolkit)

```typescript
// store/slices/roleSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Role, RoleCreateRequest, RoleUpdateRequest, RoleState } from '../../types/role.types';
import roleService from '../../services/roleService';

const initialState: RoleState = {
  roles: [],
  selectedRole: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchRoles = createAsyncThunk('roles/fetchAll', async () => {
  return await roleService.getAllRoles();
});

export const fetchRoleById = createAsyncThunk('roles/fetchById', async (id: number) => {
  return await roleService.getRoleById(id);
});

export const createRole = createAsyncThunk(
  'roles/create',
  async (data: RoleCreateRequest, { rejectWithValue }) => {
    try {
      return await roleService.createRole(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateRole = createAsyncThunk(
  'roles/update',
  async ({ id, data }: { id: number; data: RoleUpdateRequest }, { rejectWithValue }) => {
    try {
      return await roleService.updateRole(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteRole = createAsyncThunk(
  'roles/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await roleService.deleteRole(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedRole: (state) => {
      state.selectedRole = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all roles
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action: PayloadAction<Role[]>) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch roles';
      });

    // Fetch role by ID
    builder
      .addCase(fetchRoleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoleById.fulfilled, (state, action: PayloadAction<Role>) => {
        state.loading = false;
        state.selectedRole = action.payload;
      })
      .addCase(fetchRoleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch role';
      });

    // Create role
    builder
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state, action: PayloadAction<Role>) => {
        state.loading = false;
        state.roles.push(action.payload);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create role';
      });

    // Update role
    builder
      .addCase(updateRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action: PayloadAction<Role>) => {
        state.loading = false;
        const index = state.roles.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
        if (state.selectedRole?.id === action.payload.id) {
          state.selectedRole = action.payload;
        }
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update role';
      });

    // Delete role
    builder
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.roles = state.roles.filter((r) => r.id !== action.payload);
        if (state.selectedRole?.id === action.payload) {
          state.selectedRole = null;
        }
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete role';
      });
  },
});

export const { clearError, clearSelectedRole } = roleSlice.actions;
export default roleSlice.reducer;
```

---

## Validation Rules

### Role Name Validation

**Field**: `name`

**Rules**:
1. **Required**: Cannot be empty or null
2. **Length**: 1-50 characters
3. **Pattern**: Must match regex `^[a-z_]+$` (lowercase letters and underscores only)

**Client-side Validation Function**:
```typescript
const validateRoleName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Role name is required' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Role name must be 50 characters or less' };
  }

  const pattern = /^[a-z_]+$/;
  if (!pattern.test(name)) {
    return {
      valid: false,
      error: 'Role name must contain only lowercase letters and underscores',
    };
  }

  return { valid: true };
};
```

**Valid Examples**:
- `user`
- `admin`
- `super_admin`
- `moderator`
- `content_manager`

**Invalid Examples**:
- `Admin` (uppercase)
- `super-admin` (hyphen not allowed)
- `user123` (numbers not allowed)
- `user role` (spaces not allowed)
- `` (empty)

---

## Error Handling

### Error Code Reference

| Code | Message | Description | Handling |
|------|---------|-------------|----------|
| 1000 | Success | Request successful | Display success message |
| 1001 | Uncategorized exception | Unexpected error | Show generic error, log details |
| 1003 | Invalid validation | Validation failed | Display field errors to user |
| 1006 | Unauthenticated | No valid JWT token | Redirect to login |
| 1007 | Unauthorized | User lacks admin role | Show 403 page |
| 1009 | Role does not exist | Role not found | Show "Not Found" message |
| 1010 | Role already exists | Duplicate role name | Display validation error |

---

### Error Handling Implementation

```typescript
// utils/errorHandler.ts

import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

interface ApiError {
  code: number;
  message: string;
  errors?: Record<string, string>;
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;
    
    switch (apiError?.code) {
      case 1003: // Validation error
        if (apiError.errors) {
          // Return first error message
          const firstError = Object.values(apiError.errors)[0];
          return firstError;
        }
        return apiError.message;
        
      case 1006: // Unauthenticated
        localStorage.removeItem('token');
        window.location.href = '/login';
        return 'Session expired. Please login again.';
        
      case 1007: // Unauthorized
        toast.error('You do not have permission to perform this action');
        return 'Permission denied';
        
      case 1009: // Role not found
        return 'Role not found';
        
      case 1010: // Role already exists
        return 'A role with this name already exists';
        
      default:
        return apiError?.message || 'An unexpected error occurred';
    }
  }
  
  return 'Network error. Please check your connection.';
};

// Usage in components
try {
  await roleService.createRole(formData);
  toast.success('Role created successfully');
} catch (error) {
  const errorMessage = handleApiError(error);
  toast.error(errorMessage);
}
```

---

## Complete Usage Example

```typescript
// pages/admin/RoleManagement.tsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { fetchRoles } from '../../store/slices/roleSlice';
import RoleList from '../../components/admin/RoleList';
import RoleForm from '../../components/admin/RoleForm';

const RoleManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { roles, loading, error } = useSelector((state: RootState) => state.roles);

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<RoleList />} />
        <Route path="/create" element={<RoleForm mode="create" />} />
        <Route path="/edit/:id" element={<RoleForm mode="edit" />} />
      </Routes>
    </div>
  );
};

export default RoleManagement;
```

---

## Testing Examples

### Unit Tests for Role Service

```typescript
// services/__tests__/roleService.test.ts

import roleService from '../roleService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RoleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'fake-jwt-token');
  });

  describe('validateRoleName', () => {
    it('should accept valid role names', () => {
      expect(roleService.validateRoleName('user').valid).toBe(true);
      expect(roleService.validateRoleName('super_admin').valid).toBe(true);
    });

    it('should reject empty names', () => {
      const result = roleService.validateRoleName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Role name is required');
    });

    it('should reject names with uppercase', () => {
      const result = roleService.validateRoleName('Admin');
      expect(result.valid).toBe(false);
    });

    it('should reject names with special characters', () => {
      const result = roleService.validateRoleName('super-admin');
      expect(result.valid).toBe(false);
    });

    it('should reject names longer than 50 characters', () => {
      const result = roleService.validateRoleName('a'.repeat(51));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('50 characters');
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        { id: 1, name: 'user' },
        { id: 2, name: 'admin' },
      ];
      
      mockedAxios.create.mockReturnThis();
      mockedAxios.get.mockResolvedValue({
        data: { code: 1000, result: mockRoles },
      });

      const roles = await roleService.getAllRoles();
      expect(roles).toEqual(mockRoles);
    });
  });
});
```

---

## Notes

1. **Security**: All endpoints require admin authentication. Always include JWT token in headers.

2. **Role Name Format**: 
   - Must use lowercase letters only
   - Underscores allowed for multi-word names (e.g., `super_admin`)
   - No spaces, hyphens, or special characters
   - Maximum 50 characters

3. **Hard Delete**: The delete operation is permanent. Consider implementing soft delete or adding confirmation dialogs.

4. **System Roles**: Protect system-critical roles (like `user` and `admin`) from deletion in your frontend logic.

5. **Error Handling**: Always handle error codes 1006 (Unauthenticated) and 1007 (Unauthorized) properly by redirecting to login or showing permission denied messages.

6. **Duplicate Prevention**: Backend validates duplicate role names. Display appropriate error messages when code 1010 is returned.

7. **MapStruct Warnings**: The compilation warnings about "Unmapped target property: id" are expected - the ID is auto-generated by the database and shouldn't be mapped from request DTOs.

---

## Quick Start Checklist

- [ ] Copy TypeScript interfaces to your project
- [ ] Implement RoleService with axios configuration
- [ ] Create RoleList component for displaying roles
- [ ] Create RoleForm component for create/edit operations
- [ ] Add routes to your React Router configuration
- [ ] Implement Redux slice if using Redux
- [ ] Add error handling utilities
- [ ] Configure JWT authentication interceptor
- [ ] Test all CRUD operations
- [ ] Add loading states and error messages
- [ ] Implement confirmation dialogs for delete operations

---

**Last Updated**: December 12, 2024  
**API Version**: 1.0  
**Backend Version**: Spring Boot 3.5.4
