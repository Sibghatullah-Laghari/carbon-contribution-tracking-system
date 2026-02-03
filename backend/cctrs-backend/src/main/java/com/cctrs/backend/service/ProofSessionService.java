package com.cctrs.backend.service;

import com.cctrs.backend.model.ProofSession;
import com.cctrs.backend.repository.ProofSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ProofSessionService {

    @Autowired
    private ProofSessionRepository repository;

    public ProofSession createSession(Long userId, Long activityId) {

        String proofId = "PRF-" + UUID.randomUUID().toString().substring(0, 8);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.plusMinutes(2);

        ProofSession session = new ProofSession(
                proofId,
                userId,
                activityId,
                now,
                expiry,
                "OPEN");

        repository.save(session);
        return session;
    }
}
