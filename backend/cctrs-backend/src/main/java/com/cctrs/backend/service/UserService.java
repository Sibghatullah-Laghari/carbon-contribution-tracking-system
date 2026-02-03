package com.cctrs.backend.service;

import com.cctrs.backend.model.User;
import com.cctrs.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.Map;
import java.util.Random;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final Map<String, Long> otpExpiry = new ConcurrentHashMap<>();
    private final Random random = new Random();

    @Autowired
    public UserService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public User createUser(User user) {

        // Validation
        if (user.getName() == null || user.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }

        // Check for duplicate email
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Check for duplicate username
        if (userRepository.findByUsername(user.getUsername()) != null) {
            throw new IllegalArgumentException("Username already exists");
        }

        // Set default points if not provided
        if (user.getPoints() == null) {
            user.setPoints(0);
        }

        // Set default role if not provided
        if (user.getRole() == null || user.getRole().trim().isEmpty()) {
            user.setRole("USER");
        }

        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Valid user ID is required");
        }
        return userRepository.findById(id);
    }

    public void addPointsToUser(Long userId, int pointsToAdd) {
        User user = userRepository.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }
        int newPoints = user.getPoints() + pointsToAdd;
        userRepository.updatePoints(userId, newPoints);
    }

    /**
     * Calculate badge level based on total points
     * 
     * @param points Total points
     * @return Badge level: "Bronze", "Silver", or "Gold"
     */
    public String calculateBadge(int points) {
        if (points > 300) {
            return "Gold";
        } else if (points > 100) {
            return "Silver";
        } else {
            return "Bronze";
        }
    }

    public String generateAndSendOtp(String email) {
        if (userRepository.findByEmail(email) != null) {
            throw new IllegalArgumentException("Email already exists");
        }

        String otp = String.format("%06d", random.nextInt(1000000));
        otpStorage.put(email, otp);
        otpExpiry.put(email, System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(5));

        emailService.sendOtpEmail(email, otp);
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        if (!otpStorage.containsKey(email) || !otpStorage.get(email).equals(otp)) {
            return false;
        }

        if (System.currentTimeMillis() > otpExpiry.get(email)) {
            otpStorage.remove(email);
            otpExpiry.remove(email);
            return false;
        }

        otpStorage.remove(email);
        otpExpiry.remove(email);
        return true;
    }

    public User createUserAfterOtpVerification(String email) {
        User user = new User();
        user.setEmail(email);
        user.setEmailVerified(true);
        user.setRole("USER");
        user.setPoints(0);
        return userRepository.save(user);
    }
}
