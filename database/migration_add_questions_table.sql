-- Migration: Add questions table for FAQ question submissions
-- Run this script on the Supabase database once.

CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'UNANSWERED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_email ON questions(email);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
