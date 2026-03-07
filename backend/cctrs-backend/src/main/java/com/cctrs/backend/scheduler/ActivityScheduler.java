package com.cctrs.backend.scheduler;

import com.cctrs.backend.service.ActivityService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled tasks for the CCTRS backend.
 *
 * Auto-archival: activities older than 30 days are marked as archived
 * (is_archived = true). They disappear from all default UI views but remain
 * fully stored — admin search can still surface them. User scores, badges
 * and monthly progress are not affected.
 */
@Component
public class ActivityScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ActivityScheduler.class);

    private final ActivityService activityService;

    public ActivityScheduler(ActivityService activityService) {
        this.activityService = activityService;
    }

    /**
     * Runs every day at 02:00 server time.
     * Archives activities created more than 30 days ago that are neither
     * already deleted nor already archived.
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void autoArchiveOldActivities() {
        logger.info("Starting scheduled auto-archival of activities older than 30 days...");
        try {
            int archived = activityService.archiveOldActivities();
            logger.info("Auto-archival complete: {} activities archived.", archived);
        } catch (Exception e) {
            logger.error("Auto-archival failed: {}", e.getMessage(), e);
        }
    }
}
