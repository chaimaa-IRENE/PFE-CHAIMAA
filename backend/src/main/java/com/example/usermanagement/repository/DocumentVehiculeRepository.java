package com.example.usermanagement.repository;

import com.example.usermanagement.model.DocumentVehicule;
import com.example.usermanagement.model.DocumentVehicule.TypeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface DocumentVehiculeRepository extends JpaRepository<DocumentVehicule, Long> {

    List<DocumentVehicule> findByVehiculeIdAndArchivedFalse(Long vehiculeId);

    List<DocumentVehicule> findByVehiculeId(Long vehiculeId);

    List<DocumentVehicule> findByVehiculeIdAndTypeDocumentAndArchivedFalse(Long vehiculeId, TypeDocument typeDocument);

    Optional<DocumentVehicule> findFirstByVehiculeIdAndTypeDocumentAndArchivedFalse(Long vehiculeId, TypeDocument typeDocument);

    @Query("SELECT d FROM DocumentVehicule d WHERE d.archived = false ORDER BY d.vehiculeId, d.typeDocument")
    List<DocumentVehicule> findAllActive();

    @Query("SELECT d FROM DocumentVehicule d WHERE d.archived = false AND d.typeDocument = :type ORDER BY d.vehiculeId")
    List<DocumentVehicule> findByTypeDocumentActive(@Param("type") TypeDocument type);

    @Query("SELECT d FROM DocumentVehicule d WHERE d.archived = false AND d.dateExpiration < :date ORDER BY d.dateExpiration")
    List<DocumentVehicule> findExpiredActive(@Param("date") java.time.LocalDateTime date);

    @Query("SELECT d FROM DocumentVehicule d WHERE d.archived = false AND d.dateExpiration BETWEEN :start AND :end ORDER BY d.dateExpiration")
    List<DocumentVehicule> findExpiringSoonActive(@Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query("SELECT d FROM DocumentVehicule d WHERE d.archived = true ORDER BY d.archivedAt DESC")
    List<DocumentVehicule> findAllArchived();

    List<DocumentVehicule> findByArchivedTrue();

    long countByVehiculeIdAndArchivedFalse(Long vehiculeId);

    long countByTypeDocumentAndArchivedFalse(TypeDocument typeDocument);

    @Query("SELECT d FROM DocumentVehicule d WHERE d.archived = false AND d.estDisponible = false ORDER BY d.vehiculeId")
    List<DocumentVehicule> findMissingActive();
}