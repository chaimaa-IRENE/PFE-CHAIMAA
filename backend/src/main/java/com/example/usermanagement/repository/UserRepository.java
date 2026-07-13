package com.example.usermanagement.repository;

import com.example.usermanagement.model.Role;
import com.example.usermanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByPasswordResetToken(String passwordResetToken);
    Optional<User> findByPersonCode(String personCode);
    boolean existsByUsername(String username);

    List<User> findByRole(Role role);
    List<User> findByStatus(String status);
    List<User> findByBranchCode(String branchCode);
    List<User> findByRoleAndStatus(Role role, String status);
    List<User> findByProfileCode(String profileCode);
}

