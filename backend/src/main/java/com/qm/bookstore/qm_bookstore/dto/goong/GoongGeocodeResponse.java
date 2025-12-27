package com.qm.bookstore.qm_bookstore.dto.goong;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class GoongGeocodeResponse {
    private List<GoongResult> results;
    private String status;
}
