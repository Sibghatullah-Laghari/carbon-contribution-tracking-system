//import com.cctrs.backend.dto.MonthlyStatusDto;
//import com.cctrs.backend.entity.Activity;
//import com.cctrs.backend.entity.MonthlySummary;
//import com.cctrs.backend.entity.User;
//import com.cctrs.backend.repository.ActivityRepository;
//
//public MonthlyStatusDto calculateMonthlyStatus(User user, String month) {
//
//    ActivityRepository activityRepository;
//    java.util.List<Activity> approvedActivities =
//            activityRepository.findByUserAndMonthAndStatus(
//                    user, month, "APPROVED"
//            );
//
//    int totalPoints = approvedActivities
//            .stream()
//            .mapToInt(Activity::getPoints)
//            .sum();
//
//    String status = (totalPoints > 0) ? "Improving" : "Stable";
//
//    MonthlySummary summary = new MonthlySummary(
//            user,
//            month,
//            totalPoints,
//            status
//    );
//
//    summaryRepository.save(summary);
//
//    return new MonthlyStatusDto(totalPoints, status);
//}
