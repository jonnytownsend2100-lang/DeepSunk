import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

process.env.GROK_PROJECT_ID = "test-production-project";
process.env.STILLWAKE_SESSION_SECRET = "test-secret-with-more-than-thirty-two-bytes-entropy";
process.env.VERCEL = "1";

const {
  decryptPrompt,
  encryptPrompt,
  getVisitorFromRequest,
  issueJobToken,
  verifyJobToken,
} = await import("./visitor.server.ts");

const url = "https://studio.example.test/api/imagine/status";

test("issues a Secure HttpOnly host-only visitor cookie and restores the same owner", () => {
  const first = getVisitorFromRequest(new Request(url), true);
  assert.ok(first);
  assert.ok(first.setCookie);
  assert.match(first.setCookie, /^__Host-stillwake_visitor=/);
  assert.match(first.setCookie, /HttpOnly/);
  assert.match(first.setCookie, /Secure/);
  assert.match(first.setCookie, /SameSite=Lax/);
  assert.match(first.setCookie, /Path=\//);
  const cookieValue = first.setCookie.split(";")[0].split("=")[1];
  const cookieParts = cookieValue.split(".");
  assert.equal(cookieParts.length, 3);
  assert.ok(Number(cookieParts[1]) > Math.floor(Date.now() / 1000));

  const cookie = first.setCookie.split(";")[0];
  const second = getVisitorFromRequest(new Request(url, {
    headers: {
      cookie,
      "x-forwarded-for": "203.0.113.10",
      "x-vercel-id": "cle1::example",
    },
  }), false);
  assert.ok(second);
  assert.equal(second.ownerHash, first.ownerHash);
  assert.ok(second.ipHash);
  assert.equal(second.setCookie, undefined);
  const untrusted = getVisitorFromRequest(new Request(url, {
    headers: { cookie, "x-forwarded-for": "203.0.113.10", "x-vercel-id": "cle1::example" },
  }), false);
  assert.ok(untrusted?.ipHash);
  const priorVercel = process.env.VERCEL;
  process.env.VERCEL = "0";
  try {
    const untrustedHeaders = getVisitorFromRequest(new Request(url, {
      headers: { cookie, "x-forwarded-for": "203.0.113.10", "x-vercel-id": "forged::example" },
    }), false);
    assert.equal(untrustedHeaders?.ipHash, null);
  } finally {
    if (priorVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = priorVercel;
  }
});

test("rejects tampered and missing visitor cookies", () => {
  assert.equal(getVisitorFromRequest(new Request(url), false), null);
  const first = getVisitorFromRequest(new Request(url), true);
  assert.ok(first?.setCookie);
  const pair = first.setCookie.split(";")[0];
  const [name, value] = pair.split("=");
  const tampered = `${name}=${value.slice(0, -1)}x`;
  assert.equal(getVisitorFromRequest(new Request(url, { headers: { cookie: tampered } }), false), null);

  const [id] = value.split(".");
  const expiredAt = String(Math.floor(Date.now() / 1000) - 1);
  const expiredPayload = `${id}.${expiredAt}`;
  const expiredSignature = createHmac("sha256", Buffer.from(process.env.STILLWAKE_SESSION_SECRET!))
    .update(`visitor:${expiredPayload}`).digest("base64url");
  const expiredCookie = `${name}=${expiredPayload}.${expiredSignature}`;
  assert.equal(getVisitorFromRequest(new Request(url, { headers: { cookie: expiredCookie } }), false), null);
});

test("job tokens are expiring and cryptographically bound to one visitor", () => {
  const owner = "owner-digest-1";
  const token = issueJobToken("7f1c4bd4-9b21-4e6b-9e3c-7bf781fda3d2", owner);
  assert.equal(verifyJobToken(token, owner), "7f1c4bd4-9b21-4e6b-9e3c-7bf781fda3d2");
  assert.equal(verifyJobToken(token, "another-owner"), null);
  assert.equal(verifyJobToken(`${token}tampered`, owner), null);
  assert.equal(verifyJobToken("not-a-token", owner), null);
});

test("prompt data is authenticated and encrypted at rest", () => {
  const prompt = "Slow cinematic push-in; leaves move in a soft breeze.";
  const encrypted = encryptPrompt(prompt);
  assert.notEqual(encrypted, prompt);
  assert.equal(decryptPrompt(encrypted), prompt);
  const tampered = `${encrypted[0] === "A" ? "B" : "A"}${encrypted.slice(1)}`;
  assert.equal(decryptPrompt(tampered), "");
});
