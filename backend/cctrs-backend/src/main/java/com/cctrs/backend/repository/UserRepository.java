package com.cctrs.backend.repository;

import com.cctrs.backend.model.User;
import com.cctrs.backend.repository.mapper.UserRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;
    private final UserRowMapper rowMapper = new UserRowMapper();

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // Save new user
    public void save(User user) {
        String sql = """
            INSERT INTO users (name, username, email, password, role, total_points, active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """;

        jdbcTemplate.update(
                sql,
                user.getName(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                user.getRole(),
                user.getTotalPoints(),
                user.isActive()
        );
    }

    // Find all users
    public List<User> findAll() {
        return jdbcTemplate.query("SELECT * FROM users", rowMapper);
    }

    // Find by username
    public Optional<User> findByUsername(String username) {
        String sql = "SELECT * FROM users WHERE username = ?";
        List<User> users = jdbcTemplate.query(sql, rowMapper, username);
        return users.stream().findFirst();
    }

    // Count users
    public int count() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
    }
}
