-- Migration: Add soft-delete and auto-archive flags to activities
-- Run once against the live Supabase PostgreSQL database.
-- Safe: uses IF NOT EXISTS / idempotent.

-- Add is_deleted flag (user/admin soft-delete — hides from UI, preserves scores)
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS is_deleted  BOOLEAN NOT NULL DEFAULT false;

-- Add is_archived flag (auto-set by scheduler after 30 days — hides from default views)
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_activities_is_deleted  ON activities(is_deleted);
CREATE INDEX IF NOT EXISTS idx_activities_is_archived ON activities(is_archived);

-- Composite indexes used by the default list queries
CREATE INDEX IF NOT EXISTS idx_activities_user_active
  ON activities(user_id, is_deleted, is_archived);
