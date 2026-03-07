package com.cctrs.backend.dto;

public class LoginResponse {
    private String token;
    private String role;
    private String email;

    public LoginResponse(String token, String role, String email) {
        this.token = token;
        this.role = role;
        this.email = email;
    }

    public String getToken() { return token; }
    public String getRole() { return role; }
    public String getEmail() { return email; }
}
