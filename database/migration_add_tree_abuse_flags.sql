-- Add anti-abuse fields for tree plantation verification
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS flag_reason VARCHAR(255);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS flag_distance_meters DOUBLE PRECISION;

-- Speed up duplicate GPS checks
CREATE INDEX IF NOT EXISTS idx_tree_location ON activities(user_id, latitude, longitude);
