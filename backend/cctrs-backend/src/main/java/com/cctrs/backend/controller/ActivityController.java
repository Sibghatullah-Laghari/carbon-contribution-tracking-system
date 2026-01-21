package com.cctrs.backend.controller;

import com.cctrs.backend.model.Activity;
import com.cctrs.backend.repository.ActivityRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityRepository activityRepository;

    public ActivityController(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    // 1️⃣ USER: submit activity
    @PostMapping
    public String submitActivity(@RequestBody Activity activity) {

        activity.setStatus("PENDING");
        activity.setCreatedAt(LocalDateTime.now());

        activityRepository.save(activity);
        return "Activity submitted for approval";
    }

    // 2️⃣ USER: view own activities
    @GetMapping("/user/{userId}")
    public List<Activity> getUserActivities(@PathVariable Long userId) {
        return activityRepository.findByUserId(userId);
    }

    // 3️⃣ ADMIN: view pending activities
    @GetMapping("/pending")
    public List<Activity> getPendingActivities() {
        return activityRepository.findPendingActivities();
    }

    // 4️⃣ ADMIN: approve activity
    @PutMapping("/approve/{activityId}")
    public String approveActivity(@PathVariable("id") Long id) {
        activityRepository.approveActivity(id);
        return "Activity approved";
    }
}
