package com.example.usermanagement.service;

import com.example.usermanagement.model.Intervention;
import com.example.usermanagement.repository.InterventionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InterventionService {
    @Autowired
    private InterventionRepository repo;

    public List<Intervention> getAll() {
        return repo.findAll();
    }

    public Intervention takeCharge(Long id) {
        Intervention i = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Intervention introuvable"));
        i.setStatut("En cours");
        return repo.save(i);
    }

    public Intervention updateIntervention(Long id, Intervention updated) {
        Intervention i = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Intervention introuvable"));
        i.setActionsRealisees(updated.getActionsRealisees());
        i.setPiecesNecessaires(updated.getPiecesNecessaires());
        i.setStatut(updated.getStatut());
        return repo.save(i);
    }
}
