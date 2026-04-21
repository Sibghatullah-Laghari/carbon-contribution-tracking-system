# SYSTEM_ARCHITECTURE.md

## 1. System Overview

CCTRS is a three-tier application:

1. **Frontend SPA** (`frontend/`) for user/admin interactions.
2. **Backend API** (`backend/cctrs-backend/`) for auth, business logic, and data access.
3. **Relational database** (PostgreSQL-oriented schema) for persistent state.

Data flow: React UI -> Axios HTTP requests -> Spring Boot controllers/services/repositories -> PostgreSQL.

---

## 2. Frontend Architecture

### 2.1 Framework & Build
- React 18 + Vite.
- Route management via React Router.
- API integration via Axios.
- Charts via Chart.js/react-chartjs-2 and Recharts.

### 2.2 Entry & App Composition
- `src/main.jsx` mounts the app and global styles.
- `src/App.jsx` defines route trees and auth guards.
- `AuthProvider` (`src/context/AuthContext.jsx`) manages token/session state.

### 2.3 Routing Structure

#### Public pages
- `/`, `/login`, `/signup`, `/verify-otp`, `/forgot-password`, `/reset-password`
- Informational/public content pages (`/journey`, `/recycling`, `/terms`, `/help`, `/faq`, `/privacy`)
- `/oauth2/callback` for OAuth2 token handoff
- `/my-questions` for question lookup by email

#### Authenticated user pages
- `/dashboard`
- `/submit-activity`
- `/my-activities`
- `/monthly-progress`
- `/badges`
- `/leaderboard`
- `/proof`

#### Admin pages
- `/admin-cctrs-2024`
- `/admin-search-activities`
- `/admin-questions`

### 2.4 Layout & UI Organization
- Shared layout components in `src/layout/`.
- Dashboard/public pages in `src/pages/`.
- API wrappers in `src/api/`.
- `src/config/apiBaseUrl.js` manages backend base URL resolution.

---

## 3. Backend Architecture

### 3.1 Core Stack
- Java 17 + Spring Boot.
- Spring Security with JWT filter + method security.
- OAuth2 login success handler.
- Service + repository layering.

### 3.2 Package Structure
- `controller/`: REST endpoints for activities, admin actions, reports, leaderboard, proof, users, questions.
- `security/`: Auth controller, JWT utility/filter, security chain, custom user details.
- `service/`: business rules (activity lifecycle, reporting, user logic, email).
- `repository/`: persistence queries and row mappers.
- `model/` + `dto/`: entities and API payload contracts.
- `startup/`: data initialization/migration runner hooks.
- `scheduler/`: timed job shell (archive-related workflow placeholder).

### 3.3 Security Model
- `permitAll`: `/auth/**`, `/public/**`, OAuth2 entry/callback paths, h2-console path.
- `/admin/**`: requires ADMIN role.
- Most remaining routes: authenticated JWT requests.
- Session policy `IF_REQUIRED` to support OAuth2 redirect flow.

### 3.4 Notable Backend Flows
- OTP signup and email verification inside `AuthController`.
- Password reset token handling in-memory (token + expiry maps).
- Activity declaration -> proof submission -> admin approval/rejection.
- Report endpoints available under both `/report/*` and `/api/report/*`.

---

## 4. Database Architecture

### 4.1 Primary Tables
- `users`: identity, auth profile fields, points, role, verification state.
- `activities`: lifecycle status, proof metadata, flags, rejection reason.
- `proof_sessions`: proof-start session records.
- `questions`: public question + admin answer.
- `user_daily_limits`: anti-abuse counters.

### 4.2 Data Lifecycle Highlights
- Activity points are awarded after admin approval.
- Flag metadata supports abuse detection for suspicious submissions.
- Soft-delete/archive flags are added through migrations for operational filtering.

### 4.3 Schema Sources
- Runtime bootstrap schema: `backend/cctrs-backend/src/main/resources/schema.sql`.
- Additional migration scripts in `database/`.

---

## 5. Deployment Topology (as configured)

- Backend profile points to PostgreSQL via environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`).
- Frontend and backend URLs are environment-driven (`FRONTEND_URL`, `BACKEND_URL`).
- Repository includes Vercel and Clever Cloud configuration files.

---

## 6. Documentation Cross-References

- API endpoints: `API_DOCUMENTATION.md`
- Table/column/index details: `DATABASE_SCHEMA.md`
- Hands-on run/demo instructions: `DEMO_GUIDE.md`
