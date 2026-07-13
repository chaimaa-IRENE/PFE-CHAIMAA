package com.example.usermanagement.repository;

import com.example.usermanagement.model.GeotabConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GeotabConfigRepository extends JpaRepository<GeotabConfig, Long> {
    Optional<GeotabConfig> findTopByActifTrue();
}
