package com.cctrs.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TempController {

    @Autowired
    PasswordEncoder encoder;

    @GetMapping("/encode")
    public String encode() {
        return encoder.encode("admin123");
    }
}
