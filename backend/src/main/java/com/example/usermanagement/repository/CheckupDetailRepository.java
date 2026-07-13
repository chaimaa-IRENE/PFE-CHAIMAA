package com.example.usermanagement.repository;

import com.example.usermanagement.model.CheckupDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CheckupDetailRepository extends JpaRepository<CheckupDetail, Long> {
    List<CheckupDetail> findByCheckupId(Long checkupId);
    List<CheckupDetail> findByCategorie(String categorie);
    List<CheckupDetail> findByStatut(String statut);
}