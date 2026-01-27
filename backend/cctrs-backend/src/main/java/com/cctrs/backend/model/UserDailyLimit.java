package com.cctrs.backend.model;

import java.time.LocalDate;

public class UserDailyLimit {
    private Long id;
    private Long userId;
    private LocalDate date;
    private int activityCount;
    private int treesDeclared;

    public UserDailyLimit() {
    }

    public UserDailyLimit(Long userId, LocalDate date, int activityCount, int treesDeclared) {
        this.userId = userId;
        this.date = date;
        this.activityCount = activityCount;
        this.treesDeclared = treesDeclared;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public int getActivityCount() {
        return activityCount;
    }

    public void setActivityCount(int activityCount) {
        this.activityCount = activityCount;
    }

    public int getTreesDeclared() {
        return treesDeclared;
    }

    public void setTreesDeclared(int treesDeclared) {
        this.treesDeclared = treesDeclared;
    }
}
