import {
  CLIP_ASPECT_RATIOS, CLIP_DURATIONS, CLIP_MODELS, CLIP_RESOLUTIONS, GENERATION_MODES,
  MAX_IMAGE_CHARS, MAX_KEYFRAMES, MAX_PROMPT, MAX_REFERENCE_IMAGES, MAX_TOTAL_IMAGE_ASSETS,
  PRESET_VOICES,
} from "./limits.ts";
import { validImageDataUrl } from "./image-validation.server.ts";
import type { GenerationInput } from "./types.ts";

export type XaiVideoPayload = {
  model: string;
  prompt?: string;
  duration: number;
  aspect_ratio: string;
  resolution: string;
  generate_audio: boolean;
  storage_options: { filename: string; expires_after: number };
  image?: { url: string };
  last_frame?: { url: string };
  reference_images?: Array<{ url: string }>;
  keyframes?: Array<{ image: { url: string }; timestamp_s: number }>;
  reference_audios?: Array<{ voice_id: string }>;
};

export function imageAssetCount(input: Pick<GenerationInput, "imageDataUrl" | "lastFrameDataUrl" | "referenceImages" | "keyframes">): number {
  return Number(Boolean(input.imageDataUrl)) + Number(Boolean(input.lastFrameDataUrl))
    + input.referenceImages.length + input.keyframes.length;
}

export function validateGenerationInput(input: GenerationInput): string | null {
  if (!(GENERATION_MODES as readonly string[]).includes(input.mode)) return "Choose a valid generation mode.";
  if (!(CLIP_MODELS as readonly string[]).includes(input.model)) return "Choose a valid Grok Imagine model.";
  if (!(CLIP_DURATIONS as readonly number[]).includes(input.duration)) return "Choose a duration from 1 to 15 seconds.";
  if (!(CLIP_RESOLUTIONS as readonly string[]).includes(input.resolution)) return "Choose a supported resolution.";
  if (!(CLIP_ASPECT_RATIOS as readonly string[]).includes(input.aspectRatio)) return "Choose a supported aspect ratio.";
  if (typeof input.generateAudio !== "boolean") return "Audio must be enabled or disabled.";
  if (typeof input.confirmSpend !== "boolean") return "Confirm the estimated charge before generating.";
  if (input.prompt.length > MAX_PROMPT) return `Keep the creative direction under ${MAX_PROMPT} characters.`;
  if (input.prompt.length < 3 && imageAssetCount(input) === 0 && input.voiceIds.length === 0) return "A creative direction is required unless visual or voice references are supplied.";
  if (input.referenceImages.length > MAX_REFERENCE_IMAGES) return `Use up to ${MAX_REFERENCE_IMAGES} reference images.`;
  if (input.keyframes.length > MAX_KEYFRAMES) return `Use up to ${MAX_KEYFRAMES} middle keyframes.`;
  if (input.voiceIds.length > 3) return "Use up to three voice references.";
  if (input.voiceIds.some((voice) => !(PRESET_VOICES as readonly string[]).includes(voice))) return "Choose a supported preset voice.";

  const count = imageAssetCount(input);
  if (count > MAX_TOTAL_IMAGE_ASSETS) return `Use up to ${MAX_TOTAL_IMAGE_ASSETS} total images across references and pinned frames.`;
  const images = [input.imageDataUrl, input.lastFrameDataUrl, ...input.referenceImages, ...input.keyframes.map((item) => item.imageDataUrl)].filter(Boolean) as string[];
  if (images.some((image) => !validImageDataUrl(image, MAX_IMAGE_CHARS))) return "One or more images are invalid or too large. Re-add the affected image.";

  // Director with only one opening image is ordinary image-to-video; only
  // additional pins/references/voices require the advanced 720p-only path.
  const advanced = input.mode === "reference" || input.referenceImages.length > 0
    || input.lastFrameDataUrl !== undefined || input.keyframes.length > 0
    || input.voiceIds.length > 0;
  if (advanced && input.model !== "grok-imagine-video-1.5") return "Reference direction, voices, and pinned frames require Grok Imagine Video 1.5.";
  if (input.voiceIds.length > 0 && !input.generateAudio) return "Enable generated audio to use preset speaker references.";
  if (input.mode === "text" && (count > 0 || input.voiceIds.length > 0)) return "Text-to-video cannot include image or speaker references. Switch to Reference or Director mode.";
  if (input.mode === "image" && (!input.imageDataUrl || input.lastFrameDataUrl || input.referenceImages.length || input.keyframes.length || input.voiceIds.length)) return "Image-to-video needs exactly one opening image. Use Director mode for additional references or frames.";
  if (input.mode === "reference" && (input.imageDataUrl || input.lastFrameDataUrl || input.keyframes.length)) return "Reference mode accepts a visual reference board and speaker voices. Use Director mode for pinned frames.";
  if (input.mode === "reference" && !input.referenceImages.length && !input.voiceIds.length) return "Add at least one visual reference or speaker voice.";
  if (input.mode === "director" && count === 0 && input.voiceIds.length === 0) return "Director mode needs a first frame, last frame, keyframe, visual reference, or voice.";
  if (input.referenceImages.length && input.model !== "grok-imagine-video-1.5") return "Reference images require the full 1.5 model.";
  if (advanced && input.resolution === "1080p") return "Reference-guided generation is limited to 720p. Choose 720p or switch to Text/Image mode for native 1080p.";

  const slots = new Set<number>();
  for (const frame of input.keyframes) {
    const slot = Math.round(frame.timestampS * 3);
    if (!Number.isFinite(frame.timestampS) || slot <= 0 || frame.timestampS >= input.duration || Math.abs(frame.timestampS * 3 - slot) > 1e-5) {
      return "Keyframe times must fall inside the clip on Grok's ⅓-second timing grid.";
    }
    if (slots.has(slot)) return "Each keyframe needs a unique timestamp at least ⅓ second apart.";
    slots.add(slot);
  }
  if (!input.confirmSpend) return "Confirm the estimated charge before generating.";
  return null;
}

export function buildXaiVideoPayload(input: GenerationInput, jobId: string): XaiVideoPayload {
  const payload: XaiVideoPayload = {
    model: input.model,
    duration: input.duration,
    aspect_ratio: input.aspectRatio,
    resolution: input.resolution,
    generate_audio: input.generateAudio,
    storage_options: { filename: `stillwake-${jobId}.mp4`, expires_after: 2_592_000 },
  };
  if (input.prompt.trim()) payload.prompt = input.prompt.trim();
  if (input.imageDataUrl) payload.image = { url: input.imageDataUrl };
  if (input.lastFrameDataUrl) payload.last_frame = { url: input.lastFrameDataUrl };
  if (input.referenceImages.length) payload.reference_images = input.referenceImages.map((url) => ({ url }));
  if (input.keyframes.length) payload.keyframes = input.keyframes.map((frame) => ({ image: { url: frame.imageDataUrl }, timestamp_s: frame.timestampS }));
  if (input.voiceIds.length) payload.reference_audios = input.voiceIds.map((voice_id) => ({ voice_id }));
  return payload;
}
