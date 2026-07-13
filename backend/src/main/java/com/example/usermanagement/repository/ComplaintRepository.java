package com.example.usermanagement.repository;

import com.example.usermanagement.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByMois(String mois);
    
    List<Complaint> findByChauffeur(String chauffeur);
    
    List<Complaint> findBySource(String source);
    
    List<Complaint> findByElement(String element);
    
    List<Complaint> findByCategorie(String categorie);
    
    List<Complaint> findByImmatriculation(String immatriculation);
    
    List<Complaint> findByDateReclamationBetween(LocalDate start, LocalDate end);
    
    @Query("SELECT DISTINCT c.mois FROM Complaint c ORDER BY c.mois")
    List<String> findDistinctMois();
    
    @Query("SELECT DISTINCT c.chauffeur FROM Complaint c ORDER BY c.chauffeur")
    List<String> findDistinctChauffeurs();
    
    @Query("SELECT DISTINCT c.source FROM Complaint c ORDER BY c.source")
    List<String> findDistinctSources();
    
    @Query("SELECT DISTINCT c.element FROM Complaint c ORDER BY c.element")
    List<String> findDistinctElements();
    
    @Query("SELECT DISTINCT c.categorie FROM Complaint c ORDER BY c.categorie")
    List<String> findDistinctCategories();
    
    @Query("SELECT c FROM Complaint c WHERE " +
           "(:mois IS NULL OR c.mois = :mois) AND " +
           "(:chauffeur IS NULL OR c.chauffeur = :chauffeur) AND " +
           "(:source IS NULL OR c.source = :source) AND " +
           "(:element IS NULL OR c.element = :element) AND " +
           "(:categorie IS NULL OR c.categorie = :categorie)")
    List<Complaint> findByFilters(
        @Param("mois") String mois,
        @Param("chauffeur") String chauffeur,
        @Param("source") String source,
        @Param("element") String element,
        @Param("categorie") String categorie
    );
    
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.categorie = :categorie")
    long countByCategorie(@Param("categorie") String categorie);
    
    @Query("SELECT AVG(c.duree) FROM Complaint c WHERE c.duree IS NOT NULL")
    Double averageDuree();
    
    @Query("SELECT c.chauffeur, COUNT(c) FROM Complaint c GROUP BY c.chauffeur ORDER BY COUNT(c) DESC")
    List<Object[]> countByChauffeur();
    
    @Query("SELECT c.immatriculation, COUNT(c) FROM Complaint c GROUP BY c.immatriculation ORDER BY COUNT(c) DESC")
    List<Object[]> countByImmatriculation();
}
