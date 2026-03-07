You are a senior full-stack engineer working on a production system called:

CCTRS — Carbon Contribution Tracking & Reward System

This project contains:

Backend: Spring Boot 3 + JWT + H2/MySQL
Frontend: React Vite + Axios + JWT

Your task is to transform this project into a REAL production-ready system by fixing all logical gaps, API mismatches, security leaks, and completing all missing features WITHOUT breaking existing working parts.

You must analyze the whole project and implement the following corrections and completions.

------------------------------------------------------------
CORE PRODUCT FLOW (MUST BE ACHIEVED)
------------------------------------------------------------

Public user visits site:
Home → Signup → Login → Dashboard

User flow:
Submit Activity (text details)
→ Give Proof (camera + GPS)
→ Wait for Admin Approval
→ Receive email
→ Points updated automatically
→ See graphs, badges, leaderboard

Admin flow:
Login → See activities with proof → Approve/Reject → User auto notified

------------------------------------------------------------
BACKEND CORRECTIONS REQUIRED
------------------------------------------------------------

1. Add GET /api/users/me endpoint using Authentication to return logged-in user.

2. Add GET /admin/activities endpoint in AdminActivityController to list all activities for admin.

3. Fix security leak:
   GET /api/activities must return ONLY activities of logged-in user.
   Use Authentication auth and filter by email.

4. Implement server-side points calculation in ActivityService based on:
   ActivityType and declaredQuantity.

5. Ensure proof upload endpoint:
   POST /api/activities/{id}/proof accepts multipart image + latitude + longitude + timestamp.

6. Ensure email is sent when admin approves or rejects activity.

7. Ensure roles:
   USER and ADMIN properly enforced by Spring Security.

------------------------------------------------------------
FRONTEND CORRECTIONS REQUIRED
------------------------------------------------------------

1. StartProof.jsx:
   Replace placeholder submit with real multipart axios upload to backend.

2. Admin.jsx:
   Add modal to preview proof image and Google Maps link using lat/long.

3. MyActivities.jsx:
   Must call correct user-specific endpoint.

4. Add proper RBAC:
   Admin page visible only to ADMIN role.

5. Dashboard:
   Fetch /api/users/me to show points and summary.

6. Monthly Progress:
   Add chart using backend monthly summary API.

7. Badges:
   Show Bronze/Silver/Gold based on points.

8. Leaderboard:
   Show top users from backend.

------------------------------------------------------------
UI REQUIREMENTS
------------------------------------------------------------

Modern SaaS UI:
Cards, gradients, shadows, responsive layout, sidebar, navbar.

------------------------------------------------------------
IMPORTANT RULES
------------------------------------------------------------

Do NOT break working login and JWT.
Do NOT change API contracts.
Only fix, complete, and connect missing parts.

After changes, project must:
- Compile without errors
- Run with npm run dev and Spring Boot
- Complete full product flow
