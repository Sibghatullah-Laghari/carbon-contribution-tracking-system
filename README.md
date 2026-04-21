# Carbon Contribution Tracking & Reward System (CCTRS)

CCTRS is a full-stack web application where users submit eco-friendly activities, upload proof (image + location + time), and receive points after admin review. The platform also provides progress analytics, leaderboard rankings, and a public Q&A channel.

## Current Implementation Status

This repository is **actively implemented** (not just in design phase):

- React + Vite frontend with authenticated user and admin dashboards.
- Spring Boot backend with JWT auth, OTP signup flow, password reset, and Google OAuth2 login.
- PostgreSQL-oriented SQL schema (compatible with Supabase/Clever Cloud deployment setup).
- Admin workflow for approve/reject/flag handling and search/delete operations.

## Architecture (At a Glance)

- **Frontend** (`frontend/`): React SPA using React Router and Axios.
- **Backend** (`backend/cctrs-backend/`): Spring Boot REST API with layered structure (controller/service/repository).
- **Database** (`backend/.../resources/schema.sql` and `database/*.sql`): users, activities, proof sessions, questions, and daily limit controls.

For details, see:

- `SYSTEM_ARCHITECTURE.md`
- `API_DOCUMENTATION.md`
- `DATABASE_SCHEMA.md`
- `DEMO_GUIDE.md`

## Core Features Implemented

### Authentication & Identity
- Email OTP signup (`/auth/send-otp`, `/auth/verify-otp`, `/auth/resend-otp`).
- JWT login (`/auth/login`).
- Forgot/reset password flow (`/auth/forgot-password`, `/auth/reset-password`).
- Google OAuth2 login redirect handling.

### Activity Lifecycle
- User declares activity.
- User submits proof with image + GPS + time.
- Auto-flagging support for suspicious tree submissions.
- Admin review actions: approve, reject (with reason), ignore flag.
- User/admin soft-delete operations and admin search filters.

### Analytics & Engagement
- Monthly summary, monthly graph, and flexible progress graph endpoints.
- Leaderboard with badge assignment.
- Public question submission and admin answer workflow.

## Tech Stack (Actual)

### Frontend
- React 18
- Vite 5
- React Router 6
- Axios
- Chart.js / react-chartjs-2 / Recharts

### Backend
- Java 17
- Spring Boot 3.x
- Spring Security + JWT filter
- Spring OAuth2 Client
- Spring JDBC/JPA mix
- springdoc OpenAPI/Swagger

### Database
- PostgreSQL (production profile)
- SQL bootstrap + migration scripts in repository

## Run Locally

## 1) Backend
```bash
cd backend/cctrs-backend
./mvnw spring-boot:run
```

Expected default backend URL: `http://localhost:8080`

## 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Expected default frontend URL: `http://localhost:5173`

## 3) Optional API smoke test
From repo root:
```bash
bash test-api.sh
```

## Notes on Accuracy Updates

This README replaces inaccurate legacy statements such as:
- frontend being plain HTML/CSS/Bootstrap/JS only,
- database being described only as “supabase”,
- project being only in initialization/design phase.

The current codebase already contains complete frontend routes, implemented backend controllers/services/repositories, and production-ready SQL schema + migration assets.
