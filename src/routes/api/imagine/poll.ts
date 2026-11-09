import { createFileRoute } from "@tanstack/react-router";
import { pollClip } from "@/lib/imagine/video.server";
import { getVisitorFromRequest } from "@/lib/imagine/visitor.server";

const NO_STORE = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "Pragma": "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};
const MAX_BODY_BYTES = 1_024;

async function readToken(request: Request): Promise<string | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        return null;
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
  try {
    const body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    const token = (body as Record<string, unknown>).token;
    return typeof token === "string" && token.length <= 256 ? token : null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/imagine/poll")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        const site = request.headers.get("sec-fetch-site");
        if (!origin || site === "cross-site") {
          return Response.json({ ok: false, code: "origin", error: "A same-origin browser request is required." }, { status: 403, headers: NO_STORE });
        }
        try {
          if (new URL(origin).origin !== new URL(request.url).origin) {
            return Response.json({ ok: false, code: "origin", error: "Request origin rejected." }, { status: 403, headers: NO_STORE });
          }
        } catch {
          return Response.json({ ok: false, code: "origin", error: "Request origin rejected." }, { status: 403, headers: NO_STORE });
        }
        if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
          return Response.json({ ok: false, code: "content_type", error: "Use application/json." }, { status: 415, headers: NO_STORE });
        }
        const visitor = getVisitorFromRequest(request, false);
        if (!visitor) {
          return Response.json({ ok: false, code: "visitor", error: "Your visitor session is missing or expired. Reload the studio." }, { status: 401, headers: NO_STORE });
        }
        const token = await readToken(request);
        if (!token) {
          return Response.json({ ok: false, code: "body", error: "A valid job token is required." }, { status: 400, headers: NO_STORE });
        }
        try {
          const result = await pollClip(token, visitor);
          const status = result.ok ? 200 : result.code === "network" || result.code === "upstream" ? 502 : result.code === "rate_limit" ? 429 : 400;
          return Response.json(result, { status, headers: NO_STORE });
        } catch (error) {
          console.error("[imagine] poll handler failed:", error instanceof Error ? error.message : "unknown error");
          return Response.json({ ok: false, code: "internal", error: "The render status service encountered an internal error. Retry the status check." }, { status: 500, headers: NO_STORE });
        }
      },
    },
  },
});
