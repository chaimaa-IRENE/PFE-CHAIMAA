package com.example.usermanagement.repository;

import com.example.usermanagement.model.DriverPresence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DriverPresenceRepository extends JpaRepository<DriverPresence, Long> {
    List<DriverPresence> findByChauffeurIdOrderByCheckInTimeDesc(Long chauffeurId);
    List<DriverPresence> findByCheckInTimeBetweenOrderByCheckInTimeDesc(LocalDateTime start, LocalDateTime end);
    Optional<DriverPresence> findFirstByChauffeurIdAndStatutOrderByCheckInTimeDesc(Long chauffeurId, String statut);
}
