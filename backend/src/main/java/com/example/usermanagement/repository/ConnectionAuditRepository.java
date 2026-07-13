package com.example.usermanagement.repository;

import com.example.usermanagement.model.ConnectionAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConnectionAuditRepository extends JpaRepository<ConnectionAudit, Long> {
    List<ConnectionAudit> findByUserIdOrderByConnectionDateDesc(Long userId);
    List<ConnectionAudit> findAllByOrderByConnectionDateDesc();
}
