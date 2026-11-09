-- Durable anonymous visitor quotas, short-window abuse controls, and a job ledger.
-- Prompts are encrypted by the application before storage. Uploaded source images
-- are never persisted. The global daily budget remains the final spend backstop.

ALTER TABLE imagine_daily_budget
  ADD COLUMN IF NOT EXISTS reserved_usd NUMERIC(12, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS imagine_visitor_daily_usage (
  bucket TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bucket, visitor_hash)
);

CREATE TABLE IF NOT EXISTS imagine_rate_limits (
  window_key TEXT NOT NULL,
  scope TEXT NOT NULL,
  subject_hash TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (window_key, scope, subject_hash)
);

CREATE TABLE IF NOT EXISTS imagine_jobs (
  id TEXT PRIMARY KEY,
  visitor_hash TEXT NOT NULL,
  daily_bucket TEXT NOT NULL,
  upstream_request_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('submitting', 'submission_unknown', 'pending', 'done', 'failed', 'expired')),
  prompt_ciphertext TEXT NOT NULL,
  model TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration BETWEEN 1 AND 15),
  resolution TEXT NOT NULL CHECK (resolution IN ('480p', '720p', '1080p')),
  aspect_ratio TEXT NOT NULL,
  generate_audio BOOLEAN NOT NULL DEFAULT TRUE,
  estimated_cost NUMERIC(12, 2) NOT NULL CHECK (estimated_cost >= 0),
  video_url TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS imagine_jobs_owner_created_idx
  ON imagine_jobs (visitor_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS imagine_jobs_status_updated_idx
  ON imagine_jobs (status, updated_at);

CREATE INDEX IF NOT EXISTS imagine_rate_limits_updated_idx
  ON imagine_rate_limits (updated_at);
CREATE INDEX IF NOT EXISTS imagine_visitor_usage_bucket_idx
  ON imagine_visitor_daily_usage (bucket);
CREATE INDEX IF NOT EXISTS imagine_budget_bucket_idx
  ON imagine_daily_budget (bucket);
