package com.example.usermanagement.controller;

import com.example.usermanagement.model.Tournee;
import com.example.usermanagement.service.TourneeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tournees")
@CrossOrigin(origins = "*")
public class TourneeController {
    
    private final TourneeService tourneeService;
    
    public TourneeController(TourneeService tourneeService) {
        this.tourneeService = tourneeService;
    }
    
    @GetMapping
    public ResponseEntity<List<Tournee>> getAllTournees() {
        return ResponseEntity.ok(tourneeService.getAllTournees());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Tournee> getTourneeById(@PathVariable Long id) {
        return tourneeService.getTourneeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/numero/{numero}")
    public ResponseEntity<Tournee> getTourneeByNumero(@PathVariable String numero) {
        return tourneeService.getTourneeByNumero(numero)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/chauffeur/{chauffeurId}")
    public ResponseEntity<List<Tournee>> getTourneesByChauffeur(@PathVariable Long chauffeurId) {
        return ResponseEntity.ok(tourneeService.getTourneesByChauffeur(chauffeurId));
    }
    
    @GetMapping("/vehicule/{vehiculeId}")
    public ResponseEntity<List<Tournee>> getTourneesByVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(tourneeService.getTourneesByVehicule(vehiculeId));
    }
    
    @GetMapping("/site/{site}")
    public ResponseEntity<List<Tournee>> getTourneesBySite(@PathVariable String site) {
        return ResponseEntity.ok(tourneeService.getTourneesBySite(site));
    }
    
    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Tournee>> getTourneesByStatut(@PathVariable Tournee.StatutTournee statut) {
        return ResponseEntity.ok(tourneeService.getTourneesByStatut(statut));
    }
    
    @GetMapping("/chauffeur/{chauffeurId}/actives")
    public ResponseEntity<List<Tournee>> getTourneesActivesByChauffeur(@PathVariable Long chauffeurId) {
        return ResponseEntity.ok(tourneeService.getTourneesActivesByChauffeur(chauffeurId));
    }
    
    @GetMapping("/vehicule/{vehiculeId}/actives")
    public ResponseEntity<List<Tournee>> getTourneesActivesByVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(tourneeService.getTourneesActivesByVehicule(vehiculeId));
    }
    
    @GetMapping("/count/statut/{statut}")
    public ResponseEntity<Long> countTourneesByStatut(@PathVariable Tournee.StatutTournee statut) {
        return ResponseEntity.ok(tourneeService.countTourneesByStatut(statut));
    }
    
    @GetMapping("/period")
    public ResponseEntity<List<Tournee>> getTourneesByPeriod(
            @RequestParam LocalDateTime debut,
            @RequestParam LocalDateTime fin) {
        return ResponseEntity.ok(tourneeService.getTourneesByPeriod(debut, fin));
    }
    
    @PostMapping
    public ResponseEntity<Tournee> createTournee(@RequestBody Tournee tournee) {
        Tournee createdTournee = tourneeService.createTournee(tournee);
        return ResponseEntity.ok(createdTournee);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Tournee> updateTournee(@PathVariable Long id, @RequestBody Tournee tournee) {
        Tournee updatedTournee = tourneeService.updateTournee(id, tournee);
        if (updatedTournee != null) {
            return ResponseEntity.ok(updatedTournee);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/{id}/demarrer")
    public ResponseEntity<Tournee> demarrerTournee(@PathVariable Long id) {
        Tournee tournee = tourneeService.demarrerTournee(id);
        if (tournee != null) {
            return ResponseEntity.ok(tournee);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/{id}/terminer")
    public ResponseEntity<Tournee> terminerTournee(@PathVariable Long id) {
        Tournee tournee = tourneeService.terminerTournee(id);
        if (tournee != null) {
            return ResponseEntity.ok(tournee);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/{id}/annuler")
    public ResponseEntity<Tournee> annulerTournee(@PathVariable Long id, @RequestBody String motif) {
        Tournee tournee = tourneeService.annulerTournee(id, motif);
        if (tournee != null) {
            return ResponseEntity.ok(tournee);
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTournee(@PathVariable Long id) {
        tourneeService.deleteTournee(id);
        return ResponseEntity.ok().build();
    }
}
