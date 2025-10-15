package com.qm.bookstore.qm_bookstore.repository;

import com.qm.bookstore.qm_bookstore.dto.user.response.UserResponse;
import com.qm.bookstore.qm_bookstore.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u")
    List<User> findAllUsers();

    @Query(value = "SELECT * FROM users ORDER BY " +
           "CASE WHEN :sortBy = 'username' AND :sortDirection = 'asc' THEN username END ASC, " +
           "CASE WHEN :sortBy = 'username' AND :sortDirection = 'desc' THEN username END DESC, " +
           "CASE WHEN :sortBy = 'email' AND :sortDirection = 'asc' THEN email END ASC, " +
           "CASE WHEN :sortBy = 'email' AND :sortDirection = 'desc' THEN email END DESC, " +
           "CASE WHEN :sortBy = 'createdAt' AND :sortDirection = 'asc' THEN created_at END ASC, " +
           "CASE WHEN :sortBy = 'createdAt' AND :sortDirection = 'desc' THEN created_at END DESC, " +
           "CASE WHEN :sortBy IS NULL OR :sortBy = '' THEN id END ASC, " +
           "id ASC " +
           "LIMIT :maxResultCount OFFSET :skipCount", nativeQuery = true)
    List<User> findAllUsersWithSortAndLimit(@Param("skipCount") Integer skipCount, 
                                           @Param("maxResultCount") Integer maxResultCount,
                                           @Param("sortBy") String sortBy,
                                           @Param("sortDirection") String sortDirection);

    @Query("SELECT COUNT(u) FROM User u")
    Long getTotalRecords();

}
