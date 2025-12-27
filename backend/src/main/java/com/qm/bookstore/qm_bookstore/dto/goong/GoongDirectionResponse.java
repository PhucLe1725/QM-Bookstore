package com.qm.bookstore.qm_bookstore.dto.goong;

import lombok.Data;

import java.util.List;

@Data
public class GoongDirectionResponse {
    private List<GoongRoute> routes;
    private String status;
}
