package com.example.usermanagement.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.*;

@Entity
@Table(name = "checkup_details")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class CheckupDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "checkup_id", insertable = false, updatable = false)
    private Long checkupId;

    @Column(name = "element")
    private String element;

    @Column(name = "categorie")
    private String categorie;

    @Column(name = "statut")
    private String statut;

    @Column(name = "observation")
    private String observation;

    @Column(name = "criticite")
    private String criticite;

    @Column(name = "photo_url")
    private String photoUrl;

    public CheckupDetail() {}
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCheckupId() { return checkupId; }
    public void setCheckupId(Long checkupId) { this.checkupId = checkupId; }
    public String getElement() { return element; }
    public void setElement(String element) { this.element = element; }
    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public String getObservation() { return observation; }
    public void setObservation(String observation) { this.observation = observation; }
    public String getCriticite() { return criticite; }
    public void setCriticite(String criticite) { this.criticite = criticite; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
}