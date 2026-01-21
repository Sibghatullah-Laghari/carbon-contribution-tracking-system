package com.cctrs.backend.startup;

import com.cctrs.backend.model.User;
import com.cctrs.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class AdminDataLoader implements CommandLineRunner {

    private final UserRepository userRepository;

    public AdminDataLoader(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {

        if (userRepository.count() == 0) {

            User admin = new User(
                    "System Admin",
                    "admin",
                    "admin@cctrs.com",
                    "admin123",   // later we encrypt
                    "ADMIN"
            );

            userRepository.save(admin);

            System.out.println("Default admin user created");
        }
    }
}
