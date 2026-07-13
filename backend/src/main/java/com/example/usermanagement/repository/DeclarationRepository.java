package com.example.usermanagement.repository;

import com.example.usermanagement.model.DeclarationIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DeclarationRepository extends JpaRepository<DeclarationIncident, Long> {

    // Trouver une déclaration par son numéro
    Optional<DeclarationIncident> findByNumeroDemande(String numeroDemande);

    // Trouver les déclarations par chauffeur
    List<DeclarationIncident> findByChauffeurId(Long chauffeurId);

    // Trouver les déclarations par véhicule
    List<DeclarationIncident> findByVehiculeId(Long vehiculeId);

    // Compter les déclarations par statut
    long countByStatut(String statut);

    // Vérifier si une déclaration existe pour ce chauffeur/vehicule dans une fenêtre de temps
    boolean existsByChauffeurIdAndVehiculeImmatriculationAndDateHeureBetween(
        Long chauffeurId, String vehiculeImmatriculation, LocalDateTime start, LocalDateTime end
    );

    // New filtering methods
    List<DeclarationIncident> findByMois(String mois);
    List<DeclarationIncident> findByCategorie(String categorie);
    List<DeclarationIncident> findByElementVehicule(String elementVehicule);
    List<DeclarationIncident> findByStatutAndCategorie(String statut, String categorie);
    List<DeclarationIncident> findByStatutAndMois(String statut, String mois);

    // Advanced filtering with multiple criteria
    @Query("SELECT d FROM DeclarationIncident d WHERE " +
           "(:mois IS NULL OR d.mois = :mois) AND " +
           "(:categorie IS NULL OR d.categorie = :categorie) AND " +
           "(:statut IS NULL OR d.statut = :statut) AND " +
           "(:elementVehicule IS NULL OR d.elementVehicule = :elementVehicule)")
    List<DeclarationIncident> filterDeclarations(
        @Param("mois") String mois,
        @Param("categorie") String categorie,
        @Param("statut") String statut,
        @Param("elementVehicule") String elementVehicule
    );

    // Find declarations by date range for budget calculations
    List<DeclarationIncident> findByDateHeureBetweenAndCoutProblemeIsNotNull(LocalDateTime start, LocalDateTime end);

    // Sum coutProbleme for all declarations in a date range (excluding REJETEE)
    @Query("SELECT COALESCE(SUM(d.coutProbleme), 0) FROM DeclarationIncident d WHERE d.statut <> 'REJETEE' AND d.coutProbleme IS NOT NULL AND d.dateReparation BETWEEN :start AND :end")
    Double sumCoutByStatutAndDateReparationBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
