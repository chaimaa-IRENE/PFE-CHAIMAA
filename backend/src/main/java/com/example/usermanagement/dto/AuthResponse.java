package com.example.usermanagement.dto;

import com.example.usermanagement.model.User;

public class AuthResponse {
    private User user;
    private String token;
    private String message;
    private String authMethod;

    public AuthResponse() {}

    public AuthResponse(User user, String token, String message, String authMethod) {
        this.user = user;
        this.token = token;
        this.message = message;
        this.authMethod = authMethod;
    }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getAuthMethod() { return authMethod; }
    public void setAuthMethod(String authMethod) { this.authMethod = authMethod; }
}
