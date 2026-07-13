package com.example.usermanagement.repository;

import com.example.usermanagement.model.AnomalieCheckupHistory;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

@Repository
public interface AnomalieCheckupHistoryRepository extends JpaRepository<AnomalieCheckupHistory, Long> {
    List<AnomalieCheckupHistory> findByAnomalieIdOrderByDateActionAsc(Long anomalieId);
    List<AnomalieCheckupHistory> findByAnomalieIdOrderByDateActionDesc(Long anomalieId);
}