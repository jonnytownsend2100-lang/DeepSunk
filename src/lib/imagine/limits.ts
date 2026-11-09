/** Official Grok Imagine Video model catalog and conservative spend guard. */
export const CLIP_MODELS = [
  "grok-imagine-video-1.5-lite",
  "grok-imagine-video-1.5",
] as const;
export type ClipModel = (typeof CLIP_MODELS)[number];
export const DEFAULT_CLIP_MODEL: ClipModel = "grok-imagine-video-1.5";
export const GENERATION_MODES = ["text", "image", "reference", "director"] as const;
export type GenerationMode = (typeof GENERATION_MODES)[number];

export const CLIP_DURATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;
export type ClipDuration = (typeof CLIP_DURATIONS)[number];

export const CLIP_RESOLUTIONS = ["480p", "720p", "1080p"] as const;
export type ClipResolution = (typeof CLIP_RESOLUTIONS)[number];

export const CLIP_ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "5:2"] as const;
export type ClipAspectRatio = (typeof CLIP_ASPECT_RATIOS)[number];

export const DEFAULT_CLIP_DURATION: ClipDuration = 8;
export const DEFAULT_CLIP_RESOLUTION: ClipResolution = "1080p";
export const DEFAULT_CLIP_ASPECT_RATIO: ClipAspectRatio = "16:9";

export const IMAGE_INPUT_USD = 0.01;
export const VIDEO_USD_PER_SECOND: Record<ClipModel, Record<ClipResolution, number>> = {
  "grok-imagine-video-1.5-lite": { "480p": 0.02, "720p": 0.03, "1080p": 0.14 },
  "grok-imagine-video-1.5": { "480p": 0.08, "720p": 0.14, "1080p": 0.25 },
};

/** Preset xAI TTS voices accepted by reference-to-video. */
export const PRESET_VOICES = [
  "carina", "zagan", "helix", "orion", "luna", "iris", "altair", "zenith", "perseus",
  "helios", "lux", "kepler", "rigel", "cosmo", "celeste", "ursa", "sirius", "lumen",
  "castor", "naksh", "atlas", "aurora", "liora", "ara", "eve", "leo", "rex", "sal",
] as const;
export type PresetVoice = (typeof PRESET_VOICES)[number];

export const MAX_REFERENCE_IMAGES = 14;
export const MAX_KEYFRAMES = 4;
/** Hard transport cap: image references + pinned frames together. */
export const MAX_TOTAL_IMAGE_ASSETS = 14;
export const PREVIEW_CLIP_BUDGET = 5;
export const LIVE_CLIP_BUDGET = 50;
export const VISITOR_CLIP_BUDGET = 5;
export const IP_HOURLY_CLIP_BUDGET = 8;
export const IP_DAILY_CLIP_BUDGET = 15;
export const VISITOR_POLL_PER_MINUTE = 120;
export const GLOBAL_POLL_PER_SECOND = 8;
export const DAILY_SPEND_CAP_USD = 25;
export const PREVIEW_SPEND_CAP_USD = 2.50;

export const MAX_PROMPT = 1_200;
/** Per-image ceiling chosen so 14 optimized images fit a serverless JSON request. */
export const MAX_IMAGE_CHARS = 285_000;
export const MAX_REQUEST_BODY_BYTES = 4_200_000;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function estimateClipCost(
  duration: ClipDuration,
  resolution: ClipResolution,
  model: ClipModel = DEFAULT_CLIP_MODEL,
  imageInputCount = 0,
): number {
  const imageCount = Math.max(0, Math.min(MAX_TOTAL_IMAGE_ASSETS, Math.floor(imageInputCount)));
  return Number((imageCount * IMAGE_INPUT_USD + duration * VIDEO_USD_PER_SECOND[model][resolution]).toFixed(2));
}
