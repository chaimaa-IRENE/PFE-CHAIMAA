package com.example.usermanagement.repository;

import com.example.usermanagement.model.Intervention;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterventionRepository extends JpaRepository<Intervention, Long> {}

