-- Persist generated MP4s privately in xAI Files API and smooth provider polling.
-- xai_file_id is only ever read through an owner-checked application endpoint.
ALTER TABLE imagine_jobs
  ADD COLUMN IF NOT EXISTS xai_file_id TEXT;

CREATE INDEX IF NOT EXISTS imagine_jobs_file_id_idx
  ON imagine_jobs (xai_file_id)
  WHERE xai_file_id IS NOT NULL;

-- Token bucket rows are updated atomically with one UPSERT. Unlike fixed
-- wall-clock windows, capacity + refill rate limits bursts across boundaries.
CREATE TABLE IF NOT EXISTS imagine_token_buckets (
  bucket_key TEXT PRIMARY KEY,
  tokens DOUBLE PRECISION NOT NULL CHECK (tokens >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS imagine_token_buckets_updated_idx
  ON imagine_token_buckets (updated_at);
