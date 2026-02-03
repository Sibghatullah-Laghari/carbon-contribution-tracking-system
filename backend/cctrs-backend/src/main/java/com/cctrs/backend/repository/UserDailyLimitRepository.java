package com.cctrs.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.cctrs.backend.model.UserDailyLimit;
import java.time.LocalDate;
import java.util.List;

@Repository
public class UserDailyLimitRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserDailyLimitRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void incrementActivityCount(Long userId, LocalDate date) {
        String checkSql = "SELECT COUNT(*) FROM user_daily_limits WHERE user_id = ? AND date = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId, date);

        if (count != null && count > 0) {
            String updateSql = "UPDATE user_daily_limits SET activity_count = activity_count + 1 WHERE user_id = ? AND date = ?";
            jdbcTemplate.update(updateSql, userId, date);
        } else {
            String insertSql = "INSERT INTO user_daily_limits (user_id, date, activity_count, trees_declared) VALUES (?, ?, 1, 0)";
            jdbcTemplate.update(insertSql, userId, date);
        }
    }

    public void incrementTreeCount(Long userId, LocalDate date, int treeCount) {
        String checkSql = "SELECT COUNT(*) FROM user_daily_limits WHERE user_id = ? AND date = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId, date);

        if (count != null && count > 0) {
            String updateSql = "UPDATE user_daily_limits SET trees_declared = trees_declared + ? WHERE user_id = ? AND date = ?";
            jdbcTemplate.update(updateSql, treeCount, userId, date);
        } else {
            String insertSql = "INSERT INTO user_daily_limits (user_id, date, activity_count, trees_declared) VALUES (?, ?, 0, ?)";
            jdbcTemplate.update(insertSql, userId, date, treeCount);
        }
    }

    public UserDailyLimit findByUserIdAndDate(Long userId, LocalDate date) {
        String sql = "SELECT id, user_id, date, activity_count, trees_declared FROM user_daily_limits WHERE user_id = ? AND date = ?";
        List<UserDailyLimit> list = jdbcTemplate.query(sql, (rs, rowNum) -> {
            UserDailyLimit limit = new UserDailyLimit();
            limit.setId(rs.getLong("id"));
            limit.setUserId(rs.getLong("user_id"));
            limit.setDate(rs.getDate("date").toLocalDate());
            limit.setActivityCount(rs.getInt("activity_count"));
            limit.setTreesDeclared(rs.getInt("trees_declared"));
            return limit;
        }, userId, date);

        return list.isEmpty() ? null : list.get(0);
    }
}
