package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;

@Entity
@Table(name = "users")
@JsonIdentityInfo(
    generator = ObjectIdGenerators.PropertyGenerator.class,
    property = "id"
)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String personCode;

    private String username;
    private String password;
    private String passwordDigest = "";
    private String email;
    private String firstname;
    private String name;
    private String branchCode;
    private String phone;
    private String cellularPhone;
    private String profileCode;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String roleCode;
    private String roleDepartement;
    private String roleBranch;

    private String ville;

    private String status; // ACTIF / INACTIF

    // HOLD attributes (soft delete)
    private Boolean holdPerson;
    private String holdReason;
    private Boolean holdRoleBranch;
    private Boolean holdRelatedRole;

    private LocalDateTime lastConnectionDate;
    private LocalDate creationDate;
    private LocalDateTime lastUpdate;
    private LocalDate passwordExpiryDate;

    private Long createdByRoleId;

    // Face ID
    @Column(columnDefinition = "TEXT")
    private String faceDescriptor;

    @Column(name = "face_registered")
    private Boolean faceRegistered = false;

    // Email validation
    private String validationCode;
    @Column(name = "email_validated")
    private Boolean emailValidated = false;
    @Column(name = "validation_code_expires_at")
    private LocalDateTime validationCodeExpiresAt;

    // Password reset
    @Column(name = "password_reset_token")
    private String passwordResetToken;
    @Column(name = "password_reset_token_expires_at")
    private LocalDateTime passwordResetTokenExpiresAt;

    public User() {}

    public User(String personCode, String username, String password, String email,
                String firstname, String name, String branchCode, Role role) {
        this.personCode = personCode;
        this.username = username;
        this.password = password;
        this.email = email;
        this.firstname = firstname;
        this.name = name;
        this.branchCode = branchCode;
        this.role = role;
        this.creationDate = LocalDate.now();
    }

    // Getters & Setters ...

    public Long getId() {
        return id;
    }

    public String getPersonCode() {
        return personCode;
    }

    public String getUsername() {
        return username;
    }

    @JsonIgnore
    public String getPassword() {
        return password;
    }

    public String getEmail() {
        return email;
    }

    public String getFirstname() {
        return firstname;
    }

    public String getName() {
        return name;
    }

    public String getBranchCode() {
        return branchCode;
    }

    public LocalDateTime getLastConnectionDate() {
        return lastConnectionDate;
    }

    public LocalDate getCreationDate() {
        return creationDate;
    }

    public LocalDateTime getLastUpdate() {
        return lastUpdate;
    }

    public LocalDate getPasswordExpiryDate() {
        return passwordExpiryDate;
    }

    public Role getRole() {
        return role;
    }

    public Boolean getHoldPerson() {
        return holdPerson;
    }

    public String getHoldReason() {
        return holdReason;
    }

    public Boolean getHoldRoleBranch() {
        return holdRoleBranch;
    }

    public Boolean getHoldRelatedRole() {
        return holdRelatedRole;
    }

    public Long getCreatedByRoleId() {
        return createdByRoleId;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setPersonCode(String personCode) {
        this.personCode = personCode;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPassword(String password) {
        this.password = password;
        if (password != null && !password.isBlank()) {
            this.passwordDigest = password;
        }
    }

    @JsonIgnore
    public String getPasswordDigest() {
        return passwordDigest;
    }

    public void setPasswordDigest(String passwordDigest) {
        this.passwordDigest = passwordDigest;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setBranchCode(String branchCode) {
        this.branchCode = branchCode;
    }

    public void setLastConnectionDate(LocalDateTime lastConnectionDate) {
        this.lastConnectionDate = lastConnectionDate;
    }

    public void setCreationDate(LocalDate creationDate) {
        this.creationDate = creationDate;
    }

    public void setLastUpdate(LocalDateTime lastUpdate) {
        this.lastUpdate = lastUpdate;
    }

    public void setPasswordExpiryDate(LocalDate passwordExpiryDate) {
        this.passwordExpiryDate = passwordExpiryDate;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getVille() {
        return ville;
    }

    public void setVille(String ville) {
        this.ville = ville;
    }

    public void setHoldPerson(Boolean holdPerson) {
        this.holdPerson = holdPerson;
    }

    public void setHoldReason(String holdReason) {
        this.holdReason = holdReason;
    }

    public void setHoldRoleBranch(Boolean holdRoleBranch) {
        this.holdRoleBranch = holdRoleBranch;
    }

    public void setHoldRelatedRole(Boolean holdRelatedRole) {
        this.holdRelatedRole = holdRelatedRole;
    }

    public void setCreatedByRoleId(Long createdByRoleId) {
        this.createdByRoleId = createdByRoleId;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCellularPhone() {
        return cellularPhone;
    }

    public void setCellularPhone(String cellularPhone) {
        this.cellularPhone = cellularPhone;
    }

    public String getProfileCode() {
        return profileCode;
    }

    public void setProfileCode(String profileCode) {
        this.profileCode = profileCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRoleCode() {
        return roleCode;
    }

    public void setRoleCode(String roleCode) {
        this.roleCode = roleCode;
    }

    public String getRoleDepartement() {
        return roleDepartement;
    }

    public void setRoleDepartement(String roleDepartement) {
        this.roleDepartement = roleDepartement;
    }

    public String getRoleBranch() {
        return roleBranch;
    }

    public void setRoleBranch(String roleBranch) {
        this.roleBranch = roleBranch;
    }

    public String getFaceDescriptor() {
        return faceDescriptor;
    }

    public void setFaceDescriptor(String faceDescriptor) {
        this.faceDescriptor = faceDescriptor;
    }

    public Boolean getFaceRegistered() {
        return faceRegistered != null && faceRegistered;
    }

    public void setFaceRegistered(Boolean faceRegistered) {
        this.faceRegistered = faceRegistered;
    }

    public String getValidationCode() {
        return validationCode;
    }

    public void setValidationCode(String validationCode) {
        this.validationCode = validationCode;
    }

    public Boolean getEmailValidated() {
        return emailValidated;
    }

    public void setEmailValidated(Boolean emailValidated) {
        this.emailValidated = emailValidated;
    }

    public LocalDateTime getValidationCodeExpiresAt() {
        return validationCodeExpiresAt;
    }

    public void setValidationCodeExpiresAt(LocalDateTime validationCodeExpiresAt) {
        this.validationCodeExpiresAt = validationCodeExpiresAt;
    }

    public String getPasswordResetToken() { return passwordResetToken; }
    public void setPasswordResetToken(String passwordResetToken) { this.passwordResetToken = passwordResetToken; }
    public LocalDateTime getPasswordResetTokenExpiresAt() { return passwordResetTokenExpiresAt; }
    public void setPasswordResetTokenExpiresAt(LocalDateTime passwordResetTokenExpiresAt) { this.passwordResetTokenExpiresAt = passwordResetTokenExpiresAt; }
}
