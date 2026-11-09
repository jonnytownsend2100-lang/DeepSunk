-- Shared, non-personal spend counter for image-to-video generations.
-- One row per UTC day; an atomic UPSERT reserves each generation slot.
CREATE TABLE IF NOT EXISTS imagine_daily_budget (
  bucket TEXT PRIMARY KEY,
  used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
