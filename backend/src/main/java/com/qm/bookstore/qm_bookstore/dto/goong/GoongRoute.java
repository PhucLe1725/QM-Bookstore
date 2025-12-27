package com.qm.bookstore.qm_bookstore.dto.goong;

import lombok.Data;

import java.util.List;

@Data
public class GoongRoute {
    private List<GoongLeg> legs;
    private String summary;
}
