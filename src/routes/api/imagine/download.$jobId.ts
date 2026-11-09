import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { isWorkspacePreview } from "@/lib/env.server";
import { DEV_STANDIN_FILE_ID } from "@/lib/imagine/billing";
import { consumeTokenBucket } from "@/lib/imagine/token-bucket.server";
import { CONTENT_RANGE, limitStream, MAX_VIDEO_BYTES, SINGLE_BYTE_RANGE } from "@/lib/imagine/media-stream.server";
import { getVisitorFromRequest } from "@/lib/imagine/visitor.server";

const HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Frame-Options": "DENY",
  "X-Download-Options": "noopen",
  Vary: "Cookie",
};
const XAI_FILES = "https://api.x.ai/v1/files";
const UPSTREAM_HEADERS_TIMEOUT_MS = 20_000;

async function standinBytes(): Promise<Uint8Array> {
  const { DEV_STANDIN_MP4_BASE64 } = await import("@/lib/imagine/dev-standin");
  return Buffer.from(DEV_STANDIN_MP4_BASE64, "base64");
}

async function standinResponse(request: Request, jobId: string): Promise<Response> {
  const bytes = await standinBytes();
  const headers = new Headers(HEADERS);
  headers.set("Content-Type", "video/mp4");
  headers.set("Content-Disposition", `inline; filename="stillwake-dev-${jobId}.mp4"`);
  headers.set("Accept-Ranges", "bytes");
  const range = request.headers.get("range");
  if (range && SINGLE_BYTE_RANGE.test(range)) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const size = bytes.byteLength;
    let start = match?.[1] ? Number(match[1]) : 0;
    let end = match?.[2] ? Number(match[2]) : size - 1;
    if (!match?.[1] && match?.[2]) {
      start = Math.max(0, size - Number(match[2]));
      end = size - 1;
    }
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { ...Object.fromEntries(headers), "Content-Range": `bytes */${size}` } });
    }
    end = Math.min(end, size - 1);
    const slice = bytes.subarray(start, end + 1);
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(slice.byteLength));
    return new Response(responseBody(slice), { status: 206, headers });
  }
  headers.set("Content-Length", String(bytes.byteLength));
  return new Response(responseBody(bytes), { status: 200, headers });
}

function responseBody(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: HEADERS });
}

export const Route = createFileRoute("/api/imagine/download/$jobId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (request.headers.get("sec-fetch-site") === "cross-site") {
          return jsonError("Cross-site downloads are not allowed.", 403);
        }
        const visitor = getVisitorFromRequest(request, false);
        if (!visitor) return jsonError("Your visitor session is missing or expired.", 401);

        const jobId = params.jobId;
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) {
          return jsonError("Invalid render reference.", 400);
        }

        const sql = await getSql().catch(() => null);
        if (!sql) return jsonError("The render database is temporarily unavailable.", 503);

        let rows: Array<{ status: string; xai_file_id: string | null }>;
        try {
          rows = await sql.query<{ status: string; xai_file_id: string | null }>(
            "SELECT status, xai_file_id FROM imagine_jobs WHERE id = $1 AND visitor_hash = $2 LIMIT 1",
            [jobId, visitor.ownerHash],
          );
        } catch {
          return jsonError("The render database is temporarily unavailable.", 503);
        }
        const job = rows[0];
        if (!job) return jsonError("Render not found for this visitor.", 404);
        if (job.status !== "done" || !job.xai_file_id) {
          return jsonError("This render has no privately stored video file yet.", 409);
        }
        if (!/^file_[A-Za-z0-9_-]{8,128}$/.test(job.xai_file_id)) {
          return jsonError("The stored video reference is invalid.", 502);
        }

        let downloadAllowed: boolean;
        try {
          downloadAllowed = await consumeTokenBucket(sql, {
            key: `download:${visitor.ownerHash}`,
            capacity: 120,
            refillPerSecond: 2,
          });
        } catch {
          return jsonError("Download protection is temporarily unavailable.", 503);
        }
        if (!downloadAllowed) return jsonError("Too many downloads. Please slow down.", 429);

        if (job.xai_file_id === DEV_STANDIN_FILE_ID) return await standinResponse(request, jobId);
        if (isWorkspacePreview()) {
          return jsonError("Development mode does not retrieve billed xAI files.", 409);
        }
        const apiKey = process.env.XAI_API_KEY?.trim();
        if (!apiKey) return jsonError("Video downloads are temporarily unavailable.", 503);

        const headers = new Headers({ Authorization: `Bearer ${apiKey}` });
        const range = request.headers.get("range");
        if (range && SINGLE_BYTE_RANGE.test(range)) headers.set("Range", range);

        let upstream: Response;
        const upstreamController = new AbortController();
        const headerTimer = setTimeout(() => upstreamController.abort(), UPSTREAM_HEADERS_TIMEOUT_MS);
        try {
          upstream = await fetch(`${XAI_FILES}/${encodeURIComponent(job.xai_file_id)}/content`, {
            headers,
            signal: upstreamController.signal,
          });
        } catch {
          return jsonError("Could not retrieve the stored video from xAI. Try again.", 502);
        } finally {
          // Once headers arrive, do not impose a total-download deadline. The
          // bounded stream enforces a per-chunk idle timeout instead.
          clearTimeout(headerTimer);
        }

        if (upstream.status === 416) {
          await upstream.body?.cancel().catch(() => undefined);
          return jsonError("The requested video byte range is invalid.", 416);
        }
        if (!upstream.ok || !upstream.body) {
          const status = upstream.status === 404 ? 410 : 502;
          return jsonError(status === 410 ? "The stored video is no longer available from xAI." : "The video provider could not retrieve this file.", status);
        }
        const upstreamType = (upstream.headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase();
        if (upstreamType && upstreamType !== "video/mp4" && upstreamType !== "application/octet-stream" && upstreamType !== "binary/octet-stream") {
          await upstream.body.cancel().catch(() => undefined);
          return jsonError("The provider returned an unexpected file type.", 502);
        }

        const contentLength = Number(upstream.headers.get("content-length") ?? 0);
        if (contentLength > MAX_VIDEO_BYTES) {
          await upstream.body.cancel().catch(() => undefined);
          return jsonError("The stored video exceeds the download safety limit.", 502);
        }

        const upstreamRange = upstream.headers.get("content-range");
        if (upstream.status === 206 && (!upstreamRange || !CONTENT_RANGE.test(upstreamRange))) {
          await upstream.body.cancel().catch(() => undefined);
          return jsonError("The video provider returned an invalid partial-content response.", 502);
        }

        const responseHeaders = new Headers(HEADERS);
        responseHeaders.set("Content-Type", "video/mp4");
        responseHeaders.set("Content-Disposition", `inline; filename="stillwake-${jobId}.mp4"`);
        responseHeaders.set("Accept-Ranges", upstream.status === 206 || upstream.headers.get("accept-ranges") === "bytes" ? "bytes" : "none");
        if (upstreamRange) responseHeaders.set("Content-Range", upstreamRange);
        const upstreamLength = upstream.headers.get("content-length");
        if (upstreamLength && /^\d+$/.test(upstreamLength) && Number(upstreamLength) <= MAX_VIDEO_BYTES) {
          responseHeaders.set("Content-Length", upstreamLength);
        }
        return new Response(limitStream(upstream.body, MAX_VIDEO_BYTES), {
          status: upstream.status === 206 ? 206 : 200,
          headers: responseHeaders,
        });
      },
    },
  },
});
