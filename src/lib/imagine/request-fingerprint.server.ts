import { createHash } from "node:crypto";
import type { GenerationInput } from "./types";

/** Bind an idempotency key to every paid model setting and every source asset. */
export function fingerprintGenerationIntent(intent: GenerationInput): string {
  const digest = createHash("sha256");
  const stable = {
    mode: intent.mode,
    model: intent.model,
    prompt: intent.prompt,
    duration: intent.duration,
    resolution: intent.resolution,
    aspectRatio: intent.aspectRatio,
    generateAudio: intent.generateAudio,
    voiceIds: intent.voiceIds,
    keyframeTimestamps: intent.keyframes.map((frame) => frame.timestampS),
  };
  digest.update(JSON.stringify(stable));
  for (const asset of [intent.imageDataUrl ?? "", intent.lastFrameDataUrl ?? "", ...intent.referenceImages, ...intent.keyframes.map((frame) => frame.imageDataUrl)]) {
    digest.update("\0");
    digest.update(createHash("sha256").update(asset).digest());
  }
  return digest.digest("hex");
}
