package com.example.usermanagement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "connection_audit")
public class ConnectionAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String username;

    private String role;

    @Column(nullable = false)
    private String authMethod;

    @Column(nullable = false)
    private LocalDateTime connectionDate;

    private String ipAddress;

    private Boolean success;

    public ConnectionAudit() {}

    public ConnectionAudit(Long userId, String username, String role, String authMethod, Boolean success) {
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.authMethod = authMethod;
        this.success = success;
        this.connectionDate = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAuthMethod() { return authMethod; }
    public void setAuthMethod(String authMethod) { this.authMethod = authMethod; }

    public LocalDateTime getConnectionDate() { return connectionDate; }
    public void setConnectionDate(LocalDateTime connectionDate) { this.connectionDate = connectionDate; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public Boolean getSuccess() { return success; }
    public void setSuccess(Boolean success) { this.success = success; }
}
