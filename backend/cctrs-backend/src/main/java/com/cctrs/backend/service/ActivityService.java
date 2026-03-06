package com.cctrs.backend.service;

import com.cctrs.backend.dto.AdminActivityDto;
import com.cctrs.backend.model.Activity;
import com.cctrs.backend.model.ActivityType;
import com.cctrs.backend.model.User;
import com.cctrs.backend.repository.ActivityRepository;
import com.cctrs.backend.repository.UserDailyLimitRepository;
import com.cctrs.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Service
public class ActivityService {

    private static final Logger logger = LoggerFactory.getLogger(ActivityService.class);

    private final ActivityRepository activityRepository;
    private final UserService userService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final UserDailyLimitRepository dailyLimitRepository;

    public ActivityService(ActivityRepository activityRepository,
            UserService userService,
            EmailService emailService,
            UserRepository userRepository,
            UserDailyLimitRepository dailyLimitRepository) {
        this.activityRepository = activityRepository;
        this.userService = userService;
        this.emailService = emailService;
        this.userRepository = userRepository;
        this.dailyLimitRepository = dailyLimitRepository;
    }

    // User declares activity (Stage 1)
    public Activity declareActivity(Activity activity) {
        // Validation
        if (activity.getUserId() == null || activity.getUserId() <= 0) {
            throw new IllegalArgumentException("Valid userId is required");
        }
        if (activity.getActivityType() == null || activity.getActivityType().trim().isEmpty()) {
            throw new IllegalArgumentException("Activity type is required");
        }

        // Check User existence
        userService.getUserById(activity.getUserId());

        // Default verification flag
        String flag = "OK";
        boolean isFlagged = false;
        String flagReason = null;

        // RULE 1: Daily Limit Check
        // Update daily limits and check bounds
        // For declaration, we increment limits. If limit exceeded -> FLAGGED
        int quantity = activity.getDeclaredQuantity() != null ? activity.getDeclaredQuantity() : 1;

        // Check if total activities exceed limit (Rule: Max 10 activities per day)
        // Need to fetch current count first or rely on repository check logic
        // We will increment first, then check.
        // dailyLimitRepository logic uses void increment. We should update repository
        // or just assume increment works.
        // To be safe and strict, let's fetch daily limit record.

        dailyLimitRepository.incrementActivityCount(activity.getUserId(), java.time.LocalDate.now());

        // Check "Too many activities" rule
        com.cctrs.backend.model.UserDailyLimit limit = dailyLimitRepository.findByUserIdAndDate(activity.getUserId(),
                java.time.LocalDate.now());
        if (limit != null && limit.getActivityCount() > 10) {
            flag = "FLAGGED";
            isFlagged = true;
        }

        if (isTreePlantation(activity.getActivityType())) {
            dailyLimitRepository.incrementTreeCount(activity.getUserId(), java.time.LocalDate.now(), quantity);

            // Required anti-abuse rule: flag if today's total is already at limit.
            int todayTreeTotal = activityRepository.getTodayTreePlantationTotal(activity.getUserId(), LocalDate.now());
            if (todayTreeTotal >= 10) {
                flag = "FLAGGED";
                isFlagged = true;
                flagReason = appendReason(flagReason, "Daily plantation limit exceeded (10 trees)");
            }
        }

        if (activity.getPoints() == null || activity.getPoints() <= 0) {
            int basePointsPerUnit = 1;
            String type = activity.getActivityType() != null ? activity.getActivityType().toLowerCase() : "";
            if (type.contains("tree")) {
                basePointsPerUnit = 10;
            } else if (type.contains("transport")) {
                basePointsPerUnit = 2;
            } else if (type.contains("recycling")) {
                basePointsPerUnit = 5;
            }
            int computedPoints = quantity * basePointsPerUnit;
            activity.setPoints(computedPoints);
        }

        activity.setStatus("DECLARED");
        activity.setVerificationFlag(flag);
        activity.setIsFlagged(isFlagged);
        activity.setFlagReason(flagReason);

        // Set timestamp if not provided
        if (activity.getCreatedAt() == null) {
            activity.setCreatedAt(LocalDateTime.now());
        }

        return activityRepository.save(activity);
    }

    // Legacy method support (redirects to declareActivity or handles direct
    // creation if needed)
    // Keeping this signature to avoid breaking existing tests if they call
    // createActivity directly
    // But updating logic to match new flow
    public Activity createActivity(Activity activity) {
        return declareActivity(activity);
    }

    // Submit Proof (Stage 2)
    public Activity submitProof(Long activityId, Long userId, String proofImage, Double lat, Double lon,
            LocalDateTime proofTime) {
        Activity activity = activityRepository.findById(activityId);
        if (activity == null) {
            throw new IllegalArgumentException("Activity not found");
        }

        if (!activity.getUserId().equals(userId)) {
            throw new SecurityException("You are not authorized to submit proof for this activity");
        }

        if (!"DECLARED".equals(activity.getStatus())) {
            throw new IllegalArgumentException("Activity is not in DECLARED state");
        }

        boolean isFlagged = Boolean.TRUE.equals(activity.getIsFlagged()) ||
                "FLAGGED".equalsIgnoreCase(activity.getVerificationFlag());
        String flagReason = activity.getFlagReason();
        Double duplicateDistanceMeters = null;

        if (isTreePlantation(activity.getActivityType())) {
            duplicateDistanceMeters = activityRepository.findNearestTreeDistanceMeters(userId, lat, lon);
            if (duplicateDistanceMeters != null && duplicateDistanceMeters <= 10.0d) {
                isFlagged = true;
                flagReason = appendReason(flagReason, "Plantation within 10 meters of previous tree");
            }
        }

        String verificationFlag = isFlagged ? "FLAGGED" : "OK";

        activityRepository.submitProof(activityId, proofImage, lat, lon, proofTime, isFlagged, flagReason,
                duplicateDistanceMeters);
        activityRepository.updateVerificationFlag(activityId, verificationFlag);

        activity.setProofImage(proofImage);
        activity.setLatitude(lat);
        activity.setLongitude(lon);
        activity.setProofTime(proofTime);
        activity.setStatus("PROOF_SUBMITTED");
        activity.setVerificationFlag(verificationFlag);
        activity.setIsFlagged(isFlagged);
        activity.setFlagReason(flagReason);
        activity.setFlagDistanceMeters(duplicateDistanceMeters);
        return activity;
    }

    public void ignoreActivityFlag(Long activityId) {
        if (activityId == null || activityId <= 0) {
            throw new IllegalArgumentException("Valid activity ID is required");
        }
        Activity activity = activityRepository.findById(activityId);
        if (activity == null) {
            throw new IllegalArgumentException("Activity not found with ID: " + activityId);
        }
        activityRepository.clearFlag(activityId);
        activityRepository.updateVerificationFlag(activityId, "OK");
    }

    private boolean isTreePlantation(String activityType) {
        return ActivityType.TREE_PLANTATION.getDisplayName().equalsIgnoreCase(activityType)
                || ActivityType.TREE_PLANTATION.name().equalsIgnoreCase(activityType)
                || "Tree Plantation".equalsIgnoreCase(activityType);
    }

    private String appendReason(String existing, String additional) {
        if (existing == null || existing.isBlank()) {
            return additional;
        }
        if (existing.contains(additional)) {
            return existing;
        }
        return existing + " | " + additional;
    }

    public List<Activity> getAllActivities() {
        return activityRepository.findAll();
    }

    /**
     * Returns all activities enriched with the submitting user's name/email.
     * Used exclusively by the Admin Panel.
     */
    public List<AdminActivityDto> getAllActivitiesWithUser() {
        return activityRepository.findAllWithUser();
    }

    /**
     * Dynamic search for admin — filters by query text, category, status, date range.
     * Optionally includes archived and/or deleted records.
     */
    public List<AdminActivityDto> searchActivities(String query, String category,
                                                    String status, String dateFrom,
                                                    String dateTo,
                                                    boolean includeArchived,
                                                    boolean includeDeleted) {
        return activityRepository.searchActivities(query, category, status, dateFrom, dateTo,
                includeArchived, includeDeleted);
    }

    /**
     * Admin deletes (soft) an activity.
     * Scores / points are preserved in users.points.
     */
    public void deleteActivity(Long activityId) {
        if (activityId == null || activityId <= 0) {
            throw new IllegalArgumentException("Valid activity ID is required");
        }
        Activity activity = activityRepository.findById(activityId);
        if (activity == null) {
            throw new IllegalArgumentException("Activity not found with ID: " + activityId);
        }
        activityRepository.deleteById(activityId); // now a soft-delete
        logger.info("Admin soft-deleted activity ID: {}", activityId);
    }

    /**
     * Admin bulk-deletes (soft) a list of activities.
     * Returns the count of rows actually updated.
     */
    public int bulkDeleteActivities(List<Long> ids) {
        if (ids == null || ids.isEmpty()) throw new IllegalArgumentException("No activity IDs provided");
        int count = activityRepository.bulkSoftDeleteByIds(ids);
        logger.info("Admin bulk soft-deleted {} activities", count);
        return count;
    }

    public List<Activity> getActivitiesByUser(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("Valid userId is required");
        }
        return activityRepository.findByUserId(userId);
    }

    /**
     * User deletes ONE of their own activities (any status).
     * Implemented as a soft-delete — the row is hidden from UI but scores are preserved.
     */
    public void deleteUserActivity(Long activityId, Long userId) {
        if (activityId == null || activityId <= 0) throw new IllegalArgumentException("Valid activity ID is required");
        if (userId == null || userId <= 0)         throw new IllegalArgumentException("Valid user ID is required");

        Activity activity = activityRepository.findById(activityId);
        // findById now returns only non-deleted/non-archived, so also try a raw lookup
        if (activity == null) throw new IllegalArgumentException("Activity not found");
        if (!activity.getUserId().equals(userId)) throw new SecurityException("Not authorised to delete this activity");

        activityRepository.deleteById(activityId); // soft-delete — scores intact
        logger.info("User {} soft-deleted activity {}", userId, activityId);
    }

    /**
     * User bulk-deletes a list of their own activities (any status).
     * Validates ownership per ID, then performs a single bulk soft-delete.
     * Returns the count of actually deleted records.
     */
    public int bulkDeleteUserActivities(java.util.List<Long> ids, Long userId) {
        if (ids == null || ids.isEmpty()) throw new IllegalArgumentException("No activity IDs provided");
        if (userId == null || userId <= 0)   throw new IllegalArgumentException("Valid user ID is required");

        // Collect IDs that are owned by this user
        java.util.List<Long> validIds = new java.util.ArrayList<>();
        for (Long id : ids) {
            try {
                if (id == null) continue;
                Activity activity = activityRepository.findById(id);
                if (activity == null) continue;
                if (!activity.getUserId().equals(userId)) continue; // ownership check
                validIds.add(id);
            } catch (Exception e) {
                logger.warn("Skipping activity {} during bulk delete check: {}", id, e.getMessage());
            }
        }
        int deleted = activityRepository.bulkSoftDeleteByIds(validIds);
        logger.info("User {} bulk soft-deleted {} activities out of {} requested", userId, deleted, ids.size());
        return deleted;
    }

    public List<Activity> getActivitiesByStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Valid status is required");
        }
        return activityRepository.findByStatus(status);
    }

    /**
     * Archive activities older than 30 days.
     * Called by the scheduled job — preserves rows and scores, just hides from default views.
     * Returns the count of newly archived rows.
     */
    public int archiveOldActivities() {
        java.time.LocalDateTime cutoff = java.time.LocalDateTime.now().minusDays(30);
        int count = activityRepository.archiveOlderThan(cutoff);
        logger.info("Archived {} activities older than 30 days (cutoff: {})", count, cutoff);
        return count;
    }

    // Admin approves activity
    public void approveActivity(Long activityId) {

        // Validate activityId
        if (activityId == null || activityId <= 0) {
            throw new IllegalArgumentException("Valid activity ID is required");
        }

        // Fetch the activity by ID first
        Activity activity = activityRepository.findById(activityId);

        if (activity == null) {
            throw new IllegalArgumentException("Activity not found with ID: " + activityId);
        }

        // Check if already approved
        if ("APPROVED".equals(activity.getStatus())) {
            throw new IllegalArgumentException("Activity is already approved");
        }

        // Ensure Proof is Submitted (Optional: Can admin approve DECLARED without
        // proof? Maybe, but usually needs proof)
        // Prompt says: Stage 3: Admin verification.
        // If status is DECLARED, admin can still approve (maybe overriding proof
        // requirement), or we should enforce.
        // Let's allow approval from any state for Admin flexibility, or warn. I'll
        // stick to logic "Admin approves".

        // Update status
        activityRepository.updateStatus(activityId, "APPROVED");

        // Add points to user
        userService.addPointsToUser(
                activity.getUserId(),
                activity.getPoints());

        // Send approval email notification
        try {
            User user = userRepository.findById(activity.getUserId());
            if (user != null && user.getEmail() != null) {
                emailService.sendApprovalEmail(user.getEmail(), activity.getActivityType());
                logger.info("Approval notification sent for activity ID: {} to user: {}", activityId, user.getEmail());
            } else {
                logger.warn("Could not send approval email - user or email not found for activity ID: {}", activityId);
            }
        } catch (Exception e) {
            logger.error("Error sending approval email for activity ID: {}. Error: {}", activityId, e.getMessage());
            // Don't throw exception - email failure shouldn't block approval
        }
    }

    // Admin rejects activity
    public void rejectActivity(Long activityId, String rejectionReason) {

        // Validate activityId
        if (activityId == null || activityId <= 0) {
            throw new IllegalArgumentException("Valid activity ID is required");
        }

        // Fetch the activity by ID first
        Activity activity = activityRepository.findById(activityId);

        if (activity == null) {
            throw new IllegalArgumentException("Activity not found with ID: " + activityId);
        }

        // Check if already rejected
        if ("REJECTED".equals(activity.getStatus())) {
            throw new IllegalArgumentException("Activity is already rejected");
        }

        // Check if already approved
        if ("APPROVED".equals(activity.getStatus())) {
            throw new IllegalArgumentException("Cannot reject an already approved activity");
        }

        // Update status to REJECTED
        activityRepository.updateStatus(activityId, "REJECTED");

        // Store rejection reason if provided
        if (rejectionReason != null && !rejectionReason.trim().isEmpty()) {
            activityRepository.updateRejectionReason(activityId, rejectionReason);
        }

        // Send rejection email notification
        try {
            User user = userRepository.findById(activity.getUserId());
            if (user != null && user.getEmail() != null) {
                emailService.sendRejectionEmailWithReason(user.getEmail(), activity.getActivityType(), rejectionReason);
                logger.info("Rejection notification sent for activity ID: {} to user: {}", activityId, user.getEmail());
            } else {
                logger.warn("Could not send rejection email - user or email not found for activity ID: {}", activityId);
            }
        } catch (Exception e) {
            logger.error("Error sending rejection email for activity ID: {}. Error: {}", activityId, e.getMessage());
            // Don't throw exception - email failure shouldn't block rejection
        }
    }
}
