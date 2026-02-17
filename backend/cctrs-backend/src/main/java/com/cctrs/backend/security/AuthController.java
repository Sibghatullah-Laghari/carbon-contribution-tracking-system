package com.cctrs.backend.security;

import com.cctrs.backend.dto.ApiResponse;
import com.cctrs.backend.dto.SignupRequest;
import com.cctrs.backend.dto.VerifyOtpRequest;
import com.cctrs.backend.model.User;
import com.cctrs.backend.model.LoginRequest;
import com.cctrs.backend.repository.UserRepository;
import com.cctrs.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.cctrs.backend.dto.EmailRequest;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AuthController.class);
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 5;

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Autowired
    public AuthController(UserRepository userRepository,
                          PasswordEncoder encoder,
                          JwtUtil jwtUtil,
                          EmailService emailService) {
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @PostMapping("/send-otp")
    public ApiResponse<String> sendOtp(@jakarta.validation.Valid @RequestBody SignupRequest request) {
        if (userRepository.findByEmail(request.getEmail()) != null) {
            throw new IllegalArgumentException("Email already in use");
        }
        if (userRepository.findByUsername(request.getUsername()) != null) {
            throw new IllegalArgumentException("Username already in use");
        }

        String otp = generateOtp();
        Instant expiresAt = Instant.now().plus(OTP_EXPIRY_MINUTES, ChronoUnit.MINUTES);
        otpStore.put(request.getEmail().trim().toLowerCase(), new OtpEntry(otp, expiresAt, request));

        emailService.sendOtpEmail(request.getEmail(), otp);
        logger.info("OTP generated for email: {}", request.getEmail());

        return ApiResponse.success("OTP sent to email", null);
    }

    @PostMapping("/resend-otp")
    public ApiResponse<String> resendOtp(@jakarta.validation.Valid @RequestBody EmailRequest request) {
        String emailKey = request.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(request.getEmail()) != null) {
            throw new IllegalArgumentException("Email already in use");
        }
        OtpEntry existing = otpStore.get(emailKey);
        if (existing == null) {
            throw new IllegalArgumentException("OTP request not found. Please sign up again.");
        }

        String otp = generateOtp();
        Instant expiresAt = Instant.now().plus(OTP_EXPIRY_MINUTES, ChronoUnit.MINUTES);
        otpStore.put(emailKey, new OtpEntry(otp, expiresAt, existing.request()));

        emailService.sendOtpEmail(request.getEmail(), otp);
        logger.info("OTP resent for email: {}", request.getEmail());

        return ApiResponse.success("OTP resent to email", null);
    }

    @PostMapping("/verify-otp")
    public ApiResponse<String> verifyOtp(@jakarta.validation.Valid @RequestBody VerifyOtpRequest request) {
        String emailKey = request.getEmail().trim().toLowerCase();
        OtpEntry entry = otpStore.get(emailKey);
        if (entry == null) {
            throw new IllegalArgumentException("OTP expired");
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            otpStore.remove(emailKey);
            throw new IllegalArgumentException("OTP expired");
        }
        if (!entry.otp().equals(request.getOtp())) {
            throw new IllegalArgumentException("Invalid OTP");
        }

        SignupRequest signup = entry.request();
        if (userRepository.findByEmail(signup.getEmail()) != null) {
            otpStore.remove(emailKey);
            throw new IllegalArgumentException("Email already in use");
        }
        if (userRepository.findByUsername(signup.getUsername()) != null) {
            otpStore.remove(emailKey);
            throw new IllegalArgumentException("Username already in use");
        }

        User user = new User();
        user.setName(signup.getName());
        user.setEmail(signup.getEmail());
        user.setUsername(signup.getUsername());
        user.setPassword(encoder.encode(signup.getPassword()));
        user.setRole("USER");
        user.setEmailVerified(true);
        user.setPoints(0);
        userRepository.save(user);

        otpStore.remove(emailKey);
        logger.info("New user created after OTP verification: {}", user.getEmail());

        return ApiResponse.created("Account created. Please login.", null);
    }

    @PostMapping("/signup")
    public ApiResponse<String> signup(
            @jakarta.validation.Valid @RequestBody SignupRequest request) {
        logger.warn("Legacy signup endpoint called for email: {}", request.getEmail());
        throw new IllegalArgumentException("Use /auth/send-otp for signup");
    }

    @io.swagger.v3.oas.annotations.Operation(summary = "User login")
    @PostMapping("/login")
    public ApiResponse<com.cctrs.backend.dto.LoginResponse> login(@jakarta.validation.Valid @RequestBody LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail());

        if (user == null || !encoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        if (Boolean.FALSE.equals(user.getEmailVerified())) {
            throw new IllegalArgumentException("Email not verified. Please check your inbox.");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        logger.info("User logged in: {}", req.getEmail());

        com.cctrs.backend.dto.LoginResponse loginRes = new com.cctrs.backend.dto.LoginResponse(token, user.getRole(), user.getEmail());
        return ApiResponse.success("Login successful", loginRes);
    }

    private String generateOtp() {
        int bound = (int) Math.pow(10, OTP_LENGTH);
        int number = secureRandom.nextInt(bound);
        return String.format("%0" + OTP_LENGTH + "d", number);
    }

    private record OtpEntry(String otp, Instant expiresAt, SignupRequest request) {
    }
}
