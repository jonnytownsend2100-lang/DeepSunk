import { createFileRoute } from "@tanstack/react-router";
import { MAX_REQUEST_BODY_BYTES, PRESET_VOICES } from "@/lib/imagine/limits";
import { startClip } from "@/lib/imagine/video.server";
import { getVisitorFromRequest } from "@/lib/imagine/visitor.server";
import type { StartResponse } from "@/lib/imagine/types";
import type { ClipAspectRatio, ClipDuration, ClipModel, ClipResolution, GenerationMode, PresetVoice } from "@/lib/imagine/limits";
import type { KeyframeInput } from "@/lib/imagine/types";

const NO_STORE = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};
const MAX_BODY_BYTES = MAX_REQUEST_BODY_BYTES;

async function readLimitedBody(request: Request, maxBytes: number): Promise<string> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new Error("body_too_large");
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
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export const Route = createFileRoute("/api/imagine/start")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        const site = request.headers.get("sec-fetch-site");
        if (!origin || site === "cross-site") {
          return Response.json({ ok: false, code: "origin", error: "A same-origin browser request is required.", remaining: 0 }, { status: 403, headers: NO_STORE });
        }
        try {
          if (new URL(origin).origin !== new URL(request.url).origin) {
            return Response.json({ ok: false, code: "origin", error: "Request origin rejected.", remaining: 0 }, { status: 403, headers: NO_STORE });
          }
        } catch {
          return Response.json({ ok: false, code: "origin", error: "Request origin rejected.", remaining: 0 }, { status: 403, headers: NO_STORE });
        }
        if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
          return Response.json({ ok: false, code: "content_type", error: "Use application/json for generation requests.", remaining: 0 }, { status: 415, headers: NO_STORE });
        }
        const contentLength = request.headers.get("content-length");
        if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_BODY_BYTES)) {
          return Response.json({ ok: false, code: "image", error: "The combined media request is too large. Reduce the number or size of source images.", remaining: 0 }, { status: 413, headers: NO_STORE });
        }
        const visitor = getVisitorFromRequest(request, false);
        if (!visitor) {
          return Response.json({ ok: false, code: "visitor", error: "Your visitor session is missing or expired. Reload the studio and try again.", remaining: 0 }, { status: 401, headers: NO_STORE });
        }

        let raw: string;
        try {
          raw = await readLimitedBody(request, MAX_BODY_BYTES);
        } catch (error) {
          const tooLarge = error instanceof Error && error.message === "body_too_large";
          return Response.json(
            { ok: false, code: tooLarge ? "image" : "body", error: tooLarge ? "The combined media request is too large. Reduce the number or size of source images." : "Could not read the request body.", remaining: 0 },
            { status: tooLarge ? 413 : 400, headers: NO_STORE },
          );
        }
        let body: unknown;
        try { body = JSON.parse(raw) as unknown; }
        catch {
          return Response.json({ ok: false, code: "body", error: "The request was not valid JSON.", remaining: 0 }, { status: 400, headers: NO_STORE });
        }
        const record = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
        if (record.generateAudio !== undefined && typeof record.generateAudio !== "boolean") {
          return Response.json({ ok: false, code: "settings", error: "generateAudio must be a boolean.", remaining: 0 }, { status: 400, headers: NO_STORE });
        }
        const duration = Number(record.duration);
        const idempotencyKey = typeof record.idempotencyKey === "string" ? record.idempotencyKey : "";
        const rawKeyframes = Array.isArray(record.keyframes) ? record.keyframes : [];
        const keyframes: KeyframeInput[] = rawKeyframes.map((value) => {
          const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
          return {
            imageDataUrl: typeof item.imageDataUrl === "string" ? item.imageDataUrl : "",
            timestampS: typeof item.timestampS === "number" ? item.timestampS : Number.NaN,
          };
        });
        const referenceImages = Array.isArray(record.referenceImages)
          ? record.referenceImages.map((value) => typeof value === "string" ? value : "")
          : [];
        const voiceIds = Array.isArray(record.voiceIds)
          ? record.voiceIds.map((value) => typeof value === "string" ? value : "") as PresetVoice[]
          : [];
        const input = {
          mode: record.mode as GenerationMode,
          model: record.model as ClipModel,
          prompt: typeof record.prompt === "string" ? record.prompt : "",
          imageDataUrl: typeof record.imageDataUrl === "string" ? record.imageDataUrl : undefined,
          lastFrameDataUrl: typeof record.lastFrameDataUrl === "string" ? record.lastFrameDataUrl : undefined,
          referenceImages,
          keyframes,
          voiceIds,
          confirmSpend: record.confirmSpend === true,
          duration: duration as ClipDuration,
          resolution: record.resolution as ClipResolution,
          aspectRatio: record.aspectRatio as ClipAspectRatio,
          generateAudio: record.generateAudio !== false,
          idempotencyKey,
        };
        // Keep the imported voice catalog live as a guard against accidental UI/API drift.
        if (voiceIds.some((voice) => !(PRESET_VOICES as readonly string[]).includes(voice))) {
          return Response.json({ ok: false, code: "settings", error: "Choose a supported preset voice.", remaining: 0 }, { status: 400, headers: NO_STORE });
        }
        let result: StartResponse;
        try {
          result = await startClip(input, visitor);
        } catch (error) {
          console.error("[imagine] start handler failed:", error instanceof Error ? error.message : "unknown error");
          return Response.json(
            { ok: false, code: "internal", error: "The generation service encountered an internal error. Check Recent renders before retrying.", remaining: 0 },
            { status: 500, headers: NO_STORE },
          );
        }
        const status = result.ok ? 200
          : result.code === "budget" || result.code === "visitor_budget" || result.code === "rate_limit" ? 429
            : result.code === "budget_storage" || result.code === "security_config" || result.code === "job_storage" ? 503
              : result.code === "no_key" ? 503
                : result.code === "idempotency_conflict" ? 409 : 400;
        return Response.json(result, { status, headers: NO_STORE });
      },
    },
  },
});
