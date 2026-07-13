package com.example.usermanagement.controller;

import com.example.usermanagement.model.TicketMaintenance;
import com.example.usermanagement.service.TicketMaintenanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tickets-maintenance")
@CrossOrigin(origins = "*")
public class TicketMaintenanceController {
    
    private final TicketMaintenanceService ticketMaintenanceService;
    
    public TicketMaintenanceController(TicketMaintenanceService ticketMaintenanceService) {
        this.ticketMaintenanceService = ticketMaintenanceService;
    }
    
    @GetMapping
    public ResponseEntity<List<TicketMaintenance>> getAllTickets() {
        return ResponseEntity.ok(ticketMaintenanceService.getAllTickets());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TicketMaintenance> getTicketById(@PathVariable Long id) {
        return ticketMaintenanceService.getTicketById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/numero/{numero}")
    public ResponseEntity<TicketMaintenance> getTicketByNumero(@PathVariable String numero) {
        return ticketMaintenanceService.getTicketByNumero(numero)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/vehicule/{vehiculeId}")
    public ResponseEntity<List<TicketMaintenance>> getTicketsByVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(ticketMaintenanceService.getTicketsByVehicule(vehiculeId));
    }
    
    @GetMapping("/vehicule/immatriculation/{immatriculation}")
    public ResponseEntity<List<TicketMaintenance>> getTicketsByVehiculeImmatriculation(@PathVariable String immatriculation) {
        return ResponseEntity.ok(ticketMaintenanceService.getTicketsByVehiculeImmatriculation(immatriculation));
    }
    
    @GetMapping("/tournee/{tourneeId}")
    public ResponseEntity<List<TicketMaintenance>> getTicketsByTournee(@PathVariable String tourneeId) {
        return ResponseEntity.ok(ticketMaintenanceService.getTicketsByTournee(tourneeId));
    }
    
    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<TicketMaintenance>> getTicketsByStatut(@PathVariable TicketMaintenance.StatutTicket statut) {
        return ResponseEntity.ok(ticketMaintenanceService.getTicketsByStatut(statut));
    }
    
    @GetMapping("/criticite/{criticite}")
    public ResponseEntity<List<TicketMaintenance>> getTicketsByCriticite(@PathVariable TicketMaintenance.CriticiteTicket criticite) {
        return ResponseEntity.ok(ticketMaintenanceService.getTicketsByCriticite(criticite));
    }
    
    @GetMapping("/technicien/{technicien}")
    public ResponseEntity<List<TicketMaintenance>> getTicketsByTechnicien(@PathVariable String technicien) {
        return ResponseEntity.ok(ticketMaintenanceService.getTicketsByTechnicien(technicien));
    }
    
    @GetMapping("/criticite/{criticite}/ouverts")
    public ResponseEntity<List<TicketMaintenance>> getOpenTicketsByCriticite(@PathVariable TicketMaintenance.CriticiteTicket criticite) {
        return ResponseEntity.ok(ticketMaintenanceService.getOpenTicketsByCriticite(criticite));
    }
    
    @GetMapping("/period")
    public ResponseEntity<List<TicketMaintenance>> getTicketsByPeriod(
            @RequestParam LocalDateTime debut,
            @RequestParam LocalDateTime fin) {
        return ResponseEntity.ok(ticketMaintenanceService.getTicketsByPeriod(debut, fin));
    }
    
    @GetMapping("/count/statut/{statut}")
    public ResponseEntity<Long> countTicketsByStatut(@PathVariable TicketMaintenance.StatutTicket statut) {
        return ResponseEntity.ok(ticketMaintenanceService.countTicketsByStatut(statut));
    }
    
    @GetMapping("/ouverts/priorite")
    public ResponseEntity<List<TicketMaintenance>> getOpenTicketsOrderByPriority() {
        return ResponseEntity.ok(ticketMaintenanceService.getOpenTicketsOrderByPriority());
    }
    
    @GetMapping("/vehicule/{vehiculeId}/actifs")
    public ResponseEntity<List<TicketMaintenance>> getActiveTicketsByVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(ticketMaintenanceService.getActiveTicketsByVehicule(vehiculeId));
    }
    
    @GetMapping("/temps-resolution-moyen")
    public ResponseEntity<Double> calculateAverageResolutionTime() {
        return ResponseEntity.ok(ticketMaintenanceService.calculateAverageResolutionTime());
    }
    
    @PostMapping
    public ResponseEntity<TicketMaintenance> createTicket(@RequestBody TicketMaintenance ticket) {
        TicketMaintenance createdTicket = ticketMaintenanceService.createTicket(ticket);
        return ResponseEntity.ok(createdTicket);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TicketMaintenance> updateTicket(
            @PathVariable Long id,
            @RequestBody TicketMaintenance ticket) {
        TicketMaintenance updatedTicket = ticketMaintenanceService.updateTicket(id, ticket);
        if (updatedTicket != null) {
            return ResponseEntity.ok(updatedTicket);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/{id}/affecter")
    public ResponseEntity<TicketMaintenance> affecterTicket(
            @PathVariable Long id,
            @RequestBody String technicien) {
        TicketMaintenance ticket = ticketMaintenanceService.affecterTicket(id, technicien);
        if (ticket != null) {
            return ResponseEntity.ok(ticket);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/{id}/demarrer")
    public ResponseEntity<TicketMaintenance> demarrerReparation(@PathVariable Long id) {
        TicketMaintenance ticket = ticketMaintenanceService.demarrerReparation(id);
        if (ticket != null) {
            return ResponseEntity.ok(ticket);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/{id}/terminer")
    public ResponseEntity<TicketMaintenance> terminerReparation(
            @PathVariable Long id,
            @RequestBody ReparationRequest request) {
        TicketMaintenance ticket = ticketMaintenanceService.terminerReparation(
                id, request.getActionsRealisees(), request.getPiecesUtilisees(), request.getCoutReel());
        if (ticket != null) {
            return ResponseEntity.ok(ticket);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/{id}/cloturer")
    public ResponseEntity<TicketMaintenance> cloturerTicket(@PathVariable Long id) {
        TicketMaintenance ticket = ticketMaintenanceService.cloturerTicket(id);
        if (ticket != null) {
            return ResponseEntity.ok(ticket);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/{id}/annuler")
    public ResponseEntity<TicketMaintenance> annulerTicket(
            @PathVariable Long id,
            @RequestBody String motif) {
        TicketMaintenance ticket = ticketMaintenanceService.annulerTicket(id, motif);
        if (ticket != null) {
            return ResponseEntity.ok(ticket);
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        ticketMaintenanceService.deleteTicket(id);
        return ResponseEntity.ok().build();
    }
    
    // DTO pour la requête de réparation
    public static class ReparationRequest {
        private String actionsRealisees;
        private String piecesUtilisees;
        private Double coutReel;
        
        public String getActionsRealisees() { return actionsRealisees; }
        public void setActionsRealisees(String actionsRealisees) { this.actionsRealisees = actionsRealisees; }
        public String getPiecesUtilisees() { return piecesUtilisees; }
        public void setPiecesUtilisees(String piecesUtilisees) { this.piecesUtilisees = piecesUtilisees; }
        public Double getCoutReel() { return coutReel; }
        public void setCoutReel(Double coutReel) { this.coutReel = coutReel; }
    }
}
