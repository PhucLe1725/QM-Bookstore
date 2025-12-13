package com.qm.bookstore.qm_bookstore.dto.report;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserStatisticsResponse {
    
    Integer totalUsers;
    Integer activeUsers;
    Integer newUsersInPeriod;
    
    List<UsersByDate> usersByDate;
    List<UsersByRole> usersByRole;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsersByDate {
        LocalDate date;
        Integer newUsers;
        Integer cumulativeUsers;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsersByRole {
        String roleName;
        Integer userCount;
        Double percentage;
    }
}
