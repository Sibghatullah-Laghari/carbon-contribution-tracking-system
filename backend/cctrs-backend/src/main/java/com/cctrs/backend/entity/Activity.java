//package com.cctrs.backend.entity;
//
//import jakarta.persistence.Column;
//import jakarta.persistence.Entity;
//import jakarta.persistence.GeneratedValue;
//import jakarta.persistence.GenerationType;
//import jakarta.persistence.Id;
//import jakarta.persistence.JoinColumn;
//import jakarta.persistence.ManyToOne;
//import jakarta.persistence.Table;
//
//@Entity
//@Table(name = "activities")
//public class Activity {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    @ManyToOne
//    @JoinColumn(name = "user_id")
//    private User user;
//
//    @Column(name = "activity_type")
//    private String activityType;
//    private int points;
//
//    @Column(name = "activity_month")
//    private String month;
//
//    @Column(name = "activity_status")
//    private String status;
//
//
//    public Activity() {}
//
//
//    public Activity(User user, String activityType, int points, String month) {
//        this.user = user;
//        this.activityType = activityType;
//        this.points = points;
//        this.month = month;
//        this.status = "PENDING";
//    }
//
//    public Long getId() {
//        return id;
//    }
//
//    public User getUser() {
//        return user;
//    }
//
//    public String getActivityType() {
//        return activityType;
//    }
//
//    public int getPoints() {
//        return points;
//    }
//
//    public String getMonth() {
//        return month;
//    }
//
//    public String getStatus() {
//        return status;
//    }
//
//    public void approve() {
//        this.status = "APPROVED";
//    }
//}
