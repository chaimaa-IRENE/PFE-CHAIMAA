package com.example.usermanagement.repository;

import com.example.usermanagement.model.LegalDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LegalDocumentRepository extends JpaRepository<LegalDocument, Long> {
    List<LegalDocument> findByVehiculeImmatriculation(String immatriculation);
    List<LegalDocument> findByVehiculeId(Long vehiculeId);
    List<LegalDocument> findByType(String type);
    List<LegalDocument> findByStatut(String statut);
    List<LegalDocument> findByDateExpirationBefore(LocalDate date);
    List<LegalDocument> findByDateExpirationBetween(LocalDate start, LocalDate end);
    List<LegalDocument> findByVehiculeImmatriculationAndType(String immatriculation, String type);
    long countByStatut(String statut);
    long count();
    long countByVehiculeImmatriculation(String immatriculation);
}
