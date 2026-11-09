-- Persist the exact Grok Imagine workflow and number of billable image inputs.
-- Rows created before multi-mode generation are classified as image-to-video.
ALTER TABLE imagine_jobs
  ADD COLUMN IF NOT EXISTS generation_mode TEXT NOT NULL DEFAULT 'image';

ALTER TABLE imagine_jobs
  ADD COLUMN IF NOT EXISTS image_input_count INTEGER NOT NULL DEFAULT 1
  CHECK (image_input_count BETWEEN 0 AND 14);

CREATE INDEX IF NOT EXISTS imagine_jobs_mode_created_idx
  ON imagine_jobs (generation_mode, created_at DESC);
