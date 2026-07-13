package com.example.usermanagement.repository;

import com.example.usermanagement.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, Long entityId);
    List<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType);
    List<AuditLog> findAllByOrderByTimestampDesc();
}