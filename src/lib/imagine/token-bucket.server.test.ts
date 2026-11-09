import test from "node:test";
import assert from "node:assert/strict";
import { refillTokenBucket, type TokenBucketSql } from "./token-bucket.server.ts";

test("token bucket refills continuously instead of resetting at wall-clock boundaries", () => {
  assert.equal(refillTokenBucket(0, 0.125, 4, 8), 1);
  assert.equal(refillTokenBucket(2, 0.125, 4, 8), 3);
});

test("token bucket refill is capped at capacity", () => {
  assert.equal(refillTokenBucket(3.5, 10, 4, 8), 4);
});

test("token bucket rejects invalid state", () => {
  assert.throws(() => refillTokenBucket(-1, 1, 4, 8), /Invalid token bucket state/);
  assert.throws(() => refillTokenBucket(1, -1, 4, 8), /Invalid token bucket state/);
});

test("atomic token bucket uses one parameterized UPSERT and admits an available token", async () => {
  const { consumeTokenBucket } = await import("./token-bucket.server.ts");
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const sql = {
    query: async (text: string, params: unknown[] = []) => {
      calls.push({ sql: text, params });
      return [{ tokens: 2 }];
    },
  };
  assert.equal(await consumeTokenBucket(sql as TokenBucketSql, { key: "global", capacity: 4, refillPerSecond: 8 }), true);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /ON CONFLICT \(bucket_key\)/);
  assert.match(calls[0].sql, /EXTRACT\(EPOCH FROM/);
  assert.deepEqual(calls[0].params, ["global", 4, 8, 1]);
});

test("atomic token bucket denies when the SQL predicate returns no row", async () => {
  const { consumeTokenBucket } = await import("./token-bucket.server.ts");
  const sql = { query: async () => [] as Array<{ tokens: number }> };
  assert.equal(await consumeTokenBucket(sql as TokenBucketSql, { key: "global", capacity: 4, refillPerSecond: 8 }), false);
});

test("atomic token bucket rejects invalid configurations before touching storage", async () => {
  const { consumeTokenBucket } = await import("./token-bucket.server.ts");
  let called = false;
  const sql = { query: async () => { called = true; return []; } };
  await assert.rejects(() => consumeTokenBucket(sql, { key: "", capacity: 4, refillPerSecond: 8 }), /Invalid token bucket/);
  await assert.rejects(() => consumeTokenBucket(sql, { key: "x", capacity: 2, refillPerSecond: 0 }), /Invalid token bucket/);
  assert.equal(called, false);
});


test("the global Imagine poll bucket is configured below the provider ceiling", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const source = readFileSync(resolve(root, "src/lib/imagine/video.server.ts"), "utf8");
  assert.match(source, /key: "stillwake:global-poll", capacity: 1, refillPerSecond: GLOBAL_POLL_PER_SECOND/);
});
