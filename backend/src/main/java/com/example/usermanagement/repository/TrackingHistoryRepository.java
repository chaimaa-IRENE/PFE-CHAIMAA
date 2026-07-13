package com.example.usermanagement.repository;

import com.example.usermanagement.model.TrackingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TrackingHistoryRepository extends JpaRepository<TrackingHistory, Long> {

    List<TrackingHistory> findByImmatriculationOrderByTimestampAsc(String immatriculation);

    List<TrackingHistory> findByImmatriculationAndTimestampBetweenOrderByTimestampAsc(
        String immatriculation, LocalDateTime from, LocalDateTime to);

    @Query("SELECT DISTINCT t.immatriculation FROM TrackingHistory t")
    List<String> findDistinctImmatriculations();

    @Query("SELECT COUNT(t) FROM TrackingHistory t WHERE t.immatriculation = :immat AND t.timestamp >= :since")
    long countRecentPositions(@Param("immat") String immat, @Param("since") LocalDateTime since);

    @Query("SELECT MAX(t.vitesse) FROM TrackingHistory t WHERE t.immatriculation = :immat AND t.timestamp >= :since")
    Double getMaxSpeed(@Param("immat") String immat, @Param("since") LocalDateTime since);
}
