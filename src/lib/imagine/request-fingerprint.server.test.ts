import assert from "node:assert/strict";
import test from "node:test";
import { fingerprintGenerationIntent } from "./request-fingerprint.server.ts";

const intent = {
  mode: "image" as const,
  model: "grok-imagine-video-1.5-lite" as const,
  prompt: "A slow cinematic push-in.",
  imageDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEUlEQVR4nGP4z8DwH4RBCAwBRcwH+conGc8AAAAASUVORK5CYII=",
  referenceImages: [] as string[],
  keyframes: [] as { imageDataUrl: string; timestampS: number }[],
  voiceIds: [] as ("eve")[],
  confirmSpend: true,
  duration: 6 as const,
  resolution: "480p" as const,
  aspectRatio: "16:9" as const,
  generateAudio: true,
  idempotencyKey: "00000000-0000-4000-8000-000000000000",
};

test("generation intent fingerprints are stable", () => {
  assert.equal(fingerprintGenerationIntent(intent), fingerprintGenerationIntent({ ...intent }));
});

test("any paid-input change creates a distinct fingerprint", () => {
  const patches = [
    { mode: "text" as const }, { model: "grok-imagine-video-1.5" as const },
    { prompt: "A fast dolly-in." }, { imageDataUrl: `${intent.imageDataUrl}A` },
    { duration: 10 as const }, { resolution: "720p" as const },
    { aspectRatio: "9:16" as const }, { generateAudio: false },
    { voiceIds: ["eve"] as ("eve")[] },
    { referenceImages: [intent.imageDataUrl] },
    { keyframes: [{ imageDataUrl: intent.imageDataUrl, timestampS: 2 }] },
  ];
  for (const patch of patches) {
    assert.notEqual(fingerprintGenerationIntent({ ...intent, ...patch }), fingerprintGenerationIntent(intent));
  }
});
