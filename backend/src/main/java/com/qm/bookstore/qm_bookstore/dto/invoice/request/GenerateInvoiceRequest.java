package com.qm.bookstore.qm_bookstore.dto.invoice.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GenerateInvoiceRequest {
    Long orderId; // Required: ID của đơn hàng cần xuất hóa đơn
    
    // Optional: Thông tin công ty (nếu khách hàng là doanh nghiệp)
    String buyerTaxCode;
    String buyerCompanyName;
    String buyerCompanyAddress;
}
