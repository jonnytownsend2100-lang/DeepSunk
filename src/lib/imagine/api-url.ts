import { previewPathPrefix } from "@/lib/preview-path-prefix";

/** Keep fetches on the path-based preview prefix when the host uses one. */
export function apiUrl(path: string): string {
  if (typeof window === "undefined") return path;
  const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
  return prefix ? `${prefix}${path}` : path;
}
