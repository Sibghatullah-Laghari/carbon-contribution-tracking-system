package com.cctrs.backend.controller;

import com.cctrs.backend.model.User;
import com.cctrs.backend.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    //  1. Get all users
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    //  2. Create new user (signup)
    @PostMapping
    public String createUser(@RequestBody User user) {

        user.setRole("USER");
        user.setActive(true);
        user.setTotalPoints(0);

        userRepository.save(user);
        return "User created successfully";
    }
}
