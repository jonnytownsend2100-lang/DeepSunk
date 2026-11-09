import type {
  ClipAspectRatio, ClipDuration, ClipModel, ClipResolution, GenerationMode, PresetVoice,
} from "@/lib/imagine/limits";

export type ImagineJobStatus = "submitting" | "submission_unknown" | "pending" | "done" | "failed" | "expired";

export type KeyframeInput = { imageDataUrl: string; timestampS: number };

export type GenerationInput = {
  mode: GenerationMode;
  model: ClipModel;
  prompt: string;
  imageDataUrl?: string;
  lastFrameDataUrl?: string;
  referenceImages: string[];
  keyframes: KeyframeInput[];
  voiceIds: PresetVoice[];
  confirmSpend: boolean;
  duration: ClipDuration;
  resolution: ClipResolution;
  aspectRatio: ClipAspectRatio;
  generateAudio: boolean;
  idempotencyKey: string;
};

export type ImagineJobSummary = {
  id: string;
  token: string;
  status: ImagineJobStatus;
  prompt: string;
  model: ClipModel;
  mode: GenerationMode;
  settings: { duration: ClipDuration; resolution: ClipResolution; aspectRatio: ClipAspectRatio };
  generateAudio: boolean;
  cost: number;
  imageCount: number;
  createdAt: string;
  videoUrl?: string;
  error?: string;
};

export type ImagineStatus = {
  keyReady: boolean;
  preview: boolean;
  securityReady: boolean;
  budgetReady: boolean;
  usedToday: number;
  remaining: number;
  cap: number;
  globalUsedToday: number;
  globalRemaining: number;
  reservedSpendUsd: number;
  remainingSpendUsd: number;
  spendCapUsd: number;
  model: string;
  jobs: ImagineJobSummary[];
};

export type ClipSettings = {
  duration: ClipDuration;
  resolution: ClipResolution;
  aspectRatio: ClipAspectRatio;
};

export type StartResponse =
  | { ok: true; token: string; remaining: number }
  | { ok: false; code: string; error: string; remaining: number; token?: string };

export type PollResponse =
  | { ok: true; status: "pending" | "done" | "failed" | "expired" | "unknown"; url?: string; error?: string }
  | { ok: false; code: string; error: string };
