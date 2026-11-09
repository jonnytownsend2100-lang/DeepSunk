import { createFileRoute } from "@tanstack/react-router";
import { imagineStatus } from "@/lib/imagine/video.server";
import { getVisitorFromRequest } from "@/lib/imagine/visitor.server";

const HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};

export const Route = createFileRoute("/api/imagine/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const site = request.headers.get("sec-fetch-site");
        if (site === "cross-site") {
          return Response.json({ error: "Cross-site request rejected." }, { status: 403, headers: HEADERS });
        }
        const visitor = getVisitorFromRequest(request, true);
        const status = await imagineStatus(visitor);
        const headers = new Headers(HEADERS);
        if (visitor?.setCookie) headers.append("Set-Cookie", visitor.setCookie);
        return Response.json(status, { headers });
      },
    },
  },
});
