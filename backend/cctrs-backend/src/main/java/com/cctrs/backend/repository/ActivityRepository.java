package com.cctrs.backend.repository;

import com.cctrs.backend.model.Activity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
public class ActivityRepository {

    private final JdbcTemplate jdbcTemplate;

    public ActivityRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 🔹 APPROVE ACTIVITY

    // 1️⃣ Save activity (USER submits activity)
    public void save(Activity activity) {
        String sql = """
                INSERT INTO activities (user_id, activity_type, points, status)
                VALUES (?, ?, ?, ?)
                """;

        jdbcTemplate.update(
                sql,
                activity.getUserId(),
                activity.getActivityType(),
                activity.getPoints(),
                activity.getStatus()
        );
    }

    // 2️⃣ Get activities by user
    public List<Activity> findByUserId(Long userId) {
        String sql = "SELECT * FROM activities WHERE user_id = ?";

        return jdbcTemplate.query(sql, this::mapRowToActivity, userId);
    }

    // 3️⃣ Admin: get all pending activities
    public List<Activity> findPendingActivities() {
        String sql = "SELECT * FROM activities WHERE status = 'PENDING'";
        return jdbcTemplate.query(sql, this::mapRowToActivity);
    }

    // 4️⃣ Admin: approve activity
    public void approveActivity(Long id) {
        String sql = "UPDATE activities SET status = 'APPROVED' WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }




    // 🔁 Row mapper
    private Activity mapRowToActivity(ResultSet rs, int rowNum) throws SQLException {
        Activity activity = new Activity();
        activity.setId(rs.getLong("id"));
        activity.setUserId(rs.getLong("user_id"));
        activity.setActivityType(rs.getString("activity_type"));
        activity.setPoints(rs.getInt("points"));
        activity.setStatus(rs.getString("status"));
        activity.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return activity;
    }
}
