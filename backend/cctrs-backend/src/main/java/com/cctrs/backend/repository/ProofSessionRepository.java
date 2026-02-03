package com.cctrs.backend.repository;

import com.cctrs.backend.model.ProofSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ProofSessionRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void save(ProofSession session) {
        String sql = "INSERT INTO proof_sessions (id, user_id, activity_id, start_time, expiry_time, status) VALUES (?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql,
                session.getId(),
                session.getUserId(),
                session.getActivityId(),
                session.getStartTime(),
                session.getExpiryTime(),
                session.getStatus());
    }
}
