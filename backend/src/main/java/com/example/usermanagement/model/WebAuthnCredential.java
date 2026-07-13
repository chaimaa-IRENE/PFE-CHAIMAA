package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "webauthn_credentials")
public class WebAuthnCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 1024)
    private String credentialId;

    @Column(nullable = false, length = 4096)
    private String publicKeyJwk;

    @Column(nullable = false)
    private String algorithm;

    @Column(nullable = false)
    private String aaguid;

    @Column(nullable = false)
    private Boolean backupEligible = false;

    @Column(nullable = false)
    private Boolean backupState = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime lastUsedAt;

    private String deviceName;

    public WebAuthnCredential() {}

    public WebAuthnCredential(Long userId, String credentialId, String publicKeyJwk,
                              String algorithm, String aaguid) {
        this.userId = userId;
        this.credentialId = credentialId;
        this.publicKeyJwk = publicKeyJwk;
        this.algorithm = algorithm;
        this.aaguid = aaguid;
        this.createdAt = LocalDateTime.now();
        this.lastUsedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getCredentialId() { return credentialId; }
    public void setCredentialId(String credentialId) { this.credentialId = credentialId; }

    public String getPublicKeyJwk() { return publicKeyJwk; }
    public void setPublicKeyJwk(String publicKeyJwk) { this.publicKeyJwk = publicKeyJwk; }

    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }

    public String getAaguid() { return aaguid; }
    public void setAaguid(String aaguid) { this.aaguid = aaguid; }

    public Boolean getBackupEligible() { return backupEligible; }
    public void setBackupEligible(Boolean backupEligible) { this.backupEligible = backupEligible; }

    public Boolean getBackupState() { return backupState; }
    public void setBackupState(Boolean backupState) { this.backupState = backupState; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(LocalDateTime lastUsedAt) { this.lastUsedAt = lastUsedAt; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }
}
