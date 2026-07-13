package com.example.usermanagement.repository;

import com.example.usermanagement.model.BudgetTrimestriel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetTrimestrielRepository extends JpaRepository<BudgetTrimestriel, Long> {
    
    Optional<BudgetTrimestriel> findByAnneeAndTrimestreAndActif(Integer annee, Integer trimestre, Boolean actif);
    
    List<BudgetTrimestriel> findByAnnee(Integer annee);
    
    List<BudgetTrimestriel> findByActifOrderByAnneeDescTrimestreDesc(Boolean actif);
    
    @Query("SELECT b FROM BudgetTrimestriel b WHERE b.actif = true ORDER BY b.annee DESC, b.trimestre DESC")
    Optional<BudgetTrimestriel> findActiveBudget();
    
    @Query("SELECT b FROM BudgetTrimestriel b WHERE b.actif = true AND b.dateDebutPeriode <= :date AND b.dateFinPeriode >= :date")
    Optional<BudgetTrimestriel> findBudgetForDate(@Param("date") java.time.LocalDate date);
}
