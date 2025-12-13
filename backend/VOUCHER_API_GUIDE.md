# 🎫 Hướng Dẫn API Voucher - Frontend Implementation Guide

## 📋 Tổng Quan

Hệ thống Voucher hỗ trợ 2 loại giảm giá:
- **ORDER**: Giảm giá trên tổng tiền đơn hàng
- **SHIPPING**: Giảm giá phí vận chuyển

Mỗi voucher có thể giảm theo:
- **PERCENT**: Giảm theo phần trăm (VD: 10%)
- **FIXED**: Giảm số tiền cố định (VD: 50,000đ)

## 🔍 Phân Tích Logic Backend

### 1. ✅ Logic Tạo Voucher (CREATE)

**Endpoint:** `POST /api/vouchers`

**Authorization:** Admin only (`hasRole('ADMIN')`)

**Validations:**

#### Backend Validation Rules:
1. **Code:**
   - Required, không được để trống
   - Tối đa 50 ký tự
   - Chỉ chứa chữ HOA, số, gạch ngang (-) và gạch dưới (_)
   - Pattern: `^[A-Z0-9_-]+$`
   - Phải unique (không trùng với voucher khác)

2. **Discount Amount:**
   - Required, phải > 0
   - Nếu `discountType = PERCENT`: phải <= 100

3. **Discount Type:**
   - Required
   - Chỉ nhận: `PERCENT` hoặc `FIXED`

4. **Apply To:**
   - Required
   - Chỉ nhận: `ORDER` hoặc `SHIPPING`

5. **Min Order Amount:**
   - Optional, mặc định = 0
   - Phải >= 0

6. **Max Discount:**
   - Optional
   - Chỉ áp dụng cho `PERCENT` type
   - Nếu `discountType = FIXED` và có maxDiscount → **LỖI**
   - Phải > 0 nếu có

7. **Valid From & Valid To:**
   - Required
   - `validFrom` phải <= hiện tại hoặc tương lai
   - `validTo` phải > hiện tại
   - `validTo` phải > `validFrom`

8. **Usage Limit:**
   - Required, phải >= 1
   - Số lượt sử dụng tối đa của voucher

9. **Per User Limit:**
   - Optional, mặc định = 1
   - Phải >= 1 nếu có
   - Số lần mỗi user được sử dụng voucher này

10. **Status:**
    - Optional, mặc định = true

### 2. ✅ Logic Cập Nhật Voucher (UPDATE)

**Endpoint:** `PUT /api/vouchers/{id}`

**Authorization:** Admin only

**Các trường có thể cập nhật:**
- `description` ✅
- `validFrom` ✅ (phải FutureOrPresent)
- `validTo` ✅ (phải Future)
- `usageLimit` ✅ (phải >= 1)
- `perUserLimit` ✅ (phải >= 1)
- `status` ✅ (enable/disable voucher)
- `minOrderAmount` ✅ (phải >= 0)
- `maxDiscount` ✅ (phải > 0)

**Các trường KHÔNG thể cập nhật:**
- ❌ `code` - Không được đổi mã voucher
- ❌ `discountAmount` - Không được đổi giá trị giảm
- ❌ `discountType` - Không được đổi loại giảm (PERCENT/FIXED)
- ❌ `applyTo` - Không được đổi loại áp dụng (ORDER/SHIPPING)
- ❌ `usedCount` - Tự động tăng khi voucher được sử dụng

**Lưu ý:**
- Update không check code trùng (vì code không thể đổi)
- Nếu muốn "disable" voucher tạm thời → set `status = false`

### 3. ✅ Logic Xóa Voucher (DELETE)

**Endpoint:** `DELETE /api/vouchers/{id}`

**Authorization:** Admin only

**Behavior:**
- **Hard Delete** - Xóa hẳn khỏi database
- Nếu voucher đã được sử dụng trong orders, có thể gây lỗi foreign key
- **Khuyến nghị:** Nên dùng soft delete bằng cách set `status = false` thay vì xóa

**Frontend nên:**
- Hiển thị cảnh báo trước khi xóa
- Kiểm tra xem voucher đã được sử dụng chưa
- Đề xuất "Vô hiệu hóa" (disable) thay vì xóa

---

## 🎨 Frontend Implementation

### 📦 Data Models (TypeScript)

```typescript
// Enum Types
export enum VoucherDiscountType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED'
}

export enum VoucherApplyTo {
  ORDER = 'ORDER',
  SHIPPING = 'SHIPPING'
}

// Voucher Response
export interface VoucherResponse {
  id: number;
  code: string;
  discountAmount: number;
  discountType: VoucherDiscountType;
  applyTo: VoucherApplyTo;
  minOrderAmount: number;
  maxDiscount?: number;
  description?: string;
  validFrom: string; // ISO datetime
  validTo: string; // ISO datetime
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  status: boolean;
  createdAt: string;
}

// Create Request
export interface VoucherCreateRequest {
  code: string; // Uppercase, alphanumeric, -, _
  discountAmount: number;
  discountType: VoucherDiscountType;
  applyTo: VoucherApplyTo;
  minOrderAmount?: number;
  maxDiscount?: number;
  description?: string;
  validFrom: string; // ISO datetime
  validTo: string; // ISO datetime
  usageLimit: number;
  perUserLimit?: number; // default = 1
  status?: boolean; // default = true
}

// Update Request
export interface VoucherUpdateRequest {
  description?: string;
  validFrom?: string;
  validTo?: string;
  usageLimit?: number;
  perUserLimit?: number;
  status?: boolean;
  minOrderAmount?: number;
  maxDiscount?: number;
}

// Validate Request & Response
export interface ValidateVoucherRequest {
  voucherCode: string;
  orderTotal: number;
  shippingFee: number;
  userId?: string; // Optional, để check per-user limit
}

export interface ValidateVoucherResponse {
  valid: boolean;
  discountValue: number; // Số tiền được giảm
  applyTo?: VoucherApplyTo;
  code?: string;
  discountType?: VoucherDiscountType;
  discountAmount?: number;
  message: string; // Success or error message
}
```

---

## 🔨 API Services (React/Vue/Angular)

### 1. Create Voucher (Admin)

```typescript
export const createVoucher = async (data: VoucherCreateRequest): Promise<VoucherResponse> => {
  const response = await api.post('/api/vouchers', data, {
    headers: {
      Authorization: `Bearer ${getAdminToken()}`
    }
  });
  return response.data.result;
};
```

**Frontend Validation trước khi submit:**

```typescript
const validateCreateForm = (data: VoucherCreateRequest): string[] => {
  const errors: string[] = [];
  
  // Code validation
  if (!data.code) {
    errors.push('Mã voucher không được để trống');
  } else if (!/^[A-Z0-9_-]+$/.test(data.code)) {
    errors.push('Mã voucher chỉ chứa chữ HOA, số, gạch ngang và gạch dưới');
  } else if (data.code.length > 50) {
    errors.push('Mã voucher không quá 50 ký tự');
  }
  
  // Discount Amount
  if (!data.discountAmount || data.discountAmount <= 0) {
    errors.push('Giá trị giảm phải lớn hơn 0');
  }
  
  if (data.discountType === VoucherDiscountType.PERCENT) {
    if (data.discountAmount > 100) {
      errors.push('Giảm theo % không được vượt quá 100');
    }
    // maxDiscount is allowed for PERCENT
  }
  
  if (data.discountType === VoucherDiscountType.FIXED) {
    if (data.maxDiscount) {
      errors.push('Voucher giảm cố định không dùng giá trị giảm tối đa');
    }
  }
  
  // Date validation
  const validFrom = new Date(data.validFrom);
  const validTo = new Date(data.validTo);
  const now = new Date();
  
  if (validFrom < now) {
    errors.push('Ngày bắt đầu phải từ hiện tại trở đi');
  }
  
  if (validTo <= validFrom) {
    errors.push('Ngày kết thúc phải sau ngày bắt đầu');
  }
  
  // Usage limits
  if (!data.usageLimit || data.usageLimit < 1) {
    errors.push('Số lượt sử dụng phải >= 1');
  }
  
  if (data.perUserLimit && data.perUserLimit < 1) {
    errors.push('Số lượt/user phải >= 1');
  }
  
  // Min order amount
  if (data.minOrderAmount && data.minOrderAmount < 0) {
    errors.push('Giá trị đơn hàng tối thiểu không được âm');
  }
  
  return errors;
};
```

### 2. Update Voucher (Admin)

```typescript
export const updateVoucher = async (
  id: number, 
  data: VoucherUpdateRequest
): Promise<VoucherResponse> => {
  const response = await api.put(`/api/vouchers/${id}`, data, {
    headers: {
      Authorization: `Bearer ${getAdminToken()}`
    }
  });
  return response.data.result;
};
```

**Frontend Validation:**

```typescript
const validateUpdateForm = (data: VoucherUpdateRequest): string[] => {
  const errors: string[] = [];
  
  // Date validation (nếu có update)
  if (data.validFrom && data.validTo) {
    const validFrom = new Date(data.validFrom);
    const validTo = new Date(data.validTo);
    
    if (validTo <= validFrom) {
      errors.push('Ngày kết thúc phải sau ngày bắt đầu');
    }
  }
  
  // Usage limit
  if (data.usageLimit && data.usageLimit < 1) {
    errors.push('Số lượt sử dụng phải >= 1');
  }
  
  // Per user limit
  if (data.perUserLimit && data.perUserLimit < 1) {
    errors.push('Số lượt/user phải >= 1');
  }
  
  // Min order amount
  if (data.minOrderAmount !== undefined && data.minOrderAmount < 0) {
    errors.push('Giá trị đơn hàng tối thiểu không được âm');
  }
  
  // Max discount
  if (data.maxDiscount !== undefined && data.maxDiscount <= 0) {
    errors.push('Giá trị giảm tối đa phải > 0');
  }
  
  return errors;
};
```

### 3. Delete Voucher (Admin)

```typescript
export const deleteVoucher = async (id: number): Promise<void> => {
  await api.delete(`/api/vouchers/${id}`, {
    headers: {
      Authorization: `Bearer ${getAdminToken()}`
    }
  });
};
```

**Frontend Flow:**

```typescript
const handleDelete = async (voucher: VoucherResponse) => {
  // Show confirmation
  const confirmed = await showConfirmDialog({
    title: 'Xác nhận xóa voucher',
    message: `Bạn có chắc muốn xóa voucher "${voucher.code}"?`,
    warning: voucher.usedCount > 0 
      ? `Voucher này đã được sử dụng ${voucher.usedCount} lần. Việc xóa có thể ảnh hưởng đến dữ liệu đơn hàng.`
      : null,
    options: [
      { label: 'Vô hiệu hóa', value: 'disable', variant: 'secondary' },
      { label: 'Xóa vĩnh viễn', value: 'delete', variant: 'danger' },
      { label: 'Hủy', value: 'cancel' }
    ]
  });
  
  if (confirmed === 'disable') {
    // Soft delete - just disable
    await updateVoucher(voucher.id, { status: false });
    showToast('Đã vô hiệu hóa voucher', 'success');
  } else if (confirmed === 'delete') {
    // Hard delete
    await deleteVoucher(voucher.id);
    showToast('Đã xóa voucher', 'success');
  }
};
```

### 4. Get All Vouchers (Admin)

```typescript
export interface VoucherFilterParams {
  page?: number;
  size?: number;
  status?: boolean;
  applyTo?: VoucherApplyTo;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export const getAllVouchers = async (
  params: VoucherFilterParams
): Promise<Page<VoucherResponse>> => {
  const response = await api.get('/api/vouchers/admin/all', {
    params,
    headers: {
      Authorization: `Bearer ${getAdminToken()}`
    }
  });
  return response.data.result;
};
```

### 5. Get Available Vouchers (Public)

```typescript
export const getAvailableVouchers = async (): Promise<VoucherResponse[]> => {
  const response = await api.get('/api/vouchers/available');
  return response.data.result;
};
```

**Voucher sẽ hiển thị nếu:**
- `status = true`
- `validFrom <= now <= validTo`
- `usedCount < usageLimit`

### 6. Validate Voucher (User - Before Checkout)

```typescript
export const validateVoucher = async (
  request: ValidateVoucherRequest
): Promise<ValidateVoucherResponse> => {
  const response = await api.post('/api/vouchers/validate', request);
  return response.data.result;
};
```

**Usage trong Checkout:**

```typescript
const handleApplyVoucher = async () => {
  try {
    const result = await validateVoucher({
      voucherCode: voucherInput.value,
      orderTotal: cartTotal,
      shippingFee: shippingCost,
      userId: currentUser?.id // Optional
    });
    
    if (result.valid) {
      // Apply discount
      setAppliedVoucher(result);
      
      if (result.applyTo === VoucherApplyTo.ORDER) {
        setOrderDiscount(result.discountValue);
        showToast(`Giảm ${formatCurrency(result.discountValue)} cho đơn hàng`, 'success');
      } else if (result.applyTo === VoucherApplyTo.SHIPPING) {
        setShippingDiscount(result.discountValue);
        showToast(`Miễn phí ship ${formatCurrency(result.discountValue)}`, 'success');
      }
    } else {
      // Show error
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Lỗi khi áp dụng voucher', 'error');
  }
};
```

---

## 🎯 UI Components

### 1. Voucher Create/Edit Form

```typescript
interface VoucherFormProps {
  mode: 'create' | 'edit';
  initialData?: VoucherResponse;
  onSubmit: (data: VoucherCreateRequest | VoucherUpdateRequest) => void;
  onCancel: () => void;
}

const VoucherForm: React.FC<VoucherFormProps> = ({ mode, initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    discountAmount: initialData?.discountAmount || 0,
    discountType: initialData?.discountType || VoucherDiscountType.PERCENT,
    applyTo: initialData?.applyTo || VoucherApplyTo.ORDER,
    minOrderAmount: initialData?.minOrderAmount || 0,
    maxDiscount: initialData?.maxDiscount || undefined,
    description: initialData?.description || '',
    validFrom: initialData?.validFrom || '',
    validTo: initialData?.validTo || '',
    usageLimit: initialData?.usageLimit || 100,
    perUserLimit: initialData?.perUserLimit || 1,
    status: initialData?.status ?? true
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  
  const handleSubmit = () => {
    const validationErrors = mode === 'create' 
      ? validateCreateForm(formData)
      : validateUpdateForm(formData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    onSubmit(formData);
  };
  
  return (
    <form>
      {/* Code field - disabled in edit mode */}
      <TextField
        label="Mã Voucher"
        value={formData.code}
        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
        placeholder="SUMMER2025"
        disabled={mode === 'edit'}
        helperText={mode === 'edit' ? 'Không thể thay đổi mã voucher' : 'Chỉ chữ HOA, số, - và _'}
      />
      
      {/* Discount Type - disabled in edit mode */}
      <RadioGroup
        label="Loại giảm giá"
        value={formData.discountType}
        onChange={(value) => setFormData({...formData, discountType: value})}
        disabled={mode === 'edit'}
        options={[
          { label: 'Phần trăm (%)', value: VoucherDiscountType.PERCENT },
          { label: 'Số tiền cố định (đ)', value: VoucherDiscountType.FIXED }
        ]}
      />
      
      {/* Discount Amount - disabled in edit mode */}
      <NumberField
        label={formData.discountType === VoucherDiscountType.PERCENT ? 'Giảm (%)' : 'Giảm (VNĐ)'}
        value={formData.discountAmount}
        onChange={(value) => setFormData({...formData, discountAmount: value})}
        disabled={mode === 'edit'}
        min={0}
        max={formData.discountType === VoucherDiscountType.PERCENT ? 100 : undefined}
      />
      
      {/* Apply To - disabled in edit mode */}
      <RadioGroup
        label="Áp dụng cho"
        value={formData.applyTo}
        onChange={(value) => setFormData({...formData, applyTo: value})}
        disabled={mode === 'edit'}
        options={[
          { label: 'Tổng đơn hàng', value: VoucherApplyTo.ORDER },
          { label: 'Phí vận chuyển', value: VoucherApplyTo.SHIPPING }
        ]}
      />
      
      {/* Min Order Amount - editable */}
      <NumberField
        label="Giá trị đơn hàng tối thiểu (VNĐ)"
        value={formData.minOrderAmount}
        onChange={(value) => setFormData({...formData, minOrderAmount: value})}
        min={0}
      />
      
      {/* Max Discount - only for PERCENT, editable */}
      {formData.discountType === VoucherDiscountType.PERCENT && (
        <NumberField
          label="Giảm tối đa (VNĐ)"
          value={formData.maxDiscount}
          onChange={(value) => setFormData({...formData, maxDiscount: value})}
          min={0}
          helperText="Số tiền giảm tối đa cho voucher %"
        />
      )}
      
      {/* Description - editable */}
      <TextArea
        label="Mô tả"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        maxLength={1000}
      />
      
      {/* Valid From - editable */}
      <DateTimePicker
        label="Ngày bắt đầu"
        value={formData.validFrom}
        onChange={(value) => setFormData({...formData, validFrom: value})}
        minDate={new Date()}
      />
      
      {/* Valid To - editable */}
      <DateTimePicker
        label="Ngày kết thúc"
        value={formData.validTo}
        onChange={(value) => setFormData({...formData, validTo: value})}
        minDate={formData.validFrom || new Date()}
      />
      
      {/* Usage Limit - editable */}
      <NumberField
        label="Số lượt sử dụng tối đa"
        value={formData.usageLimit}
        onChange={(value) => setFormData({...formData, usageLimit: value})}
        min={1}
      />
      
      {/* Per User Limit - editable */}
      <NumberField
        label="Số lượt/người dùng"
        value={formData.perUserLimit}
        onChange={(value) => setFormData({...formData, perUserLimit: value})}
        min={1}
        helperText="Mỗi user được sử dụng voucher này tối đa bao nhiêu lần"
      />
      
      {/* Status - editable */}
      <Switch
        label="Kích hoạt"
        checked={formData.status}
        onChange={(checked) => setFormData({...formData, status: checked})}
      />
      
      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="error">
          <ul>
            {errors.map((err, idx) => <li key={idx}>{err}</li>)}
          </ul>
        </Alert>
      )}
      
      {/* Actions */}
      <ButtonGroup>
        <Button onClick={handleSubmit} variant="primary">
          {mode === 'create' ? 'Tạo Voucher' : 'Cập Nhật'}
        </Button>
        <Button onClick={onCancel} variant="secondary">Hủy</Button>
      </ButtonGroup>
    </form>
  );
};
```

### 2. Voucher Card (Display)

```typescript
const VoucherCard: React.FC<{ voucher: VoucherResponse; onApply?: () => void }> = ({ voucher, onApply }) => {
  const isExpired = new Date(voucher.validTo) < new Date();
  const isNotStarted = new Date(voucher.validFrom) > new Date();
  const isFullyUsed = voucher.usedCount >= voucher.usageLimit;
  const isDisabled = !voucher.status || isExpired || isNotStarted || isFullyUsed;
  
  const getDiscountText = () => {
    if (voucher.discountType === VoucherDiscountType.PERCENT) {
      return `Giảm ${voucher.discountAmount}%`;
    } else {
      return `Giảm ${formatCurrency(voucher.discountAmount)}`;
    }
  };
  
  const getApplyToText = () => {
    return voucher.applyTo === VoucherApplyTo.ORDER ? 'Đơn hàng' : 'Phí ship';
  };
  
  const getStatusBadge = () => {
    if (isExpired) return <Badge color="gray">Hết hạn</Badge>;
    if (isNotStarted) return <Badge color="blue">Sắp diễn ra</Badge>;
    if (isFullyUsed) return <Badge color="red">Hết lượt</Badge>;
    if (!voucher.status) return <Badge color="gray">Vô hiệu</Badge>;
    return <Badge color="green">Khả dụng</Badge>;
  };
  
  return (
    <Card className={isDisabled ? 'opacity-50' : ''}>
      <div className="voucher-header">
        <h3>{voucher.code}</h3>
        {getStatusBadge()}
      </div>
      
      <div className="voucher-body">
        <div className="discount-text">{getDiscountText()}</div>
        <div className="apply-to">Áp dụng cho: {getApplyToText()}</div>
        
        {voucher.minOrderAmount > 0 && (
          <div className="condition">
            Đơn tối thiểu: {formatCurrency(voucher.minOrderAmount)}
          </div>
        )}
        
        {voucher.maxDiscount && (
          <div className="condition">
            Giảm tối đa: {formatCurrency(voucher.maxDiscount)}
          </div>
        )}
        
        <div className="validity">
          HSD: {formatDate(voucher.validFrom)} - {formatDate(voucher.validTo)}
        </div>
        
        <div className="usage">
          Đã dùng: {voucher.usedCount}/{voucher.usageLimit}
        </div>
        
        {voucher.description && (
          <div className="description">{voucher.description}</div>
        )}
      </div>
      
      {onApply && !isDisabled && (
        <Button onClick={onApply} fullWidth>
          Áp dụng
        </Button>
      )}
    </Card>
  );
};
```

### 3. Voucher List (Admin)

```typescript
const VoucherListAdmin: React.FC = () => {
  const [vouchers, setVouchers] = useState<Page<VoucherResponse>>();
  const [filters, setFilters] = useState<VoucherFilterParams>({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDirection: 'DESC'
  });
  
  useEffect(() => {
    loadVouchers();
  }, [filters]);
  
  const loadVouchers = async () => {
    const data = await getAllVouchers(filters);
    setVouchers(data);
  };
  
  const handleDelete = async (voucher: VoucherResponse) => {
    // Implement delete logic (see above)
  };
  
  return (
    <div>
      <div className="header">
        <h1>Quản Lý Voucher</h1>
        <Button onClick={() => navigate('/admin/vouchers/create')}>
          Tạo Voucher Mới
        </Button>
      </div>
      
      <div className="filters">
        <Select
          label="Trạng thái"
          value={filters.status}
          onChange={(value) => setFilters({...filters, status: value})}
          options={[
            { label: 'Tất cả', value: undefined },
            { label: 'Kích hoạt', value: true },
            { label: 'Vô hiệu', value: false }
          ]}
        />
        
        <Select
          label="Áp dụng cho"
          value={filters.applyTo}
          onChange={(value) => setFilters({...filters, applyTo: value})}
          options={[
            { label: 'Tất cả', value: undefined },
            { label: 'Đơn hàng', value: VoucherApplyTo.ORDER },
            { label: 'Phí ship', value: VoucherApplyTo.SHIPPING }
          ]}
        />
      </div>
      
      <Table>
        <TableHead>
          <tr>
            <th>Mã</th>
            <th>Giảm giá</th>
            <th>Áp dụng</th>
            <th>Thời hạn</th>
            <th>Lượt dùng</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </TableHead>
        <TableBody>
          {vouchers?.content.map(voucher => (
            <tr key={voucher.id}>
              <td><strong>{voucher.code}</strong></td>
              <td>
                {voucher.discountType === VoucherDiscountType.PERCENT 
                  ? `${voucher.discountAmount}%`
                  : formatCurrency(voucher.discountAmount)}
              </td>
              <td>{voucher.applyTo === VoucherApplyTo.ORDER ? 'Đơn hàng' : 'Phí ship'}</td>
              <td>
                <div>{formatDate(voucher.validFrom)}</div>
                <div>{formatDate(voucher.validTo)}</div>
              </td>
              <td>{voucher.usedCount}/{voucher.usageLimit}</td>
              <td>
                <Switch
                  checked={voucher.status}
                  onChange={(checked) => updateVoucher(voucher.id, { status: checked })}
                />
              </td>
              <td>
                <IconButton onClick={() => navigate(`/admin/vouchers/${voucher.id}/edit`)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(voucher)}>
                  <DeleteIcon />
                </IconButton>
              </td>
            </tr>
          ))}
        </TableBody>
      </Table>
      
      <Pagination
        currentPage={filters.page}
        totalPages={vouchers?.totalPages || 0}
        onPageChange={(page) => setFilters({...filters, page})}
      />
    </div>
  );
};
```

---

## ⚠️ Các Lỗi Thường Gặp & Xử Lý

### Backend Error Codes

```typescript
enum VoucherErrorCode {
  VOUCHER_NOT_FOUND = 'VOUCHER_NOT_FOUND',
  VOUCHER_CODE_EXISTED = 'VOUCHER_CODE_EXISTED',
  INVALID_VOUCHER_DATE_RANGE = 'INVALID_VOUCHER_DATE_RANGE',
  INVALID_DISCOUNT_PERCENT = 'INVALID_DISCOUNT_PERCENT',
  MAX_DISCOUNT_NOT_ALLOWED_FOR_FIXED = 'MAX_DISCOUNT_NOT_ALLOWED_FOR_FIXED'
}
```

### Error Messages (Vietnamese)

```typescript
const errorMessages: Record<string, string> = {
  VOUCHER_NOT_FOUND: 'Không tìm thấy voucher',
  VOUCHER_CODE_EXISTED: 'Mã voucher đã tồn tại',
  INVALID_VOUCHER_DATE_RANGE: 'Ngày kết thúc phải sau ngày bắt đầu',
  INVALID_DISCOUNT_PERCENT: 'Giá trị giảm % phải <= 100',
  MAX_DISCOUNT_NOT_ALLOWED_FOR_FIXED: 'Voucher giảm cố định không dùng giá trị giảm tối đa'
};
```

---

## 📝 Test Cases

### Create Voucher

```typescript
describe('Create Voucher', () => {
  test('should create ORDER voucher with PERCENT discount', async () => {
    const data: VoucherCreateRequest = {
      code: 'SUMMER2025',
      discountAmount: 10,
      discountType: VoucherDiscountType.PERCENT,
      applyTo: VoucherApplyTo.ORDER,
      minOrderAmount: 100000,
      maxDiscount: 50000,
      validFrom: '2025-06-01T00:00:00',
      validTo: '2025-08-31T23:59:59',
      usageLimit: 1000,
      perUserLimit: 3,
      status: true
    };
    
    const result = await createVoucher(data);
    expect(result.code).toBe('SUMMER2025');
  });
  
  test('should fail with invalid code format', async () => {
    const data = {
      code: 'summer2025', // lowercase - invalid
      // ... other fields
    };
    
    await expect(createVoucher(data)).rejects.toThrow();
  });
  
  test('should fail with PERCENT > 100', async () => {
    const data = {
      discountAmount: 150,
      discountType: VoucherDiscountType.PERCENT,
      // ... other fields
    };
    
    await expect(createVoucher(data)).rejects.toThrow();
  });
});
```

---

## 🎓 Best Practices

### 1. **Code Generation**
```typescript
const generateVoucherCode = (prefix: string = 'PROMO'): string => {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${randomPart}`;
};
```

### 2. **Date Formatting**
```typescript
const formatVoucherDate = (date: Date): string => {
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

### 3. **Currency Formatting**
```typescript
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};
```

### 4. **Voucher Status Check**
```typescript
const isVoucherUsable = (voucher: VoucherResponse): boolean => {
  const now = new Date();
  const validFrom = new Date(voucher.validFrom);
  const validTo = new Date(voucher.validTo);
  
  return (
    voucher.status &&
    now >= validFrom &&
    now <= validTo &&
    voucher.usedCount < voucher.usageLimit
  );
};
```

---

## 🚀 Deployment Checklist

- [ ] Đã validate form đầy đủ trước khi submit
- [ ] Đã xử lý các error codes từ backend
- [ ] Đã disable các trường không được update (code, discountType, applyTo, etc.)
- [ ] Đã implement soft delete (disable) thay vì hard delete
- [ ] Đã hiển thị warning khi xóa voucher đã được sử dụng
- [ ] Đã format currency và date đúng chuẩn
- [ ] Đã check trạng thái voucher trước khi cho phép apply
- [ ] Đã implement pagination cho danh sách voucher
- [ ] Đã test với các trường hợp edge case (expired, fully used, etc.)
- [ ] Đã optimize performance (lazy load, debounce search, etc.)

---

## 📞 Support

Nếu có vấn đề với API, liên hệ Backend team hoặc check:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Error logs tại backend console
- Database để kiểm tra data integrity
