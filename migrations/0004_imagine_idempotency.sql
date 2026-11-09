-- Client retries must never create a second paid xAI generation for the same intent.
-- A visitor may reuse an idempotency key only with the exact same request payload.
ALTER TABLE imagine_jobs
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS request_fingerprint TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS imagine_jobs_owner_idempotency_idx
  ON imagine_jobs (visitor_hash, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
