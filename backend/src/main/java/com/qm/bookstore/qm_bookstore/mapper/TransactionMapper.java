package com.qm.bookstore.qm_bookstore.mapper;

import com.qm.bookstore.qm_bookstore.dto.transaction.response.TransactionResponse;
import com.qm.bookstore.qm_bookstore.entity.Transaction;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TransactionMapper {
    
    TransactionResponse toTransactionResponse(Transaction transaction);
}
