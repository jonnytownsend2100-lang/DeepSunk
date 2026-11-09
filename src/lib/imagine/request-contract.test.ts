import assert from "node:assert/strict";
import test from "node:test";
import { buildXaiVideoPayload, imageAssetCount, validateGenerationInput } from "./request-contract.ts";
import type { GenerationInput } from "./types.ts";

const jpeg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEUlEQVR4nGP4z8DwH4RBCAwBRcwH+conGc8AAAAASUVORK5CYII=";
function base(overrides: Partial<GenerationInput> = {}): GenerationInput {
  return {
    mode: "text", model: "grok-imagine-video-1.5-lite", prompt: "A cinematic tracking shot through a rain-soaked neon alley.",
    referenceImages: [], keyframes: [], voiceIds: [], confirmSpend: true, duration: 8, resolution: "1080p",
    aspectRatio: "21:9", generateAudio: true, idempotencyKey: "00000000-0000-4000-8000-000000000000", ...overrides,
  };
}

test("text-to-video sends a pure prompt request and preserves selected settings", () => {
  const input = base();
  assert.equal(validateGenerationInput(input), null);
  const payload = buildXaiVideoPayload(input, "job_1");
  assert.equal(payload.model, "grok-imagine-video-1.5-lite");
  assert.equal(payload.prompt, input.prompt);
  assert.equal(payload.aspect_ratio, "21:9");
  assert.equal(payload.resolution, "1080p");
  assert.equal("image" in payload, false);
  assert.deepEqual(payload.storage_options, { filename: "stillwake-job_1.mp4", expires_after: 2_592_000 });
  assert.equal("public_url" in payload.storage_options, false);
});

test("image-to-video pins the source as the opening image", () => {
  const input = base({ mode: "image", imageDataUrl: jpeg });
  assert.equal(validateGenerationInput(input), null);
  assert.deepEqual(buildXaiVideoPayload(input, "job_2").image, { url: jpeg });
});

test("reference-to-video supports fourteen references and three named voices", () => {
  const refs = Array.from({ length: 14 }, () => jpeg);
  const input = base({ mode: "reference", model: "grok-imagine-video-1.5", resolution: "720p", referenceImages: refs, voiceIds: ["eve", "leo", "orion"] });
  assert.equal(validateGenerationInput(input), null);
  assert.equal(imageAssetCount(input), 14);
  const payload = buildXaiVideoPayload(input, "job_3");
  assert.equal(payload.reference_images?.length, 14);
  assert.deepEqual(payload.reference_audios, [{ voice_id: "eve" }, { voice_id: "leo" }, { voice_id: "orion" }]);
});

test("director requests combine pinned endpoints, keyframes, references and speaker voices", () => {
  const input = base({
    mode: "director", model: "grok-imagine-video-1.5", resolution: "720p", imageDataUrl: jpeg,
    lastFrameDataUrl: jpeg, referenceImages: [jpeg],
    keyframes: [{ imageDataUrl: jpeg, timestampS: 2 }, { imageDataUrl: jpeg, timestampS: 4 }], voiceIds: ["zagan"],
  });
  assert.equal(validateGenerationInput(input), null);
  const payload = buildXaiVideoPayload(input, "job_4");
  assert.deepEqual(payload.last_frame, { url: jpeg });
  assert.equal(payload.keyframes?.[0]?.timestamp_s, 2);
  assert.equal(payload.keyframes?.[1]?.timestamp_s, 4);
  assert.equal(payload.reference_images?.length, 1);
});

test("advanced controls require the full 1.5 model and no reference workflow claims 1080p", () => {
  const refs = base({ mode: "reference", referenceImages: [jpeg] });
  assert.match(validateGenerationInput(refs) ?? "", /Video 1.5/);
  const full1080 = base({ mode: "reference", model: "grok-imagine-video-1.5", referenceImages: [jpeg] });
  assert.match(validateGenerationInput(full1080) ?? "", /limited to 720p/);
});

test("keyframes must sit on unique one-third-second slots inside duration", () => {
  const offGrid = base({ mode: "director", model: "grok-imagine-video-1.5", resolution: "720p", keyframes: [{ imageDataUrl: jpeg, timestampS: 1.25 }] });
  assert.match(validateGenerationInput(offGrid) ?? "", /⅓-second/);
  const duplicate = base({ mode: "director", model: "grok-imagine-video-1.5", resolution: "720p", keyframes: [{ imageDataUrl: jpeg, timestampS: 1 }, { imageDataUrl: jpeg, timestampS: 1 }] });
  assert.match(validateGenerationInput(duplicate) ?? "", /unique timestamp/);
});

test("text-only requests require a prompt and voice-only reference jobs are allowed", () => {
  assert.match(validateGenerationInput(base({ prompt: "" })) ?? "", /creative direction/);
  const voiceOnly = base({ mode: "reference", model: "grok-imagine-video-1.5", resolution: "720p", prompt: "", voiceIds: ["eve"] });
  assert.equal(validateGenerationInput(voiceOnly), null);
  const payload = buildXaiVideoPayload(voiceOnly, "job_voice");
  assert.equal("prompt" in payload, false);
  assert.deepEqual(payload.reference_audios, [{ voice_id: "eve" }]);
  const emptyDirector = base({ mode: "director", model: "grok-imagine-video-1.5", resolution: "720p" });
  assert.match(validateGenerationInput(emptyDirector) ?? "", /Director mode needs/);
});


test("Director transport cap counts every pin, keyframe, and reference together", () => {
  const atLimit = base({
    mode: "director", model: "grok-imagine-video-1.5", resolution: "720p",
    imageDataUrl: jpeg, lastFrameDataUrl: jpeg,
    referenceImages: Array.from({ length: 8 }, () => jpeg),
    keyframes: Array.from({ length: 4 }, (_, index) => ({ imageDataUrl: jpeg, timestampS: index + 1 })),
  });
  assert.equal(imageAssetCount(atLimit), 14);
  assert.equal(validateGenerationInput(atLimit), null);
  const overLimit = { ...atLimit, referenceImages: [...atLimit.referenceImages, jpeg] };
  assert.match(validateGenerationInput(overLimit) ?? "", /total images/);
});

test("voice references are rejected when generated audio is disabled", () => {
  const input = base({ mode: "reference", model: "grok-imagine-video-1.5", resolution: "720p", voiceIds: ["eve"], generateAudio: false });
  assert.match(validateGenerationInput(input) ?? "", /Enable generated audio/);
});


test("Director with only an opening image stays on the ordinary image-to-video path", () => {
  const input = base({ mode: "director", model: "grok-imagine-video-1.5-lite", resolution: "1080p", imageDataUrl: jpeg });
  assert.equal(validateGenerationInput(input), null);
  assert.deepEqual(buildXaiVideoPayload(input, "job_director_opening").image, { url: jpeg });
});
