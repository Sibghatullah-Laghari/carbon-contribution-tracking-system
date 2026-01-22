//package com.cctrs.backend.entity;
//
//import jakarta.persistence.*;
//
//@Entity
//@Table(name = "app_users")
//public class User {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    private String name;
//
//    @Column(name = "user_role")
//    private String role;
//
//    // Required by JPA
//    public User() {
//    }
//
//    // Matches DataLoader/service usage
//    public User(String name, String role) {
//        this.name = name;
//        this.role = role;
//    }
//
//    public Long getId() {
//        return id;
//    }
//
//    public String getName() {
//        return name;
//    }
//
//    public String getRole() {
//        return role;
//    }
//}
