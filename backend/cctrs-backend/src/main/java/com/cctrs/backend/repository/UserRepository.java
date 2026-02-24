package com.cctrs.backend.repository;

import com.cctrs.backend.model.User;
import com.cctrs.backend.repository.mapper.UserRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.util.List;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public User save(User user) {
        if (user.getId() != null) {
            // UPDATE existing user
            jdbcTemplate.update(
                    "UPDATE users SET name = ?, email = ?, username = ?, password = ?, role = ?, points = ?, email_verified = ? WHERE id = ?",
                    user.getName(),
                    user.getEmail(),
                    user.getUsername(),
                    user.getPassword(),
                    user.getRole(),
                    user.getPoints(),
                    user.getEmailVerified() != null ? user.getEmailVerified() : false,
                    user.getId()
            );
            return user;
        }

        // INSERT new user
        String sql = "INSERT INTO users (name, email, username, password, role, points, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[] { "ID" });
            ps.setString(1, user.getName());
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getUsername());
            ps.setString(4, user.getPassword());
            ps.setString(5, user.getRole());
            ps.setInt(6, user.getPoints());
            ps.setBoolean(7, user.getEmailVerified() != null ? user.getEmailVerified() : false);
            return ps;
        }, keyHolder);

        Long generatedId = keyHolder.getKeyAs(Long.class);
        user.setId(generatedId);

        return user;
    }

    public List<User> findAll() {
        return jdbcTemplate.query(
                "SELECT * FROM users",
                new UserRowMapper());
    }

    public User findById(Long id) {
        List<User> users = jdbcTemplate.query(
                "SELECT * FROM users WHERE id = ?",
                new UserRowMapper(),
                id);
        return users.isEmpty() ? null : users.get(0);
    }

    public User findByEmail(String email) {
        List<User> users = jdbcTemplate.query(
                "SELECT * FROM users WHERE email = ?",
                new UserRowMapper(),
                email);
        return users.isEmpty() ? null : users.get(0);
    }

    public User findByEmailIgnoreCase(String email) {
        List<User> users = jdbcTemplate.query(
                "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
                new UserRowMapper(),
                email);
        return users.isEmpty() ? null : users.get(0);
    }

    public User findByUsername(String username) {
        List<User> users = jdbcTemplate.query(
                "SELECT * FROM users WHERE username = ?",
                new UserRowMapper(),
                username);
        return users.isEmpty() ? null : users.get(0);
    }

    public void updatePoints(Long userId, int points) {
        jdbcTemplate.update(
                "UPDATE users SET points = ? WHERE id = ?",
                points,
                userId);
    }

    public void updatePassword(Long userId, String encodedPassword) {
        jdbcTemplate.update(
                "UPDATE users SET password = ? WHERE id = ?",
                encodedPassword,
                userId);
    }

    public List<User> findTopUsersByPoints(int limit) {
        return jdbcTemplate.query(
                "SELECT * FROM users ORDER BY points DESC LIMIT ?",
                new UserRowMapper(),
                limit);
    }
}