package com.example.usermanagement.dto;

import java.util.Map;

public class IncidentFormResponse {
    private String sessionId;
    private int currentStep;
    private String field;
    private String value;
    private String question;
    private String questionDarija;
    private boolean done;
    private Map<String, String> data;
    private String error;

    public IncidentFormResponse() {}

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public int getCurrentStep() { return currentStep; }
    public void setCurrentStep(int currentStep) { this.currentStep = currentStep; }
    public String getField() { return field; }
    public void setField(String field) { this.field = field; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getQuestionDarija() { return questionDarija; }
    public void setQuestionDarija(String questionDarija) { this.questionDarija = questionDarija; }
    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }
    public Map<String, String> getData() { return data; }
    public void setData(Map<String, String> data) { this.data = data; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
