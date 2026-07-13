package com.example.usermanagement.service;

import com.example.usermanagement.model.BudgetTrimestriel;
import com.example.usermanagement.model.DeclarationIncident;
import com.example.usermanagement.repository.BudgetTrimestrielRepository;
import com.example.usermanagement.repository.DeclarationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BudgetTrimestrielService {

    private final BudgetTrimestrielRepository budgetRepository;
    private final DeclarationRepository declarationRepository;

    public BudgetTrimestrielService(BudgetTrimestrielRepository budgetRepository, 
                                    DeclarationRepository declarationRepository) {
        this.budgetRepository = budgetRepository;
        this.declarationRepository = declarationRepository;
    }

    public BudgetTrimestriel createBudget(Integer annee, Integer trimestre, Double budgetTotal) {
        // Désactiver les budgets précédents actifs
        List<BudgetTrimestriel> activeBudgets = budgetRepository.findByActifOrderByAnneeDescTrimestreDesc(true);
        for (BudgetTrimestriel budget : activeBudgets) {
            budget.setActif(false);
            budgetRepository.save(budget);
        }

        // Calculer les dates de début et fin du trimestre
        LocalDate dateDebut = getDebutTrimestre(annee, trimestre);
        LocalDate dateFin = getFinTrimestre(annee, trimestre);

        BudgetTrimestriel nouveauBudget = new BudgetTrimestriel();
        nouveauBudget.setAnnee(annee);
        nouveauBudget.setTrimestre(trimestre);
        nouveauBudget.setBudgetTotal(budgetTotal);
        nouveauBudget.setBudgetUtilise(0.0);
        nouveauBudget.setDateCreation(new java.util.Date());
        nouveauBudget.setDateDebutPeriode(dateDebut);
        nouveauBudget.setDateFinPeriode(dateFin);
        nouveauBudget.setActif(true);

        return budgetRepository.save(nouveauBudget);
    }

    public Optional<BudgetTrimestriel> getActiveBudget() {
        return budgetRepository.findActiveBudget();
    }

    public Optional<BudgetTrimestriel> getBudgetForDate(LocalDate date) {
        return budgetRepository.findBudgetForDate(date);
    }

    public List<BudgetTrimestriel> getAllBudgets() {
        return budgetRepository.findByActifOrderByAnneeDescTrimestreDesc(true);
    }

    public List<BudgetTrimestriel> getBudgetsByYear(Integer annee) {
        return budgetRepository.findByAnnee(annee);
    }

    @Transactional
    public void ajouterUtilisation(Double montant) {
        Optional<BudgetTrimestriel> budgetOpt = getActiveBudget();
        if (budgetOpt.isPresent()) {
            BudgetTrimestriel budget = budgetOpt.get();
            budget.ajouterUtilisation(montant);
            budgetRepository.save(budget);
        }
    }

    private double recalculerBudgetUtilise(BudgetTrimestriel budget) {
        if (budget == null) return 0.0;
        LocalDateTime debutPeriode = budget.getDateDebutPeriode().atStartOfDay();
        LocalDateTime finPeriode = budget.getDateFinPeriode().atTime(23, 59, 59);
        Double utiliseReel = declarationRepository.sumCoutByStatutAndDateReparationBetween(debutPeriode, finPeriode);
        return utiliseReel != null ? utiliseReel : 0.0;
    }

    public boolean verifierBudgetSuffisant(Double montant) {
        Optional<BudgetTrimestriel> budgetOpt = getActiveBudget();
        if (budgetOpt.isPresent()) {
            BudgetTrimestriel budget = budgetOpt.get();
            double utilise = recalculerBudgetUtilise(budget);
            return (budget.getBudgetTotal() - utilise) >= montant;
        }
        return false;
    }

    public Map<String, Object> getBudgetDetails() {
        Optional<BudgetTrimestriel> budgetOpt = getActiveBudget();
        Map<String, Object> details = new HashMap<>();
        
        if (budgetOpt.isPresent()) {
            BudgetTrimestriel budget = budgetOpt.get();
            double utilise = recalculerBudgetUtilise(budget);
            details.put("budgetTotal", budget.getBudgetTotal());
            details.put("budgetUtilise", utilise);
            details.put("budgetRestant", budget.getBudgetTotal() - utilise);
            details.put("annee", budget.getAnnee());
            details.put("trimestre", budget.getTrimestre());
            details.put("dateDebut", budget.getDateDebutPeriode());
            details.put("dateFin", budget.getDateFinPeriode());
        } else {
            details.put("budgetTotal", 0.0);
            details.put("budgetUtilise", 0.0);
            details.put("budgetRestant", 0.0);
            details.put("annee", null);
            details.put("trimestre", null);
        }
        
        return details;
    }

    private LocalDate getDebutTrimestre(Integer annee, Integer trimestre) {
        int moisDebut = (trimestre - 1) * 3 + 1;
        return LocalDate.of(annee, moisDebut, 1);
    }

    private LocalDate getFinTrimestre(Integer annee, Integer trimestre) {
        int moisFin = trimestre * 3;
        YearMonth yearMonth = YearMonth.of(annee, moisFin);
        return yearMonth.atEndOfMonth();
    }

    public BudgetTrimestriel updateBudget(Long id, Double nouveauBudgetTotal) {
        Optional<BudgetTrimestriel> budgetOpt = budgetRepository.findById(id);
        if (budgetOpt.isPresent()) {
            BudgetTrimestriel budget = budgetOpt.get();
            budget.setBudgetTotal(nouveauBudgetTotal);
            return budgetRepository.save(budget);
        }
        throw new RuntimeException("Budget non trouvé");
    }

    public void desactiverBudget(Long id) {
        Optional<BudgetTrimestriel> budgetOpt = budgetRepository.findById(id);
        if (budgetOpt.isPresent()) {
            BudgetTrimestriel budget = budgetOpt.get();
            budget.setActif(false);
            budgetRepository.save(budget);
        }
    }
}
