package com.example.usermanagement.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

@Entity
@Table(name = "anomalie_checkup_history")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class AnomalieCheckupHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "anomalie_id", nullable = false)
    private Long anomalieId;

    @Column(name = "ancien_statut")
    private String ancienStatut;

    @Column(name = "nouveau_statut", nullable = false)
    private String nouveauStatut;

    @Column(name = "action")
    private String action;

    @Column(name = "utilisateur")
    private String utilisateur;

    @Column(name = "commentaire")
    private String commentaire;

    @Column(name = "document_url")
    private String documentUrl;

    @Column(name = "date_action", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dateAction;

    public AnomalieCheckupHistory() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAnomalieId() { return anomalieId; }
    public void setAnomalieId(Long anomalieId) { this.anomalieId = anomalieId; }
    public String getAncienStatut() { return ancienStatut; }
    public void setAncienStatut(String ancienStatut) { this.ancienStatut = ancienStatut; }
    public String getNouveauStatut() { return nouveauStatut; }
    public void setNouveauStatut(String nouveauStatut) { this.nouveauStatut = nouveauStatut; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getUtilisateur() { return utilisateur; }
    public void setUtilisateur(String utilisateur) { this.utilisateur = utilisateur; }
    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }
    public String getDocumentUrl() { return documentUrl; }
    public void setDocumentUrl(String documentUrl) { this.documentUrl = documentUrl; }
    public LocalDateTime getDateAction() { return dateAction; }
    public void setDateAction(LocalDateTime dateAction) { this.dateAction = dateAction; }
}