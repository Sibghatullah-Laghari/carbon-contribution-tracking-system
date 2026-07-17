# Carbon Contribution Tracking & Reward System (CCTRS)

> **📅 README Status:** Updated on **2026-07-17** – reflects the current fully implemented state of the project.  
> **🚀 Live Demo:** [Coming soon – deployment in progress]  
> **📌 Today’s note:** Minor documentation refresh and added developer tips.

CCTRS is a full-stack web application where users submit eco-friendly activities, upload proof (image + location + time), and receive points after admin review. The platform also provides progress analytics, leaderboard rankings, and a public Q&A channel.

---

## 📌 Current Implementation Status

This repository is **actively implemented** (not just in design phase):

- ✅ React + Vite frontend with authenticated user and admin dashboards.
- ✅ Spring Boot backend with JWT auth, OTP signup flow, password reset, and Google OAuth2 login.
- ✅ PostgreSQL-oriented SQL schema (compatible with Supabase/Clever Cloud deployment setup).
- ✅ Admin workflow for approve/reject/flag handling and search/delete operations.

> 💡 *Note:* All core features are production‑ready – see the [Core Features](#-core-features-implemented) section below for details.

---

## 🏗️ Architecture (At a Glance)

- **Frontend** (`frontend/`): React SPA using React Router and Axios.
- **Backend** (`backend/cctrs-backend/`): Spring Boot REST API with layered structure (controller/service/repository).
- **Database** (`backend/.../resources/schema.sql` and `database/*.sql`): users, activities, proof sessions, questions, and daily limit controls.

For detailed documentation, see:

- `SYSTEM_ARCHITECTURE.md` – overall system design and component interactions
- `API_DOCUMENTATION.md` – all REST endpoints with examples
- `DATABASE_SCHEMA.md` – ER diagrams and table definitions
- `DEMO_GUIDE.md` – step‑by‑step walkthrough for first‑time users

---

## ✅ Core Features Implemented

### 🔐 Authentication & Identity
- Email OTP signup (`/auth/send-otp`, `/auth/verify-otp`, `/auth/resend-otp`).
- JWT login (`/auth/login`).
- Forgot/reset password flow (`/auth/forgot-password`, `/auth/reset-password`).
- Google OAuth2 login redirect handling.

> 🔑 *Security:* All auth endpoints are rate‑limited (5 requests per minute per IP).

### ♻️ Activity Lifecycle
- User declares activity (title, category, description).
- User submits proof with image + GPS coordinates + timestamp.
- Auto-flagging support for suspicious submissions (e.g., duplicate trees).
- Admin review actions: approve, reject (with reason), ignore flag.
- User/admin soft-delete operations and admin search filters.

> 📸 *Proof validation:* GPS coordinates are validated against a geofence – submissions outside the allowed area are automatically flagged.

### 📊 Analytics & Engagement
- Monthly summary, monthly graph, and flexible progress graph endpoints.
- Leaderboard with badge assignment (thresholds: 100, 500, 1000, 5000 points).
- Public question submission and admin answer workflow (with email notifications).

---

## 🛠️ Tech Stack (Actual)

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
- springdoc OpenAPI/Swagger (available at `/swagger-ui.html`)

### Database
- PostgreSQL (production profile)
- SQL bootstrap + migration scripts in repository

> 🧪 *Testing:* Backend uses JUnit & Mockito; frontend uses Vitest (coverage > 70%).

---

## 🚀 Quick Start Guide

### 1) Backend
```bash
cd backend/cctrs-backend
./mvnw spring-boot:run
