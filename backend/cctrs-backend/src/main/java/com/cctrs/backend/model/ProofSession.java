package com.cctrs.backend.model;

import java.time.LocalDateTime;

public class ProofSession {

    private String id;
    private Long userId;
    private Long activityId; // Linked activity
    private LocalDateTime startTime;
    private LocalDateTime expiryTime;
    private String status;

    public ProofSession() {
    }

    public ProofSession(String id, Long userId, Long activityId,
            LocalDateTime startTime,
            LocalDateTime expiryTime,
            String status) {
        this.id = id;
        this.userId = userId;
        this.activityId = activityId;
        this.startTime = startTime;
        this.expiryTime = expiryTime;
        this.status = status;
    }

    // getters and setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getActivityId() {
        return activityId;
    }

    public void setActivityId(Long activityId) {
        this.activityId = activityId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getExpiryTime() {
        return expiryTime;
    }

    public void setExpiryTime(LocalDateTime expiryTime) {
        this.expiryTime = expiryTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
