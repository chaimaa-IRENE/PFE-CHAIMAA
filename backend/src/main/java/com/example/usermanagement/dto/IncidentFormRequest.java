package com.example.usermanagement.dto;

public class IncidentFormRequest {
    private String sessionId;
    private int step;
    private String response;

    public IncidentFormRequest() {}

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public int getStep() { return step; }
    public void setStep(int step) { this.step = step; }
    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }
}
