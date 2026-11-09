/** Server-side anonymous visitor identity for the public, no-account workspace.
 *
 * The cookie is random, HttpOnly, SameSite=Lax and HMAC-signed. Only a keyed
 * digest is persisted, so database rows cannot be correlated with the cookie
 * value. Production must set STILLWAKE_SESSION_SECRET (32+ characters).
 */
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { isWorkspacePreview } from "../env.server.ts";

const COOKIE_BASE = "stillwake_visitor";
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;
const globalRef = globalThis as typeof globalThis & {
  __stillwakePreviewSecret__?: Buffer;
};

export type VisitorContext = {
  ownerHash: string;
  ipHash: string | null;
  setCookie?: string;
};

export function getSecuritySecret(): Buffer | null {
  const configured = process.env.STILLWAKE_SESSION_SECRET?.trim();
  if (configured && Buffer.byteLength(configured, "utf8") >= 32) {
    return Buffer.from(configured, "utf8");
  }
  if (!isWorkspacePreview()) return null;
  // Stable across HMR and the lifetime of one preview process; deliberately
  // rotates on process restart. Production never uses this volatile fallback.
  globalRef.__stillwakePreviewSecret__ ??= randomBytes(32);
  return globalRef.__stillwakePreviewSecret__;
}

function mac(secret: Buffer, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseCookies(header: string | null): Map<string, string> {
  const result = new Map<string, string>();
  for (const part of (header ?? "").split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name && value) result.set(name, value);
  }
  return result;
}

function cookieName(secure: boolean): string {
  return secure ? `__Host-${COOKIE_BASE}` : COOKIE_BASE;
}

function makeCookie(id: string, expiresAt: number, secret: Buffer, secure: boolean): string {
  const payload = `${id}.${expiresAt}`;
  const value = `${payload}.${mac(secret, `visitor:${payload}`)}`;
  const attributes = [
    `${cookieName(secure)}=${value}`,
    "Path=/",
    `Max-Age=${COOKIE_TTL_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

export function getVisitorFromRequest(
  request: Request,
  createIfMissing = false,
): VisitorContext | null {
  const secret = getSecuritySecret();
  if (!secret) return null;
  const secure = new URL(request.url).protocol === "https:";
  const cookies = parseCookies(request.headers.get("cookie"));
  // Do not accept the non-__Host cookie on HTTPS: that would weaken the
  // host-only cookie boundary and re-enable subdomain cookie injection.
  const names = [cookieName(secure)];

  for (const name of names) {
    const token = cookies.get(name);
    if (!token) continue;
    const parts = token.split(".");
    if (parts.length !== 3) continue;
    const [id, expiresText, signature] = parts;
    if (!/^[A-Za-z0-9_-]{32,64}$/.test(id)) continue;
    if (!/^\d{10}$/.test(expiresText)) continue;
    const expiresAt = Number(expiresText);
    if (!Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) continue;
    const payload = `${id}.${expiresAt}`;
    if (!/^[A-Za-z0-9_-]{40,64}$/.test(signature)) continue;
    if (!safeEqual(signature, mac(secret, `visitor:${payload}`))) continue;

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    // Vercel overwrites x-forwarded-for with the connecting client IP. Do not
    // trust this field on arbitrary non-Vercel deployments.
    const trustedIp = process.env.VERCEL === "1" && request.headers.get("x-vercel-id") && forwardedFor ? forwardedFor : null;
    return {
      ownerHash: mac(secret, `owner:${id}`),
      ipHash: trustedIp ? mac(secret, `ip:${trustedIp}`) : null,
    };
  }

  if (!createIfMissing) return null;
  const id = randomBytes(32).toString("base64url");
  const expiresAt = Math.floor(Date.now() / 1000) + COOKIE_TTL_SECONDS;
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const trustedIp = process.env.VERCEL === "1" && request.headers.get("x-vercel-id") && forwardedFor ? forwardedFor : null;
  return {
    ownerHash: mac(secret, `owner:${id}`),
    ipHash: trustedIp ? mac(secret, `ip:${trustedIp}`) : null,
    setCookie: makeCookie(id, expiresAt, secret, secure),
  };
}

export function issueJobToken(jobId: string, ownerHash: string): string {
  const secret = getSecuritySecret();
  if (!secret) throw new Error("The visitor signing secret is not configured.");
  const expiresAt = Math.floor(Date.now() / 1000) + COOKIE_TTL_SECONDS;
  const payload = `${jobId}.${expiresAt}.${ownerHash}`;
  return `${jobId}.${expiresAt}.${mac(secret, `job:${payload}`)}`;
}

export function verifyJobToken(token: string, ownerHash: string): string | null {
  const secret = getSecuritySecret();
  if (!secret || token.length > 256) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [jobId, expiresText, signature] = parts;
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return null;
  if (!/^\d{10}$/.test(expiresText)) return null;
  const expiresAt = Number(expiresText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;
  const payload = `${jobId}.${expiresAt}.${ownerHash}`;
  if (!safeEqual(signature, mac(secret, `job:${payload}`))) return null;
  return jobId;
}

function encryptionKey(secret: Buffer): Buffer {
  return createHash("sha256").update("stillwake-prompt-encryption:").update(secret).digest();
}

/** Encrypt persisted prompts so database exports do not contain user text. */
export function encryptPrompt(prompt: string): string {
  const secret = getSecuritySecret();
  if (!secret) throw new Error("The visitor signing secret is not configured.");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), nonce);
  const encrypted = Buffer.concat([cipher.update(prompt, "utf8"), cipher.final()]);
  return Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString("base64url");
}

export function decryptPrompt(value: string): string {
  const secret = getSecuritySecret();
  if (!secret) return "";
  try {
    const packed = Buffer.from(value, "base64url");
    if (packed.length < 29) return "";
    const nonce = packed.subarray(0, 12);
    const tag = packed.subarray(12, 28);
    const encrypted = packed.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), nonce);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}
