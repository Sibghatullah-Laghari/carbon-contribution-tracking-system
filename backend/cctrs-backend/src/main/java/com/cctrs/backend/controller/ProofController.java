package com.cctrs.backend.controller;

import com.cctrs.backend.model.ProofSession;
import com.cctrs.backend.model.User;
import com.cctrs.backend.repository.UserRepository;
import com.cctrs.backend.service.ProofSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/proof")
public class ProofController {

    @Autowired
    private ProofSessionService proofService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/start")
    public ProofSession startProof(@RequestParam Long activityId) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        User user = userRepository.findByEmail(email);

        return proofService.createSession(user.getId(), activityId);
    }
}
