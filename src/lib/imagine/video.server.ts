/** Server-only Grok Imagine Video integration with durable, visitor-scoped jobs. */
import { randomUUID } from "node:crypto";
import { isWorkspacePreview } from "@/lib/env.server";
import { dbSource, getSql } from "@/lib/db";
import {
  DEV_STANDIN_FILE_ID,
  developmentRequestId,
  isDevelopmentRequestId,
  liveXaiBillingEnabled,
} from "@/lib/imagine/billing";
import { fingerprintGenerationIntent } from "@/lib/imagine/request-fingerprint.server";
import { buildXaiVideoPayload, imageAssetCount, validateGenerationInput } from "@/lib/imagine/request-contract";
import { consumeTokenBucket } from "@/lib/imagine/token-bucket.server";
import {
  DEFAULT_CLIP_MODEL,
  DAILY_SPEND_CAP_USD,
  GLOBAL_POLL_PER_SECOND,
  IP_DAILY_CLIP_BUDGET,
  IP_HOURLY_CLIP_BUDGET,
  LIVE_CLIP_BUDGET,
  MAX_PROMPT,
  PREVIEW_CLIP_BUDGET,
  PREVIEW_SPEND_CAP_USD,
  VISITOR_CLIP_BUDGET,
  VISITOR_POLL_PER_MINUTE,
  estimateClipCost,
} from "@/lib/imagine/limits";
import type { ClipAspectRatio, ClipDuration, ClipModel, ClipResolution, GenerationMode } from "@/lib/imagine/limits";
import type { GenerationInput, ImagineJobSummary, ImagineStatus, PollResponse, StartResponse } from "@/lib/imagine/types";
import {
  decryptPrompt,
  encryptPrompt,
  getSecuritySecret,
  issueJobToken,
  verifyJobToken,
  type VisitorContext,
} from "@/lib/imagine/visitor.server";

if (typeof window !== "undefined") throw new Error("imagine/video.server is server-only");

const XAI_VIDEOS = "https://api.x.ai/v1/videos";

/** Paid xAI calls are refused in the workspace. Published apps are the only callers. */
async function xaiFetch(url: string, init: RequestInit): Promise<Response> {
  if (!liveXaiBillingEnabled(isWorkspacePreview())) {
    throw new Error("Refusing a billed xAI call from the development server.");
  }
  if (!url.startsWith("https://api.x.ai/")) throw new Error("Unexpected video upstream.");
  return fetch(url, init);
}
const REQUEST_TIMEOUT_MS = 45_000;
const POLL_TIMEOUT_MS = 20_000;
const MAX_UPSTREAM_RESPONSE_BYTES = 64 * 1024;
const cleanupGlobal = globalThis as typeof globalThis & { __stillwakeCleanupAt__?: number };

export type StartInput = GenerationInput;

type SqlClient = Awaited<ReturnType<typeof getSql>>;
type BudgetSnapshot = { used: number; reservedUsd: number };
type ReservationDeniedCode = "budget" | "visitor_budget" | "rate_limit";

class ReservationDenied extends Error {
  constructor(readonly code: ReservationDeniedCode, message: string) {
    super(message);
    this.name = "ReservationDenied";
  }
}

function clipCap(): number {
  return isWorkspacePreview() ? PREVIEW_CLIP_BUDGET : LIVE_CLIP_BUDGET;
}
function visitorCap(): number {
  return isWorkspacePreview() ? PREVIEW_CLIP_BUDGET : VISITOR_CLIP_BUDGET;
}
function spendCap(): number {
  return isWorkspacePreview() ? PREVIEW_SPEND_CAP_USD : DAILY_SPEND_CAP_USD;
}
function key(): string | undefined {
  const value = process.env.XAI_API_KEY?.trim();
  return value || undefined;
}
function persistentBudgetAvailable(): boolean {
  return isWorkspacePreview() || dbSource === "neon";
}
function utcDayBucket(): string {
  return new Date().toISOString().slice(0, 10);
}
function utcHourBucket(): string {
  return new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString().slice(0, 13);
}
function utcMinuteBucket(): string {
  return new Date(Math.floor(Date.now() / 60_000) * 60_000).toISOString().slice(0, 16);
}

async function cleanupOldRows(sql: SqlClient): Promise<void> {
  // A best-effort once-per-warm-process retention sweep. Multiple serverless
  // instances may race this cleanup safely; all deletes are age-bounded.
  if (cleanupGlobal.__stillwakeCleanupAt__ && Date.now() - cleanupGlobal.__stillwakeCleanupAt__ < 24 * 60 * 60 * 1000) return;
  cleanupGlobal.__stillwakeCleanupAt__ = Date.now();
  try {
    await Promise.all([
      sql.query("DELETE FROM imagine_jobs WHERE created_at < NOW() - INTERVAL '90 days'"),
      sql.query("DELETE FROM imagine_rate_limits WHERE updated_at < NOW() - INTERVAL '2 days'"),
      sql.query("DELETE FROM imagine_token_buckets WHERE updated_at < NOW() - INTERVAL '2 days'"),
      sql.query("DELETE FROM imagine_visitor_daily_usage WHERE bucket < TO_CHAR(NOW() - INTERVAL '90 days', 'YYYY-MM-DD')"),
      sql.query("DELETE FROM imagine_daily_budget WHERE bucket < TO_CHAR(NOW() - INTERVAL '90 days', 'YYYY-MM-DD')"),
    ]);
  } catch (error) {
    cleanupGlobal.__stillwakeCleanupAt__ = undefined;
    console.warn("[imagine] retention cleanup skipped:", error instanceof Error ? error.message : "unknown error");
  }
}

async function readBudget(sql: SqlClient, bucket: string): Promise<BudgetSnapshot> {
  const rows = await sql.query<{ used: number | string; reserved_usd: number | string }>(
    "SELECT used, reserved_usd FROM imagine_daily_budget WHERE bucket = $1 LIMIT 1",
    [bucket],
  );
  return {
    used: Number(rows[0]?.used ?? 0),
    reservedUsd: Number(rows[0]?.reserved_usd ?? 0),
  };
}

async function readVisitorUsage(sql: SqlClient, bucket: string, ownerHash: string): Promise<number> {
  const rows = await sql.query<{ used: number | string }>(
    "SELECT used FROM imagine_visitor_daily_usage WHERE bucket = $1 AND visitor_hash = $2 LIMIT 1",
    [bucket, ownerHash],
  );
  return Number(rows[0]?.used ?? 0);
}

async function reserveGlobalBudget(
  sql: SqlClient,
  bucket: string,
  cost: number,
): Promise<boolean> {
  const rows = await sql.query<{ used: number }>(
    `INSERT INTO imagine_daily_budget (bucket, used, reserved_usd)
     VALUES ($1, 1, $2)
     ON CONFLICT (bucket)
     DO UPDATE SET
       used = imagine_daily_budget.used + 1,
       reserved_usd = imagine_daily_budget.reserved_usd + $2,
       updated_at = NOW()
     WHERE imagine_daily_budget.used < $3
       AND imagine_daily_budget.reserved_usd + $2 <= $4
     RETURNING used`,
    [bucket, cost, clipCap(), spendCap()],
  );
  return rows.length > 0;
}

async function reserveVisitor(sql: SqlClient, bucket: string, ownerHash: string): Promise<boolean> {
  const rows = await sql.query<{ used: number }>(
    `INSERT INTO imagine_visitor_daily_usage (bucket, visitor_hash, used)
     VALUES ($1, $2, 1)
     ON CONFLICT (bucket, visitor_hash)
     DO UPDATE SET used = imagine_visitor_daily_usage.used + 1, updated_at = NOW()
     WHERE imagine_visitor_daily_usage.used < $3
     RETURNING used`,
    [bucket, ownerHash, visitorCap()],
  );
  return rows.length > 0;
}

async function reserveRateLimit(
  sql: SqlClient,
  windowKey: string,
  scope: string,
  subjectHash: string,
  limit: number,
): Promise<boolean> {
  const rows = await sql.query<{ used: number }>(
    `INSERT INTO imagine_rate_limits (window_key, scope, subject_hash, used)
     VALUES ($1, $2, $3, 1)
     ON CONFLICT (window_key, scope, subject_hash)
     DO UPDATE SET used = imagine_rate_limits.used + 1, updated_at = NOW()
     WHERE imagine_rate_limits.used < $4
     RETURNING used`,
    [windowKey, scope, subjectHash, limit],
  );
  return rows.length > 0;
}

async function releaseGlobalBudget(sql: SqlClient, bucket: string, cost: number): Promise<void> {
  await sql.query(
    `UPDATE imagine_daily_budget
       SET used = GREATEST(used - 1, 0),
           reserved_usd = GREATEST(reserved_usd - $2, 0),
           updated_at = NOW()
     WHERE bucket = $1`,
    [bucket, cost],
  );
}

async function releaseVisitor(sql: SqlClient, bucket: string, ownerHash: string): Promise<void> {
  await sql.query(
    `UPDATE imagine_visitor_daily_usage
       SET used = GREATEST(used - 1, 0), updated_at = NOW()
     WHERE bucket = $1 AND visitor_hash = $2`,
    [bucket, ownerHash],
  );
}

async function releaseReservation(
  sql: SqlClient,
  bucket: string,
  ownerHash: string,
  cost: number,
): Promise<void> {
  await sql.transaction(async (tx) => {
    await releaseGlobalBudget(tx, bucket, cost);
    await releaseVisitor(tx, bucket, ownerHash);
  });
}

function scrub(text: string): string {
  return text
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/(?:xai-[A-Za-z0-9_-]{12,})/g, "[redacted]")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function messageFrom(status: number, raw: string, body: unknown): string {
  if (status === 401 || status === 403) return "The xAI server key was rejected. Check the key configured for this app.";
  if (status === 429) return "xAI rate-limited this request. Wait a moment before trying again.";
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string") return scrub(record.error);
    if (record.error && typeof record.error === "object") {
      const nested = (record.error as { message?: unknown }).message;
      if (typeof nested === "string") return scrub(nested);
    }
    if (typeof record.message === "string") return scrub(record.message);
  }
  return scrub(raw) || `Video service error ${status}`;
}

async function readLimitedResponse(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_UPSTREAM_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined);
        return "Upstream response exceeded the allowed size.";
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function createJob(
  sql: SqlClient,
  input: StartInput,
  ownerHash: string,
  bucket: string,
  cost: number,
  fingerprint: string,
): Promise<string> {
  const id = randomUUID();
  await sql.query(
    `INSERT INTO imagine_jobs
      (id, visitor_hash, daily_bucket, status, prompt_ciphertext, model, generation_mode, image_input_count,
       duration, resolution, aspect_ratio, generate_audio, estimated_cost, idempotency_key, request_fingerprint)
     VALUES ($1, $2, $3, 'submitting', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [id, ownerHash, bucket, encryptPrompt(input.prompt), input.model, input.mode, imageAssetCount(input),
      input.duration, input.resolution, input.aspectRatio, input.generateAudio, cost, input.idempotencyKey, fingerprint],
  );
  return id;
}

async function currentRemaining(sql: SqlClient, ownerHash: string): Promise<number> {
  const bucket = utcDayBucket();
  const [visitorUsed, budget] = await Promise.all([
    readVisitorUsage(sql, bucket, ownerHash),
    readBudget(sql, bucket),
  ]);
  const visitorRemaining = Math.max(0, visitorCap() - visitorUsed);
  const clipRemaining = Math.max(0, clipCap() - budget.used);
  const affordableSlots = Math.floor(Math.max(0, spendCap() - budget.reservedUsd) / estimateClipCost(1, "480p", "grok-imagine-video-1.5-lite", 0));
  return Math.min(visitorRemaining, clipRemaining, affordableSlots);
}

async function listRecentJobs(sql: SqlClient, ownerHash: string): Promise<ImagineJobSummary[]> {
  const rows = await sql.query<{
    id: string;
    status: ImagineJobSummary["status"];
    prompt_ciphertext: string;
    duration: number | string;
    resolution: ClipResolution;
    aspect_ratio: ClipAspectRatio;
    generate_audio: boolean;
    model: ClipModel;
    generation_mode: GenerationMode;
    image_input_count: number | string;
    estimated_cost: number | string;
    created_at: Date | string;
    video_url: string | null;
    xai_file_id: string | null;
    error_message: string | null;
  }>(
    `SELECT id, status, prompt_ciphertext, duration, resolution, aspect_ratio,
            generate_audio, model, generation_mode, image_input_count, estimated_cost, created_at, video_url, xai_file_id, error_message
       FROM imagine_jobs
      WHERE visitor_hash = $1
      ORDER BY created_at DESC
      LIMIT 12`,
    [ownerHash],
  );
  return rows.map((row) => ({
    id: row.id,
    token: issueJobToken(row.id, ownerHash),
    status: row.status,
    prompt: decryptPrompt(row.prompt_ciphertext),
    model: row.model,
    mode: row.generation_mode,
    imageCount: Number(row.image_input_count),
    settings: {
      duration: Number(row.duration) as ClipDuration,
      resolution: row.resolution,
      aspectRatio: row.aspect_ratio,
    },
    generateAudio: row.generate_audio,
    cost: Number(row.estimated_cost),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    ...(row.xai_file_id && /^file_[A-Za-z0-9_-]{8,128}$/.test(row.xai_file_id)
      ? { videoUrl: `/api/imagine/download/${row.id}` }
      : row.video_url?.startsWith("https://") ? { videoUrl: row.video_url } : {}),
    ...(row.error_message ? { error: row.error_message } : {}),
  }));
}

type IdempotentJob = {
  id: string;
  status: ImagineJobSummary["status"];
  request_fingerprint: string | null;
  error_message: string | null;
};

function requestFingerprint(input: StartInput): string {
  return fingerprintGenerationIntent(input);
}

async function findIdempotentJob(
  sql: SqlClient,
  ownerHash: string,
  idempotencyKey: string,
): Promise<IdempotentJob | null> {
  const rows = await sql.query<IdempotentJob>(
    `SELECT id, status, request_fingerprint, error_message
       FROM imagine_jobs
      WHERE visitor_hash = $1 AND idempotency_key = $2
      LIMIT 1`,
    [ownerHash, idempotencyKey],
  );
  return rows[0] ?? null;
}

async function replayIdempotentJob(
  sql: SqlClient,
  job: IdempotentJob,
  fingerprint: string,
  ownerHash: string,
): Promise<StartResponse> {
  if (!job.request_fingerprint || job.request_fingerprint !== fingerprint) {
    return { ok: false, code: "idempotency_conflict", error: "This retry key was already used for different input. Start a new render with a new request key.", remaining: await safeRemaining(ownerHash) };
  }
  const token = issueJobToken(job.id, ownerHash);
  const remaining = await safeRemaining(ownerHash);
  if (job.status === "pending" || job.status === "done") return { ok: true, token, remaining };
  if (job.status === "failed" || job.status === "expired") {
    return { ok: false, code: "already_failed", error: job.error_message || "The original render did not complete. Start a new render to retry.", remaining };
  }
  return { ok: false, code: "network_ambiguous", error: job.error_message || "The original request is still being reconciled. Do not submit a duplicate.", remaining, token };
}

export async function imagineStatus(visitor: VisitorContext | null): Promise<ImagineStatus> {
  const preview = isWorkspacePreview();
  const securityReady = Boolean(getSecuritySecret());
  const base: ImagineStatus = {
    keyReady: liveXaiBillingEnabled(preview) ? Boolean(key()) : true,
    preview,
    securityReady,
    budgetReady: false,
    usedToday: 0,
    remaining: 0,
    cap: visitorCap(),
    globalUsedToday: 0,
    globalRemaining: 0,
    reservedSpendUsd: 0,
    remainingSpendUsd: spendCap(),
    spendCapUsd: spendCap(),
    model: DEFAULT_CLIP_MODEL,
    jobs: [],
  };
  if (!visitor || !securityReady || !persistentBudgetAvailable()) return base;
  try {
    const sql = await getSql();
    await cleanupOldRows(sql);
    const bucket = utcDayBucket();
    const [budget, usedToday, jobs] = await Promise.all([
      readBudget(sql, bucket),
      readVisitorUsage(sql, bucket, visitor.ownerHash),
      listRecentJobs(sql, visitor.ownerHash),
    ]);
    const globalRemaining = Math.min(
      Math.max(0, clipCap() - budget.used),
      budget.reservedUsd >= spendCap() ? 0 : Math.max(0, Math.floor((spendCap() - budget.reservedUsd) / estimateClipCost(1, "480p", "grok-imagine-video-1.5-lite", 0))),
    );
    base.budgetReady = true;
    base.usedToday = usedToday;
    base.globalUsedToday = budget.used;
    base.globalRemaining = globalRemaining;
    base.reservedSpendUsd = Number(budget.reservedUsd.toFixed(2));
    base.remainingSpendUsd = Number(Math.max(0, spendCap() - budget.reservedUsd).toFixed(2));
    base.remaining = Math.min(Math.max(0, visitorCap() - usedToday), globalRemaining);
    base.jobs = jobs;
    return base;
  } catch (error) {
    console.error("[imagine] status query failed:", error instanceof Error ? error.message : "unknown error");
    return base;
  }
}

export async function startClip(input: StartInput, visitor: VisitorContext): Promise<StartResponse> {
  const live = liveXaiBillingEnabled(isWorkspacePreview());
  const apiKey = live ? key() : undefined;
  if (live && !apiKey) return { ok: false, code: "no_key", error: "Video generation is unavailable: the server key is not configured.", remaining: 0 };
  if (!getSecuritySecret()) return { ok: false, code: "security_config", error: "Paid generation is locked: configure STILLWAKE_SESSION_SECRET with at least 32 characters.", remaining: 0 };
  if (!persistentBudgetAvailable()) return { ok: false, code: "budget_storage", error: "Paid generation is locked because a shared PostgreSQL database is not configured.", remaining: 0 };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.idempotencyKey)) {
    return { ok: false, code: "idempotency_key", error: "A valid generation request key is required. Reload the studio and try again.", remaining: await safeRemaining(visitor.ownerHash) };
  }
  if (typeof input.prompt !== "string") return { ok: false, code: "prompt", error: "Provide a creative direction or source media.", remaining: await safeRemaining(visitor.ownerHash) };
  const prompt = input.prompt.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, MAX_PROMPT);
  const normalizedInput: StartInput = { ...input, prompt };
  const validationError = validateGenerationInput(normalizedInput);
  if (validationError) {
    const code = validationError.toLowerCase().includes("image") || validationError.toLowerCase().includes("frame") || validationError.toLowerCase().includes("reference") ? "image" : "settings";
    return { ok: false, code, error: validationError, remaining: await safeRemaining(visitor.ownerHash) };
  }
  const fingerprint = requestFingerprint(normalizedInput);
  const catalogCost = estimateClipCost(input.duration, input.resolution, input.model, imageAssetCount(input));
  const cost = live ? catalogCost : 0;
  const bucket = utcDayBucket();
  let sql: SqlClient;
  try {
    sql = await getSql();
    await cleanupOldRows(sql);
  } catch {
    return { ok: false, code: "budget_storage", error: "The shared spend-protection database is unavailable. No request was sent to xAI.", remaining: 0 };
  }

  try {
    const existing = await findIdempotentJob(sql, visitor.ownerHash, input.idempotencyKey);
    if (existing) return await replayIdempotentJob(sql, existing, fingerprint, visitor.ownerHash);
  } catch (error) {
    console.error("[imagine] idempotency lookup failed:", error instanceof Error ? error.message : "unknown error");
    return { ok: false, code: "job_storage", error: "Could not verify the generation request key. No request was sent to xAI.", remaining: 0 };
  }

  let jobId: string;
  try {
    // Quota reservations, rate-limit counters, and the durable job row commit
    // together. A failure at any step rolls back the entire reservation, so a
    // DB error cannot strand a quota slot or spend amount.
    jobId = await sql.transaction(async (tx) => {
      const globalOk = await reserveGlobalBudget(tx, bucket, cost);
      if (!globalOk) {
        throw new ReservationDenied("budget", "The application has reached its daily spend or render ceiling. The budget resets at 00:00 UTC.");
      }
      const visitorOk = await reserveVisitor(tx, bucket, visitor.ownerHash);
      if (!visitorOk) {
        throw new ReservationDenied("visitor_budget", `Your daily limit is ${visitorCap()} renders. It resets at 00:00 UTC.`);
      }
      if (visitor.ipHash) {
        const hourlyOk = await reserveRateLimit(tx, `hour:${utcHourBucket()}`, "ip_hour", visitor.ipHash, IP_HOURLY_CLIP_BUDGET);
        if (!hourlyOk) {
          throw new ReservationDenied("rate_limit", "Too many generation attempts from this network. Try again in an hour.");
        }
        const dailyIpOk = await reserveRateLimit(tx, `day:${bucket}`, "ip_day", visitor.ipHash, IP_DAILY_CLIP_BUDGET);
        if (!dailyIpOk) {
          throw new ReservationDenied("rate_limit", "This network has reached its daily generation limit. Try again after the UTC reset.");
        }
      }
      return createJob(tx, normalizedInput, visitor.ownerHash, bucket, cost, fingerprint);
    });
  } catch (error) {
    if (error instanceof ReservationDenied) {
      const remaining = error.code === "visitor_budget" ? 0 : await safeRemaining(visitor.ownerHash);
      return { ok: false, code: error.code, error: error.message, remaining };
    }

    // Concurrent identical submissions can both pass the initial lookup. The
    // owner/key unique index elects one winner; the losing transaction rolls
    // back every quota increment before it replays the winning job.
    try {
      const existing = await findIdempotentJob(sql, visitor.ownerHash, input.idempotencyKey);
      if (existing) return await replayIdempotentJob(sql, existing, fingerprint, visitor.ownerHash);
    } catch {
      // Fall through to a safe storage error; never send a second upstream call.
    }
    console.error("[imagine] atomic reservation/job transaction failed:", error instanceof Error ? error.message : "unknown error");
    return { ok: false, code: "job_storage", error: "Could not atomically reserve the shared budget and create the durable job. No request was sent to xAI.", remaining: await safeRemaining(visitor.ownerHash) };
  }

  const token = issueJobToken(jobId, visitor.ownerHash);
  if (!live) {
    const requestId = developmentRequestId(jobId);
    await sql.query(
      "UPDATE imagine_jobs SET upstream_request_id = $2, status = 'pending', error_code = NULL, error_message = NULL, updated_at = NOW() WHERE id = $1",
      [jobId, requestId],
    );
    return { ok: true, token, remaining: await safeRemaining(visitor.ownerHash) };
  }
  if (!apiKey) return { ok: false, code: "no_key", error: "Video generation is unavailable: the server key is not configured.", remaining: 0 };
  let response: Response;
  try {
    response = await xaiFetch(`${XAI_VIDEOS}/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(buildXaiVideoPayload(normalizedInput, jobId)),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    await sql.query(
      "UPDATE imagine_jobs SET status = 'submission_unknown', error_code = 'network_ambiguous', error_message = $2, updated_at = NOW() WHERE id = $1",
      [jobId, "The connection ended before xAI confirmed whether the job was accepted. The spend reservation is retained to prevent duplicate generation."],
    );
    return {
      ok: false,
      code: "network_ambiguous",
      error: "The connection ended before xAI confirmed the request. The job is saved as submission-unknown and its spend reservation remains held. Check your xAI request history before retrying.",
      remaining: await safeRemaining(visitor.ownerHash),
      token,
    };
  }

  let raw: string;
  try {
    raw = await readLimitedResponse(response);
  } catch (error) {
    // The provider may have accepted the request even if its response stream
    // was interrupted. Do not release the reservation or permit a blind retry.
    await sql.query(
      "UPDATE imagine_jobs SET status = 'submission_unknown', error_code = 'response_read_failed', error_message = $2, updated_at = NOW() WHERE id = $1",
      [jobId, "xAI response could not be read completely. Its acceptance state is unknown; do not submit a duplicate."],
    ).catch(() => undefined);
    console.error("[imagine] xAI response stream failed after submit:", { jobId, message: error instanceof Error ? error.message : "unknown error" });
    return {
      ok: false,
      code: "network_ambiguous",
      error: "The xAI response was interrupted. The job is retained as submission-unknown; do not submit a duplicate.",
      remaining: await safeRemaining(visitor.ownerHash),
      token,
    };
  }
  let body: unknown = null;
  try { body = JSON.parse(raw) as unknown; } catch { body = null; }
  const requestId = body && typeof body === "object" && typeof (body as { request_id?: unknown }).request_id === "string"
    ? (body as { request_id: string }).request_id
    : "";

  if (!response.ok) {
    const message = messageFrom(response.status, raw, body);
    // A 408 (timeout) or 425 (too early) can leave the provider's acceptance
    // outcome ambiguous for a paid POST. Keep the reservation in those cases.
    if (response.status < 500 && response.status !== 408 && response.status !== 425) {
      await sql.query(
        "UPDATE imagine_jobs SET status = 'failed', error_code = 'upstream_rejected', error_message = $2, updated_at = NOW(), completed_at = NOW() WHERE id = $1",
        [jobId, message],
      );
      // If quota release fails, keeping the reservation is the safer failure
      // mode. A failed job must never be made available for duplicate replay.
      await releaseReservation(sql, bucket, visitor.ownerHash, cost).catch((error) => {
        console.error("[imagine] rejected-job quota release failed:", error instanceof Error ? error.message : "unknown error");
      });
      return { ok: false, code: "upstream", error: message, remaining: await safeRemaining(visitor.ownerHash) };
    }
    await sql.query(
      "UPDATE imagine_jobs SET status = 'submission_unknown', error_code = 'upstream_5xx', error_message = $2, updated_at = NOW() WHERE id = $1",
      [jobId, message],
    );
    return { ok: false, code: "network_ambiguous", error: `${message} The job is retained as submission-unknown to prevent duplicate spend.`, remaining: await safeRemaining(visitor.ownerHash), token };
  }

  if (!/^[\w-]{8,128}$/.test(requestId)) {
    await sql.query(
      "UPDATE imagine_jobs SET status = 'submission_unknown', error_code = 'upstream_shape', error_message = $2, updated_at = NOW() WHERE id = $1",
      [jobId, "xAI returned success without a usable request ID."],
    );
    return { ok: false, code: "upstream_shape", error: "xAI returned an unusable success response. The job and spend reservation were retained for manual reconciliation.", remaining: await safeRemaining(visitor.ownerHash), token };
  }

  try {
    await sql.query(
      "UPDATE imagine_jobs SET upstream_request_id = $2, status = 'pending', error_code = NULL, error_message = NULL, updated_at = NOW() WHERE id = $1",
      [jobId, requestId],
    );
  } catch (error) {
    // xAI may already be generating. Preserve the local idempotency record and
    // spend reservation; expose an unknown state rather than inviting a retry.
    console.error("[imagine] xAI accepted job but request ID persistence failed:", { jobId, requestId, message: error instanceof Error ? error.message : "unknown error" });
    return {
      ok: false,
      code: "network_ambiguous",
      error: "xAI accepted the generation, but the job ID could not be saved. Do not retry this request. Contact the operator with the job reference shown in Recent renders.",
      remaining: await safeRemaining(visitor.ownerHash),
      token,
    };
  }
  return { ok: true, token, remaining: await safeRemaining(visitor.ownerHash) };
}

async function safeRemaining(ownerHash: string): Promise<number> {
  try { return await currentRemaining(await getSql(), ownerHash); } catch { return 0; }
}

export async function pollClip(token: string, visitor: VisitorContext): Promise<PollResponse> {
  const live = liveXaiBillingEnabled(isWorkspacePreview());
  const apiKey = live ? key() : undefined;
  if (live && !apiKey) return { ok: false, code: "no_key", error: "Video generation is unavailable." };
  const jobId = verifyJobToken(token, visitor.ownerHash);
  if (!jobId) return { ok: false, code: "unknown", error: "That job token is invalid, expired, or belongs to another visitor." };

  let sql: SqlClient;
  try { sql = await getSql(); } catch { return { ok: false, code: "database", error: "The job database is temporarily unavailable." }; }
  const jobs = await sql.query<{
    upstream_request_id: string | null;
    status: ImagineStatus["jobs"][number]["status"];
    video_url: string | null;
    xai_file_id: string | null;
    error_message: string | null;
  }>(
    "SELECT upstream_request_id, status, video_url, xai_file_id, error_message FROM imagine_jobs WHERE id = $1 AND visitor_hash = $2 LIMIT 1",
    [jobId, visitor.ownerHash],
  );
  const job = jobs[0];
  if (!job) return { ok: false, code: "unknown", error: "That job does not exist for this visitor." };
  if (job.status === "submitting") {
    const message = "The local job was created, but its upstream request ID was not durably recorded. Check xAI request history before retrying.";
    await sql.query(
      "UPDATE imagine_jobs SET status = 'submission_unknown', error_code = 'stale_submitting', error_message = $3, updated_at = NOW() WHERE id = $1 AND visitor_hash = $2 AND status = 'submitting'",
      [jobId, visitor.ownerHash, message],
    );
    return { ok: true, status: "unknown", error: message };
  }
  if (job.status === "submission_unknown") {
    return { ok: true, status: "unknown", error: job.error_message || "The upstream request outcome is unknown. Check xAI request history before retrying." };
  }
  if (job.status === "failed" || job.status === "expired") {
    return { ok: true, status: job.status, error: job.error_message || "The render did not complete." };
  }
  if (job.status === "done") {
    if (job.xai_file_id && /^file_[A-Za-z0-9_-]{8,128}$/.test(job.xai_file_id)) {
      return { ok: true, status: "done", url: `/api/imagine/download/${jobId}` };
    }
    if (job.video_url?.startsWith("https://")) return { ok: true, status: "done", url: job.video_url };
  }
  if (isDevelopmentRequestId(job.upstream_request_id)) {
    await sql.query(
      "UPDATE imagine_jobs SET status = 'done', video_url = NULL, xai_file_id = $2, error_code = NULL, error_message = NULL, completed_at = NOW(), updated_at = NOW() WHERE id = $1",
      [jobId, DEV_STANDIN_FILE_ID],
    );
    return { ok: true, status: "done", url: `/api/imagine/download/${jobId}` };
  }
  if (!live) {
    return { ok: false, code: "development", error: "Development mode does not call the billed xAI API." };
  }
  if (!apiKey) return { ok: false, code: "no_key", error: "Video generation is unavailable." };
  if (!job.upstream_request_id) return { ok: true, status: "unknown", error: "The upstream request ID was not recorded. Check xAI request history." };

  // Rate reservations are one transaction. A rejected request does not burn
  // only some of the global/visitor/IP buckets and slowly starve healthy work.
  class PollRateLimitDenied extends Error {}
  try {
    await sql.transaction(async (tx) => {
      const minuteKey = `minute:${utcMinuteBucket()}`;
      if (!await reserveRateLimit(tx, minuteKey, "visitor_poll", visitor.ownerHash, VISITOR_POLL_PER_MINUTE)) {
        throw new PollRateLimitDenied();
      }
      if (visitor.ipHash && !await reserveRateLimit(tx, minuteKey, "ip_poll", visitor.ipHash, VISITOR_POLL_PER_MINUTE * 2)) {
        throw new PollRateLimitDenied();
      }
      // xAI Lite documents a 10 req/s limit. A 1-token burst + 8 tokens/s refill
      // preserves headroom for other provider calls and avoids fixed-window spikes.
      if (!await consumeTokenBucket(tx, { key: "stillwake:global-poll", capacity: 1, refillPerSecond: GLOBAL_POLL_PER_SECOND })) {
        throw new PollRateLimitDenied();
      }
      if (!await consumeTokenBucket(tx, { key: `visitor-poll:${visitor.ownerHash}`, capacity: 3, refillPerSecond: 0.5 })) {
        throw new PollRateLimitDenied();
      }
      if (visitor.ipHash && !await consumeTokenBucket(tx, { key: `ip-poll:${visitor.ipHash}`, capacity: 8, refillPerSecond: 2 })) {
        throw new PollRateLimitDenied();
      }
    });
  } catch (error) {
    if (error instanceof PollRateLimitDenied) {
      return { ok: false, code: "rate_limit", error: "The studio is checking many renders at once. Status checks will resume shortly." };
    }
    throw error;
  }

  let response: Response;
  try {
    response = await xaiFetch(`${XAI_VIDEOS}/${encodeURIComponent(job.upstream_request_id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(POLL_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, code: "network", error: "Couldn't reach xAI to check this render." };
  }
  const raw = await readLimitedResponse(response);
  let body: unknown = null;
  try { body = JSON.parse(raw) as unknown; } catch { body = null; }
  if (!response.ok || !body || typeof body !== "object") {
    return { ok: false, code: "upstream", error: messageFrom(response.status, raw, body) };
  }

  const record = body as { status?: unknown; video?: { url?: unknown; file_output?: { file_id?: unknown } }; error?: unknown };
  const upstreamStatus = typeof record.status === "string" ? record.status.toLowerCase() : "pending";
  if (upstreamStatus === "done") {
    const url = record.video && typeof record.video.url === "string" ? record.video.url : "";
    const fileId = record.video?.file_output?.file_id;
    const storedFileId = typeof fileId === "string" && /^file_[A-Za-z0-9_-]{8,128}$/.test(fileId) ? fileId : null;
    if (!storedFileId && !url.startsWith("https://")) {
      await sql.query(
        "UPDATE imagine_jobs SET status = 'failed', error_code = 'missing_video_url', error_message = $2, completed_at = NOW(), updated_at = NOW() WHERE id = $1",
        [jobId, "The render completed without a valid HTTPS video link."],
      );
      return { ok: true, status: "failed", error: "The render completed without a valid video link." };
    }
    await sql.query(
      "UPDATE imagine_jobs SET status = 'done', video_url = $2, xai_file_id = $3, error_code = NULL, error_message = NULL, completed_at = NOW(), updated_at = NOW() WHERE id = $1",
      [jobId, storedFileId ? null : url, storedFileId],
    );
    return { ok: true, status: "done", url: storedFileId ? `/api/imagine/download/${jobId}` : url };
  }
  if (upstreamStatus === "failed" || upstreamStatus === "expired") {
    const message = typeof record.error === "string" ? scrub(record.error) : upstreamStatus === "expired" ? "The render expired before it finished." : "Video generation failed.";
    await sql.query(
      "UPDATE imagine_jobs SET status = $2, error_code = $3, error_message = $4, completed_at = NOW(), updated_at = NOW() WHERE id = $1",
      [jobId, upstreamStatus, upstreamStatus, message],
    );
    return { ok: true, status: upstreamStatus, error: message };
  }
  await sql.query("UPDATE imagine_jobs SET status = 'pending', updated_at = NOW() WHERE id = $1", [jobId]);
  return { ok: true, status: "pending" };
}
