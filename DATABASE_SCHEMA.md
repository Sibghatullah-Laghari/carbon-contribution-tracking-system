# DATABASE_SCHEMA.md

This document summarizes the database structure based on:
- `backend/cctrs-backend/src/main/resources/schema.sql` (runtime bootstrap schema)
- migration scripts in `database/`

The backend is configured for PostgreSQL in production profile.

---

## 1. `users`

Primary user identity and account table.

### Columns
- `id` BIGINT identity, PK
- `name` VARCHAR(100) NOT NULL
- `email` VARCHAR(100) NOT NULL UNIQUE
- `username` VARCHAR(100) NOT NULL UNIQUE
- `password` VARCHAR(255)
- `role` VARCHAR(20) NOT NULL DEFAULT `'USER'`
- `points` INT DEFAULT 0
- `email_verified` BOOLEAN DEFAULT FALSE
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Indexes
- `idx_email` on `email`
- `idx_username` on `username`

---

## 2. `activities`

Core activity/proof/review table.

### Columns
- `id` BIGINT identity, PK
- `user_id` BIGINT NOT NULL FK -> `users(id)`
- `activity_type` VARCHAR(100) NOT NULL
- `description` TEXT
- `declared_quantity` INT DEFAULT 0
- `verification_flag` VARCHAR(20) DEFAULT `'OK'`
- `points` INT NOT NULL DEFAULT 0
- `status` VARCHAR(20) NOT NULL DEFAULT `'PENDING'`
- `rejection_reason` TEXT
- `proof_image` TEXT
- `latitude` DOUBLE PRECISION
- `longitude` DOUBLE PRECISION
- `is_flagged` BOOLEAN DEFAULT FALSE
- `flag_reason` VARCHAR(255)
- `flag_distance_meters` DOUBLE PRECISION
- `proof_time` TIMESTAMP
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Indexes
- `idx_user_id` on `user_id`
- `idx_status` on `status`
- `idx_tree_location` on `(user_id, latitude, longitude)`

### Migration-added operational flags
From `migration_add_soft_delete_archive.sql`:
- `is_deleted` BOOLEAN NOT NULL DEFAULT false
- `is_archived` BOOLEAN NOT NULL DEFAULT false
- `idx_activities_is_deleted`
- `idx_activities_is_archived`
- `idx_activities_user_active` on `(user_id, is_deleted, is_archived)`

---

## 3. `proof_sessions`

Tracks short-lived proof capture sessions.

### Columns
- `id` VARCHAR(50), PK
- `user_id` BIGINT NOT NULL FK -> `users(id)`
- `activity_id` BIGINT FK -> `activities(id)`
- `start_time` TIMESTAMP
- `expiry_time` TIMESTAMP
- `status` VARCHAR(20)

---

## 4. `questions`

Stores public user questions and admin answers.

### Columns
- `id` BIGINT identity, PK
- `name` VARCHAR(255)
- `email` VARCHAR(255) NOT NULL
- `question` TEXT NOT NULL
- `answer` TEXT
- `status` VARCHAR(20) NOT NULL DEFAULT `'UNANSWERED'`
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `answered_at` TIMESTAMP

### Indexes
- `idx_questions_email` on `email` (migration file)
- `idx_questions_status` on `status` (migration file)

---

## 5. `user_daily_limits`

Per-user per-day anti-abuse counters.

### Columns
- `id` BIGINT identity, PK
- `user_id` BIGINT NOT NULL FK -> `users(id)`
- `date` DATE NOT NULL
- `activity_count` INT DEFAULT 0
- `trees_declared` INT DEFAULT 0

### Constraints
- `UNIQUE(user_id, date)`

---

## 6. Migration Notes / Inconsistencies

Some scripts in `database/` are historical or dialect-specific and may not be directly idempotent across all engines:
- `migration_add_rejection_reason.sql` uses MySQL-style `AFTER status` and `DESCRIBE`.
- Root `database/schema.sql` includes legacy `AUTO_INCREMENT` syntax and duplicate ALTER patterns.

For backend runtime behavior, treat `backend/cctrs-backend/src/main/resources/schema.sql` as the primary canonical schema and apply targeted migration files for production changes.
