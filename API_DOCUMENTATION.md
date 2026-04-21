# API_DOCUMENTATION.md

Base URL (local default): `http://localhost:8080`

Response convention: many routes return `ApiResponse<T>` wrapper (`message`, `data`, `success`, etc.), though a few routes (like proof start) return raw objects.

---

## 1. Authentication (`/auth`)

### POST `/auth/send-otp`
Start signup by sending OTP to email.

### POST `/auth/resend-otp`
Resend OTP for pending signup email.

### POST `/auth/verify-otp`
Verify OTP and create account.

### POST `/auth/signup`
Legacy endpoint; intentionally rejects and asks clients to use `/auth/send-otp`.

### POST `/auth/login`
Email/password login; returns JWT token + role + email.

### POST `/auth/forgot-password`
Request password reset link.

### POST `/auth/reset-password`
Reset password using token.

---

## 2. User Management (`/api/users`)

### POST `/api/users` (ADMIN)
Create user.

### GET `/api/users` (ADMIN)
Get all users.

### GET `/api/users/{id}`
Get user by ID.

### GET `/api/users/me`
Get authenticated user profile.

### POST `/api/users/send-otp`
Legacy/alternate OTP send flow from user service.

### POST `/api/users/verify-otp`
Legacy/alternate OTP verification flow from user service.

---

## 3. Activities (User) (`/api/activities`)

### POST `/api/activities`
Declare a new activity.

### POST `/api/activities/{id}/proof`
Submit proof (multipart or form fields): image + latitude + longitude (+ optional proofTime).

### GET `/api/activities`
Get authenticated user's activities.

### GET `/api/activities/user`
Also get authenticated user's activities (alias behavior).

### GET `/api/activities/status/{status}`
Get activities filtered by status.
Allowed status values include: `DECLARED`, `PROOF_SUBMITTED`, `PENDING`, `APPROVED`, `REJECTED`, `FLAGGED`.

### DELETE `/api/activities/{id}`
Delete own eligible activity.

### DELETE `/api/activities/bulk`
Bulk delete own eligible activities.
Body example:
```json
{ "ids": [1,2,3] }
```

---

## 4. Activities (Admin) (`/admin/activities`)

### GET `/admin/activities`
Get all activities for admin review.

### GET `/admin/activities/search`
Search/filter activities.
Query params:
- `query`
- `category`
- `status`
- `dateFrom`
- `dateTo`
- `includeArchived` (default `false`)
- `includeDeleted` (default `false`)

### PUT `/admin/activities/approve/{id}`
Approve activity and apply points.

### PUT `/admin/activities/reject/{id}`
Reject activity with optional reason body.

### PUT `/admin/activities/ignore-flag/{id}`
Clear ignore flag on flagged activity.

### DELETE `/admin/activities/{id}`
Admin soft-delete a single activity.

### DELETE `/admin/activities/bulk`
Admin soft-delete multiple activities.
Body example:
```json
{ "ids": [10,11,12] }
```

---

## 5. Reporting (`/report` and `/api/report`)

The same endpoints are exposed under both prefixes.

### GET `/report/summary` and `/api/report/summary`
Query params: `month`, `year`.
Returns monthly summary DTO.

### GET `/report/graph` and `/api/report/graph`
Query param: `year`.
Returns monthly graph data.

### GET `/report/progress` and `/api/report/progress`
Query params:
- `fromDate` (optional)
- `toDate` (optional)
- `granularity` (optional, default `MONTH`)
- `activityType` (optional)
- `status` (optional)

---

## 6. Leaderboard (`/api/leaderboard`)

### GET `/api/leaderboard`
Returns top 10 users by points with badge metadata.

---

## 7. Proof Session (`/proof` and `/api/proof`)

### POST `/proof/start` and `/api/proof/start`
Creates a proof session.
`activityId` can be provided via query param or request body.

---

## 8. Questions (Public/Admin)

### POST `/public/questions`
Submit public question.

### GET `/public/questions?email=...`
Fetch user's submitted questions by email.

### GET `/admin/questions` (ADMIN)
Fetch all questions.

### POST `/admin/questions/{id}/answer` (ADMIN)
Submit answer for question and trigger email send.

---

## 9. Auth & Access Summary

- Public routes: `/auth/**`, `/public/**`, `/oauth2/**`, `/login/oauth2/**`.
- Admin-only routes: `/admin/**` (+ method-level restrictions on `/api/users` create/list/delete).
- Other routes generally require authenticated JWT context.
