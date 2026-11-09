import assert from "node:assert/strict";
import test from "node:test";
import {
  CLIP_ASPECT_RATIOS, CLIP_DURATIONS, CLIP_MODELS, DEFAULT_CLIP_MODEL,
  GLOBAL_POLL_PER_SECOND, PREVIEW_CLIP_BUDGET, PREVIEW_SPEND_CAP_USD, estimateClipCost,
} from "./limits.ts";

test("exposes the documented Lite and full Imagine models and supported settings", () => {
  assert.deepEqual(CLIP_MODELS, ["grok-imagine-video-1.5-lite", "grok-imagine-video-1.5"]);
  assert.equal(DEFAULT_CLIP_MODEL, "grok-imagine-video-1.5");
  assert.deepEqual(CLIP_DURATIONS, Array.from({ length: 15 }, (_, index) => index + 1));
  assert.deepEqual(CLIP_ASPECT_RATIOS, ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "5:2"]);
});

test("calculates full-model video plus the separate per-image input charge", () => {
  assert.equal(estimateClipCost(1, "480p", "grok-imagine-video-1.5", 0), 0.08);
  assert.equal(estimateClipCost(6, "480p", "grok-imagine-video-1.5-lite", 1), 0.13);
  assert.equal(estimateClipCost(10, "720p", "grok-imagine-video-1.5-lite", 1), 0.31);
  assert.equal(estimateClipCost(15, "1080p", "grok-imagine-video-1.5-lite", 1), 2.11);
  assert.equal(estimateClipCost(10, "1080p", "grok-imagine-video-1.5", 0), 2.5);
  assert.equal(estimateClipCost(8, "720p", "grok-imagine-video-1.5", 14), 1.26);
});

test("the app-wide status poll ceiling stays below the xAI model RPS limit", () => {
  assert.equal(GLOBAL_POLL_PER_SECOND, 8);
  assert.ok(GLOBAL_POLL_PER_SECOND < 10);
});


test("Grok workspace preview allows iterative renders while preserving a tight dollar ceiling", () => {
  assert.equal(PREVIEW_CLIP_BUDGET, 5);
  assert.equal(PREVIEW_SPEND_CAP_USD, 2.5);
});
