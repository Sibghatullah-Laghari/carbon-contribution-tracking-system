# DEMO_GUIDE.md

This guide is for judges to run and test CCTRS quickly.

---

## 1. Prerequisites

- Java 17+
- Node.js 18+
- npm
- PostgreSQL database (or configured hosted DB)

---

## 2. Backend Setup

```bash
cd backend/cctrs-backend
cp .env.example .env   # optional reference; actual env vars can be exported in shell
```

Set required environment variables before running:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- (optional for OAuth2) `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- (optional URL config) `FRONTEND_URL`, `BACKEND_URL`

Run backend:

```bash
./mvnw spring-boot:run
```

Backend starts at `http://localhost:8080` by default.

---

## 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` by default.

Ensure frontend API base URL points to backend (see `src/config/apiBaseUrl.js` and env).

---

## 4. Judge Demo Flow (Recommended)

### Step A — Signup/Login
1. Open frontend at `http://localhost:5173`.
2. Create account via signup (OTP flow).
3. Verify OTP.
4. Login and confirm dashboard access.

### Step B — Submit User Activity
1. Navigate to **Submit Activity**.
2. Create activity declaration.
3. Navigate to proof submission and upload image with location/time.
4. Verify entry appears in **My Activities** with pending/proof-submitted state.

### Step C — Admin Review
1. Login as admin account.
2. Open admin activity screen.
3. Approve one activity, reject one (with reason), and (if available) ignore one flag.
4. Confirm status changes and user points update.

### Step D — Analytics & Ranking
1. Open monthly progress page.
2. Open leaderboard page.
3. Confirm charts and ranking data are populated.

### Step E — Public Q&A
1. Submit a question from public/help area.
2. Login as admin and answer that question.
3. Confirm question status/answer persistence.

---

## 5. API Smoke Test Option

From repository root:

```bash
bash test-api.sh
```

Use this as a quick endpoint sanity check in addition to UI-driven verification.

---

## 6. Key Endpoints for Manual Verification

- Auth: `/auth/send-otp`, `/auth/verify-otp`, `/auth/login`
- Activities: `/api/activities`, `/api/activities/{id}/proof`
- Admin activities: `/admin/activities`, `/admin/activities/search`, `/admin/activities/approve/{id}`
- Reports: `/api/report/summary`, `/api/report/graph`, `/api/report/progress`
- Leaderboard: `/api/leaderboard`
- Q&A: `/public/questions`, `/admin/questions/{id}/answer`

---

## 7. Expected Evidence for Evaluation

Judges can collect the following artifacts:
- User signup + login success.
- Activity created + proof submitted.
- Admin approval/rejection actions.
- Updated points/leaderboard.
- Report pages showing monthly/progress data.
- Public question submission and admin answer path.

This evidence demonstrates complete end-to-end functionality across frontend, backend APIs, and database persistence.
