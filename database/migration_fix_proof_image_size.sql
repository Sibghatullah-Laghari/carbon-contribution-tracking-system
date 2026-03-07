-- Migration: Fix proof_image column size to prevent VARCHAR overflow errors
-- Error fixed: "ERROR: value too long for type character varying(500)"
--   triggered by: UPDATE activities SET proof_image = ? ... WHERE id = ?
--
-- Root cause: proof_image was VARCHAR(500), but the application stores Base64-encoded
-- image data (up to 10MB uploads), which can produce 13+ million characters.
--
-- Apply this migration ONCE against the production (Supabase) database.

ALTER TABLE activities ALTER COLUMN proof_image TYPE TEXT;
