package com.example.usermanagement.repository;

import com.example.usermanagement.model.DocumentReglementaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentReglementaireRepository extends JpaRepository<DocumentReglementaire, Long> {
    
    List<DocumentReglementaire> findByVehiculeId(Long vehiculeId);
    
    List<DocumentReglementaire> findByVehiculeImmatriculation(String vehiculeImmatriculation);
    
    List<DocumentReglementaire> findByTypeDocument(DocumentReglementaire.TypeDocument typeDocument);
    
    List<DocumentReglementaire> findByStatutDocument(DocumentReglementaire.StatutDocument statutDocument);
    
    @Query("SELECT d FROM DocumentReglementaire d WHERE d.vehiculeId = :vehiculeId AND d.typeDocument = :typeDocument")
    Optional<DocumentReglementaire> findByVehiculeIdAndTypeDocument(@Param("vehiculeId") Long vehiculeId, @Param("typeDocument") DocumentReglementaire.TypeDocument typeDocument);
    
    @Query("SELECT d FROM DocumentReglementaire d WHERE d.dateExpiration <= :date AND d.statutDocument != 'EXPIRE'")
    List<DocumentReglementaire> findDocumentsExpiringBefore(@Param("date") LocalDate date);
    
    @Query("SELECT d FROM DocumentReglementaire d WHERE d.dateExpiration BETWEEN :debut AND :fin")
    List<DocumentReglementaire> findDocumentsExpiringBetween(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
    
    @Query("SELECT COUNT(d) FROM DocumentReglementaire d WHERE d.vehiculeId = :vehiculeId AND d.statutDocument = 'EXPIRE'")
    long countExpiredDocumentsByVehicule(@Param("vehiculeId") Long vehiculeId);
    
    @Query("SELECT d FROM DocumentReglementaire d WHERE d.alerteEnvoyee = false AND d.statutDocument = 'BIENTOT_EXPIRE'")
    List<DocumentReglementaire> findDocumentsNeedingAlert();
    
    @Query("SELECT d FROM DocumentReglementaire d WHERE d.vehiculeId = :vehiculeId AND d.statutDocument = 'DISPONIBLE'")
    List<DocumentReglementaire> findValidDocumentsByVehicule(@Param("vehiculeId") Long vehiculeId);
}
