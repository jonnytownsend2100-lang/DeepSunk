import { useEffect, useRef, useState } from "react";
import {
  Aperture, ArrowDownToLine, ArrowRight, AudioLines, Check, CheckCircle2,
  ChevronDown, Clapperboard, Film, Frame, ImagePlus, Layers3, LoaderCircle,
  LockKeyhole, Mic2, MonitorPlay, MoveUpRight, Plus, Settings2, Sparkles,
  Trash2, Upload, WandSparkles, X, Zap,
} from "lucide-react";
import { apiUrl } from "@/lib/imagine/api-url";
import {
  CLIP_ASPECT_RATIOS, CLIP_DURATIONS, CLIP_MODELS, DEFAULT_CLIP_ASPECT_RATIO,
  DEFAULT_CLIP_DURATION, DEFAULT_CLIP_MODEL, DEFAULT_CLIP_RESOLUTION,
  IMAGE_INPUT_USD, MAX_KEYFRAMES, MAX_PROMPT, MAX_REFERENCE_IMAGES, MAX_TOTAL_IMAGE_ASSETS,
  PRESET_VOICES, VIDEO_USD_PER_SECOND, VISITOR_CLIP_BUDGET, estimateClipCost,
} from "@/lib/imagine/limits";
import type { ClipAspectRatio, ClipDuration, ClipModel, ClipResolution, GenerationMode, PresetVoice } from "@/lib/imagine/limits";
import { cropStillToAspect, fileToStill, paintPierStill, paintWindowStill } from "@/lib/imagine/stills";
import type { StillAsset } from "@/lib/imagine/stills";
import type { ImagineStatus, PollResponse, StartResponse } from "@/lib/imagine/types";

const POLL_MS = 4_500;
const POLL_LIMIT = 240;
const PROMPT_PRESETS = [
  { label: "Cinematic", text: "A confident cinematic camera move with deliberate parallax, tactile atmosphere, natural motion physics, and richly controlled light. Preserve the subject's identity and the composition." },
  { label: "Action sequence", text: "A high-energy action shot with decisive camera movement, physically believable momentum, crisp subject readability, dynamic environmental motion, and a strong cinematic finish." },
  { label: "Luxury product", text: "A premium product film. Slow precision camera movement, sculpted reflections, refined highlights, subtle material detail, and an immaculate studio atmosphere. Keep the product geometry and branding stable." },
  { label: "Dreamlike", text: "An otherworldly cinematic moment with graceful, continuous movement, atmospheric depth, delicate particles, volumetric light, and surreal but physically coherent motion." },
];
function voiceLabel(voice: PresetVoice): string {
  return voice.charAt(0).toUpperCase() + voice.slice(1);
}

type KeyframeAsset = { asset: StillAsset; timestampS: number };
type Phase = "idle" | "starting" | "rendering" | "done";
type JobStatus = "submitting" | "submission_unknown" | "pending" | "done" | "failed" | "expired";
type RenderRecord = {
  id: string;
  token: string;
  url: string;
  prompt: string;
  model: ClipModel;
  mode: GenerationMode;
  imageCount: number;
  settings: { duration: ClipDuration; resolution: ClipResolution; aspectRatio: ClipAspectRatio };
  cost: number;
  createdAt: Date;
  thumbnail: string;
  status: JobStatus;
  error?: string;
};

async function readJson(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { return null; }
}
function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
function assetCount(mode: GenerationMode, opening: StillAsset | null, ending: StillAsset | null, references: StillAsset[], keyframes: KeyframeAsset[]): number {
  if (mode === "text") return 0;
  if (mode === "image") return Number(Boolean(opening));
  if (mode === "reference") return references.length;
  return Number(Boolean(opening)) + Number(Boolean(ending)) + references.length + keyframes.length;
}
function imageLabel(asset: StillAsset): string {
  return asset.name.length > 22 ? `${asset.name.slice(0, 19)}…` : asset.name;
}
function prettyMode(mode: GenerationMode): string {
  return ({ text: "Text to video", image: "Image to video", reference: "Reference guided", director: "Director mode" })[mode];
}
function timestampOptions(duration: number, used: number[]): number[] {
  const values: number[] = [];
  for (let tick = 1; tick < duration * 3; tick += 1) values.push(Number((tick / 3).toFixed(3)));
  return values.filter((value) => !used.some((item) => Math.abs(item - value) < 0.0001));
}
function preferredTimestamp(duration: number, used: number[]): number {
  const candidates = [2, 4, 6, 1, 3, 5, 7, 1 / 3, 2 / 3, 4 / 3, 5 / 3];
  return candidates.find((value) => value < duration && !used.some((item) => Math.abs(item - value) < 0.0001))
    ?? timestampOptions(duration, used)[0] ?? 1 / 3;
}
function formatTime(date: Date): string {
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function Studio() {
  const [status, setStatus] = useState<ImagineStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  const [mode, setMode] = useState<GenerationMode>("text");
  const [model, setModel] = useState<ClipModel>(DEFAULT_CLIP_MODEL);
  const [prompt, setPrompt] = useState("A low camera races through a rain-slick neon boulevard as a superbike tears past. Water erupts from the tires, signs streak across the wet asphalt, and the camera swings into a dramatic pursuit. Hyperreal, high contrast, coherent motion, no cuts.");
  const [opening, setOpening] = useState<StillAsset | null>(null);
  const [ending, setEnding] = useState<StillAsset | null>(null);
  const [references, setReferences] = useState<StillAsset[]>([]);
  const [keyframes, setKeyframes] = useState<KeyframeAsset[]>([]);
  const [voiceIds, setVoiceIds] = useState<PresetVoice[]>([]);
  const [duration, setDuration] = useState<ClipDuration>(DEFAULT_CLIP_DURATION);
  const [resolution, setResolution] = useState<ClipResolution>(DEFAULT_CLIP_RESOLUTION);
  const [aspectRatio, setAspectRatio] = useState<ClipAspectRatio>(DEFAULT_CLIP_ASPECT_RATIO);
  const [generateAudio, setGenerateAudio] = useState(true);
  const [confirmSpend, setConfirmSpend] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [recent, setRecent] = useState<RenderRecord[]>([]);
  const [dragging, setDragging] = useState(false);
  const [addingMedia, setAddingMedia] = useState(false);
  const [voiceToAdd, setVoiceToAdd] = useState<PresetVoice>("eve");
  const openingRef = useRef<HTMLInputElement>(null);
  const endingRef = useRef<HTMLInputElement>(null);
  const referenceRef = useRef<HTMLInputElement>(null);
  const keyframeRef = useRef<HTMLInputElement>(null);
  const pollTimer = useRef<number | null>(null);
  const idempotencyKey = useRef("");
  const idempotencyFingerprint = useRef("");

  const imageCount = assetCount(mode, opening, ending, references, keyframes);
  const advancedMode = mode === "reference" || (mode === "director" && (Boolean(ending) || references.length > 0 || keyframes.length > 0 || voiceIds.length > 0));
  const estimate = estimateClipCost(duration, resolution, model, imageCount);
  const preview = status?.preview ?? true;
  const remaining = status?.remaining ?? 0;
  const busy = phase === "starting" || phase === "rendering";
  const ready = Boolean(status?.keyReady && status.budgetReady && status.securityReady);
  const exceedsSharedBudget = Boolean(!preview && status?.budgetReady && estimate > (status?.remainingSpendUsd ?? 0));
  const sourceReady = mode === "text" ? prompt.trim().length >= 3
    : mode === "image" ? Boolean(opening)
      : mode === "reference" ? references.length > 0 || voiceIds.length > 0
        : Boolean(opening || ending || references.length || keyframes.length || voiceIds.length);
  const promptReady = prompt.trim().length >= 3 || (mode !== "text" && (imageCount > 0 || voiceIds.length > 0));
  const modelReady = !advancedMode || model === "grok-imagine-video-1.5";
  const voiceAudioReady = voiceIds.length === 0 || generateAudio;
  const blocked = busy || !ready || remaining <= 0 || !sourceReady || !promptReady || !modelReady || !voiceAudioReady || !confirmSpend || exceedsSharedBudget;

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(apiUrl("/api/imagine/status"), { signal: controller.signal, cache: "no-store" });
        const body = await readJson(response) as ImagineStatus | null;
        if (!response.ok || !body || typeof body.keyReady !== "boolean" || !Array.isArray(body.jobs)) {
          setStatusError("The generation service did not return a valid status response.");
          return;
        }
        setStatus(body);
        const restored: RenderRecord[] = body.jobs.map((job) => ({
          id: job.id, token: job.token,
          url: job.videoUrl ? (job.videoUrl.startsWith("/") ? apiUrl(job.videoUrl) : job.videoUrl) : "",
          prompt: job.prompt || "Untitled generation", model: job.model, mode: job.mode, imageCount: job.imageCount,
          settings: job.settings, cost: job.cost, createdAt: new Date(job.createdAt), thumbnail: "",
          status: job.status, error: job.error,
        }));
        setRecent(restored);
        const resumable = restored.find((job) => job.status === "pending" || job.status === "submitting");
        if (resumable && !controller.signal.aborted) {
          setPhase("rendering");
          setNotice("Reconnecting to your saved render. You can keep building while Grok works.");
          void poll(resumable.token, 1, 0, resumable);
        }
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") setStatusError("Can't reach the generation service. Check the Grok app environment and reload.");
      }
    })();
    return () => {
      controller.abort();
      if (pollTimer.current !== null) window.clearTimeout(pollTimer.current);
    };
  }, []);

  useEffect(() => {
    setConfirmSpend(false);
  }, [mode, model, prompt, opening, ending, references, keyframes, voiceIds, duration, resolution, aspectRatio, generateAudio]);
  useEffect(() => () => { if (pollTimer.current !== null) window.clearTimeout(pollTimer.current); }, []);

  function clearMessage() { setError(""); setNotice(""); }
  function insertPromptTag(tag: string) {
    setPrompt((value) => `${value}${value.trim() ? " " : ""}${tag}`);
  }
  function removeIndexedPromptTag(prefix: "IMAGE" | "AUDIO", removedIndex: number) {
    const pattern = new RegExp(`<${prefix}_(\\d+)>`, "g");
    setPrompt((value) => value
      .replace(pattern, (tag, rawIndex: string) => {
        const index = Number(rawIndex);
        if (index === removedIndex) return "";
        return index > removedIndex ? `<${prefix}_${index - 1}>` : tag;
      })
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\s+([,.!?])/g, "$1"));
  }
  function shiftImagePromptTags(delta: 1 | -1) {
    if (delta === 1) {
      setPrompt((value) => value.replace(/<IMAGE_(\d+)>/g, (_tag, rawIndex: string) => `<IMAGE_${Number(rawIndex) + 1}>`));
    } else {
      removeIndexedPromptTag("IMAGE", 0);
    }
  }
  function removeOpeningFrame() {
    if (mode === "director" && opening) shiftImagePromptTags(-1);
    setOpening(null);
  }
  function removeReference(index: number) {
    const offset = mode === "director" && opening ? 1 : 0;
    removeIndexedPromptTag("IMAGE", index + offset);
    setReferences((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }
  function removeVoice(index: number) {
    removeIndexedPromptTag("AUDIO", index);
    setVoiceIds((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }
  async function prepareFile(file: File): Promise<StillAsset> {
    const source = await fileToStill(file);
    return source;
  }
  async function useOpeningFile(file: File) {
    clearMessage();
    if (mode === "director" && !opening && totalDirectorImages >= MAX_TOTAL_IMAGE_ASSETS) {
      setError(`Director mode supports ${MAX_TOTAL_IMAGE_ASSETS} total image assets. Remove an asset first.`); return;
    }
    setAddingMedia(true);
    try {
      const asset = await prepareFile(file);
      if (mode === "director" && !opening) shiftImagePromptTags(1);
      setOpening(asset); setVideoUrl(""); setPhase("idle");
    }
    catch (err) { setError(err instanceof Error ? err.message : "Could not read that image."); }
    finally { setAddingMedia(false); }
  }
  async function useEndingFile(file: File) {
    clearMessage();
    if (!ending && mode === "director" && totalDirectorImages >= MAX_TOTAL_IMAGE_ASSETS) {
      setError(`Director mode supports ${MAX_TOTAL_IMAGE_ASSETS} total image assets. Remove an asset first.`); return;
    }
    setAddingMedia(true);
    try { promoteAdvanced(); setEnding(await prepareFile(file)); setVideoUrl(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not read the closing frame."); }
    finally { setAddingMedia(false); }
  }
  async function addReferenceFiles(files: FileList | File[]) {
    clearMessage();
    const incoming = Array.from(files);
    const openSlots = Math.min(MAX_REFERENCE_IMAGES - references.length, MAX_TOTAL_IMAGE_ASSETS - (mode === "director" ? Number(Boolean(opening)) + Number(Boolean(ending)) + keyframes.length + references.length : references.length));
    if (openSlots <= 0) { setError(`This board is full. Remove an image before adding more (maximum ${MAX_REFERENCE_IMAGES} references and ${MAX_TOTAL_IMAGE_ASSETS} total images).`); return; }
    if (incoming.length > openSlots) setNotice(`Added the first ${openSlots} images; the current workflow has room for ${openSlots} more.`);
    setAddingMedia(true);
    try {
      const next: StillAsset[] = [];
      for (const file of incoming.slice(0, openSlots)) next.push(await prepareFile(file));
      promoteAdvanced();
      setReferences((items) => [...items, ...next].slice(0, MAX_REFERENCE_IMAGES));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not prepare one of those reference images."); }
    finally { setAddingMedia(false); }
  }
  async function addKeyframeFile(file: File) {
    clearMessage();
    if (keyframes.length >= MAX_KEYFRAMES) { setError(`Director mode supports up to ${MAX_KEYFRAMES} middle keyframes.`); return; }
    if (assetCount("director", opening, ending, references, keyframes) >= MAX_TOTAL_IMAGE_ASSETS) { setError(`Director mode supports ${MAX_TOTAL_IMAGE_ASSETS} total image assets.`); return; }
    setAddingMedia(true);
    try {
      const asset = await prepareFile(file);
      const used = keyframes.map((item) => item.timestampS);
      promoteAdvanced();
      setKeyframes((items) => [...items, { asset, timestampS: preferredTimestamp(duration, used) }].sort((a, b) => a.timestampS - b.timestampS));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not prepare that keyframe."); }
    finally { setAddingMedia(false); }
  }
  function useSample(name: string, paint: () => string, target: "opening" | "reference" = "opening") {
    const dataUrl = paint();
    const asset: StillAsset = { dataUrl, name, width: 960, height: 540, sourceBytes: 0 };
    if (target === "reference") setReferences((items) => [...items, asset].slice(0, MAX_REFERENCE_IMAGES));
    else setOpening(asset);
    clearMessage(); setVideoUrl("");
  }
  function promoteAdvanced() {
    setModel("grok-imagine-video-1.5");
    setResolution((value) => value === "1080p" ? "720p" : value);
  }
  function changeMode(next: GenerationMode) {
    if (next === mode) return;
    clearMessage();
    const hadIndexedTags = /<(?:IMAGE|AUDIO)_\d+>/.test(prompt);
    if (hadIndexedTags) {
      setPrompt((value) => value.replace(/<(?:IMAGE|AUDIO)_\d+>/g, "").replace(/[ \t]{2,}/g, " ").trim());
      setNotice("Reference tags were cleared because their image or speaker slots change between creative modes.");
    }
    setMode(next);
    if (next === "reference" || (next === "director" && (ending || references.length > 0 || keyframes.length > 0 || voiceIds.length > 0))) {
      promoteAdvanced();
    }
    setVideoUrl("");
  }
  function changeModel(next: ClipModel) {
    clearMessage(); setModel(next);
    if (next === "grok-imagine-video-1.5-lite" && advancedMode) {
      setMode(opening ? "image" : "text");
      setEnding(null); setReferences([]); setKeyframes([]); setVoiceIds([]);
      setPrompt((value) => value.replace(/<(?:IMAGE|AUDIO)_\d+>/g, "").replace(/[ \t]{2,}/g, " ").trim());
      setNotice("Lite supports Text and Image mode. Reference, keyframe, and voice direction were cleared from this draft.");
    }
  }
  function changeDuration(next: ClipDuration) {
    setDuration(next);
    setKeyframes((items) => {
      const used: number[] = [];
      return items.map((item) => {
        const stillValid = item.timestampS < next && !used.some((value) => Math.abs(value - item.timestampS) < 0.0001);
        const timestampS = stillValid ? item.timestampS : preferredTimestamp(next, used);
        used.push(timestampS);
        return { ...item, timestampS };
      }).sort((a, b) => a.timestampS - b.timestampS);
    });
  }
  function addVoice() {
    if (voiceIds.length >= 3) { setError("Grok supports up to three preset speaker references."); return; }
    if (voiceIds.includes(voiceToAdd)) { setError("That voice is already assigned. Choose another preset."); return; }
    promoteAdvanced();
    setVoiceIds((items) => [...items, voiceToAdd]);
    const next = PRESET_VOICES.find((item) => !voiceIds.includes(item) && item !== voiceToAdd);
    if (next) setVoiceToAdd(next);
    clearMessage();
  }
  function schedulePoll(token: string, attempt: number, networkFailures: number, record?: RenderRecord) {
    if (pollTimer.current !== null) window.clearTimeout(pollTimer.current);
    const delay = networkFailures > 0
      ? Math.min(45_000, POLL_MS * (2 ** Math.min(networkFailures, 4))) + Math.floor(Math.random() * 900)
      : POLL_MS;
    pollTimer.current = window.setTimeout(() => { void poll(token, attempt + 1, networkFailures, record); }, delay);
  }
  function updateRecent(record: RenderRecord, patch: Partial<RenderRecord>) {
    setRecent((items) => items.map((item) => item.id === record.id ? { ...item, ...patch } : item));
  }
  async function poll(token: string, attempt: number, networkFailures = 0, record?: RenderRecord) {
    if (attempt > POLL_LIMIT) {
      setPhase("idle"); setError("Grok is still working. Your render remains saved—select it in Recent renders to resume status checks."); return;
    }
    try {
      const response = await fetch(apiUrl("/api/imagine/poll"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }), cache: "no-store" });
      const body = await readJson(response) as PollResponse | null;
      if (!response.ok || !body || body.ok === false) {
        const message = body && body.ok === false ? body.error : "Could not check the render.";
        if ((response.status >= 500 || response.status === 429) && networkFailures < 6) { schedulePoll(token, attempt, networkFailures + 1, record); return; }
        setPhase("idle"); setError(message); return;
      }
      if (body.status === "done" && body.url) {
        const url = body.url.startsWith("/") ? apiUrl(body.url) : body.url;
        setVideoUrl(url); setPhase("done"); setNotice(preview ? "Development clip is ready. Nothing was sent to xAI." : "Your video is ready. It is privately stored with xAI and served through your visitor session.");
        if (record) updateRecent(record, { status: "done", url, error: undefined });
        return;
      }
      if (body.status === "failed" || body.status === "expired") {
        setPhase("idle"); setError(body.error || "The render did not complete.");
        if (record) updateRecent(record, { status: body.status, error: body.error || "The render did not complete." });
        return;
      }
      if (body.status === "unknown") {
        setPhase("idle"); const message = body.error || "The request outcome is unknown. Check xAI request history before retrying.";
        setError(message); if (record) updateRecent(record, { status: "submission_unknown", error: message }); return;
      }
      schedulePoll(token, attempt, 0, record);
    } catch {
      if (networkFailures < 6) { schedulePoll(token, attempt, networkFailures + 1, record); return; }
      setPhase("idle"); setError("Lost connection while checking the render. Your job remains saved; select it below to reconnect.");
    }
  }

  async function dataUrl(asset: StillAsset | null): Promise<string | undefined> {
    if (!asset) return undefined;
    return cropStillToAspect(asset.dataUrl, aspectRatio);
  }
  async function generate() {
    if (blocked) return;
    clearMessage(); setVideoUrl(""); setPhase("starting");
    try {
      const [imageDataUrl, lastFrameDataUrl, refDataUrls, keyframeDataUrls] = await Promise.all([
        mode === "image" || mode === "director" ? dataUrl(opening) : Promise.resolve(undefined),
        mode === "director" ? dataUrl(ending) : Promise.resolve(undefined),
        mode === "reference" || mode === "director" ? Promise.all(references.map(async (item) => (await dataUrl(item))!)) : Promise.resolve([] as string[]),
        mode === "director" ? Promise.all(keyframes.map(async (item) => ({ imageDataUrl: (await dataUrl(item.asset))!, timestampS: item.timestampS }))) : Promise.resolve([] as { imageDataUrl: string; timestampS: number }[]),
      ]);
      const input = {
        mode, model, prompt: prompt.trim(),
        ...(imageDataUrl ? { imageDataUrl } : {}),
        ...(lastFrameDataUrl ? { lastFrameDataUrl } : {}),
        referenceImages: refDataUrls, keyframes: keyframeDataUrls,
        voiceIds: mode === "reference" || mode === "director" ? voiceIds : [],
        confirmSpend, duration, resolution, aspectRatio, generateAudio,
      };
      const signature = JSON.stringify(input);
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signature));
      const signatureHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      if (!idempotencyKey.current || idempotencyFingerprint.current !== signatureHash) {
        idempotencyKey.current = crypto.randomUUID(); idempotencyFingerprint.current = signatureHash;
      }
      const response = await fetch(apiUrl("/api/imagine/start"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, idempotencyKey: idempotencyKey.current }),
      });
      const body = await readJson(response) as StartResponse | null;
      if (!response.ok || !body || body.ok === false) {
        setPhase("idle"); setError(body && body.ok === false ? body.error : "Grok did not start the render.");
        const uncertainToken = body && "token" in body ? body.token : undefined;
        const uncertainJobId = uncertainToken?.split(".")[0] ?? "";
        const delta = uncertainJobId && !recent.some((item) => item.id === uncertainJobId) ? 1 : 0;
        if (body && "remaining" in body) setStatus((current) => current ? {
          ...current, remaining: body.remaining, usedToday: Math.min(current.cap, current.usedToday + delta),
          globalUsedToday: current.globalUsedToday + delta, globalRemaining: Math.max(0, current.globalRemaining - delta),
          reservedSpendUsd: Number((current.reservedSpendUsd + delta * estimate).toFixed(2)),
          remainingSpendUsd: Number(Math.max(0, current.remainingSpendUsd - delta * estimate).toFixed(2)),
        } : current);
        if (uncertainToken) {
          const uncertain: RenderRecord = {
            id: uncertainJobId, token: uncertainToken, url: "", prompt: prompt.trim(), model, mode, imageCount,
            settings: { duration, resolution, aspectRatio }, cost: estimate, createdAt: new Date(),
            thumbnail: opening?.dataUrl ?? references[0]?.dataUrl ?? "", status: "submission_unknown", error: body && body.ok === false ? body.error : "The render needs review.",
          };
          setRecent((items) => [uncertain, ...items.filter((item) => item.id !== uncertain.id)].slice(0, 12));
        } else if (response.status < 500) { idempotencyKey.current = ""; idempotencyFingerprint.current = ""; }
        return;
      }
      idempotencyKey.current = ""; idempotencyFingerprint.current = "";
      const jobId = body.token.split(".")[0];
      const delta = recent.some((item) => item.id === jobId) ? 0 : 1;
      setStatus((current) => current ? {
        ...current, remaining: body.remaining, usedToday: Math.min(current.cap, current.usedToday + delta),
        globalUsedToday: current.globalUsedToday + delta, globalRemaining: Math.max(0, current.globalRemaining - delta),
        reservedSpendUsd: Number((current.reservedSpendUsd + delta * estimate).toFixed(2)),
        remainingSpendUsd: Number(Math.max(0, current.remainingSpendUsd - delta * estimate).toFixed(2)),
      } : current);
      setConfirmSpend(false);
      const record: RenderRecord = {
        id: jobId, token: body.token, url: "", prompt: prompt.trim(), model, mode, imageCount,
        settings: { duration, resolution, aspectRatio }, cost: estimate, createdAt: new Date(),
        thumbnail: opening?.dataUrl ?? references[0]?.dataUrl ?? "", status: "pending",
      };
      setRecent((items) => [record, ...items.filter((item) => item.id !== record.id)].slice(0, 12));
      setPhase("rendering"); setNotice(preview ? "Saved on the development server. Your xAI account was not billed." : "Grok accepted your generation. The job is saved and can resume after a refresh.");
      await poll(body.token, 1, 0, record);
    } catch (err) {
      setPhase("idle"); setError(err instanceof Error ? err.message : "Could not prepare and submit this generation. Your draft is still here.");
    }
  }
  function openRecent(item: RenderRecord) {
    setPrompt(item.prompt); setMode(item.mode); setModel(item.model); setDuration(item.settings.duration);
    setResolution(item.settings.resolution); setAspectRatio(item.settings.aspectRatio);
    if (item.status === "done" && item.url) { setVideoUrl(item.url); setPhase("done"); setNotice("Showing a saved private render."); return; }
    setVideoUrl("");
    if (item.status === "pending" || item.status === "submitting") { setPhase("rendering"); setNotice("Reconnecting to the saved render."); void poll(item.token, 1, 0, item); return; }
    setPhase("idle"); setError(item.error || "This job needs review before you submit another generation.");
  }

  const connectionLabel = statusError ? "Service unavailable" : !status ? "Connecting to Grok" : !status.keyReady ? "API key missing" : !status.securityReady ? "Session security missing" : !status.budgetReady ? "Spend protection unavailable" : status.preview ? "Dev route online" : "Engine online";
  const modelTitle = model === "grok-imagine-video-1.5" ? "Grok Imagine 1.5" : "Grok Imagine 1.5 Lite";
  const voiceCapacity = 3 - voiceIds.length;
  const totalDirectorImages = assetCount("director", opening, ending, references, keyframes);

  return (
    <main className="sw-app" id="studio">
      <aside className="sw-rail">
        <a className="sw-brand" href="#studio" aria-label="Stillwake Studio">
          <span className="sw-brand-mark"><Aperture size={20} strokeWidth={1.7} /></span>
          <span className="sw-brand-word">stillwake<span>IMAGINE / MOTION</span></span>
        </a>
        <div className="sw-rail-label">WORKSPACE</div>
        <nav className="sw-nav" aria-label="Studio navigation">
          <a className="sw-nav-item is-current" href="#create"><Sparkles size={16} /> Create <span className="sw-nav-pulse" /></a>
          <a className="sw-nav-item" href="#recent"><Film size={16} /> Your renders <span className="sw-nav-count">{recent.length}</span></a>
        </nav>
        <div className="sw-rail-bottom">
          <div className="sw-budget">
            <div className="sw-budget-head"><span>DAILY RENDERS</span><strong>{status ? `${status.usedToday}/${status.cap}` : "—"}</strong></div>
            <div className="sw-budget-bar"><span style={{ width: `${status?.cap ? Math.min(100, status.usedToday / status.cap * 100) : 0}%` }} /></div>
            <p>{status?.budgetReady ? `${remaining} available today` : "Checking budget ledger…"}</p>
            <div className="sw-budget-separator" />
            <div className="sw-budget-spend"><span>{preview ? "THIS WORKSPACE" : "SHARED SPEND LEFT"}</span><strong>{preview ? "$0.00" : money(status?.remainingSpendUsd ?? 0)}</strong></div>
          </div>
          <div className="sw-private"><LockKeyhole size={13} /> {preview ? "Development renders stay on the server and do not bill you." : "Your API key never reaches the browser."}</div>
          <div className="sw-version">STILLWAKE STUDIO <span>·</span> BUILD 01</div>
        </div>
      </aside>

      <div className="sw-main">
        <header className="sw-topbar">
          <div className="sw-crumb"><span>Workspace</span><span>/</span><strong>New generation</strong></div>
          <div className="sw-topbar-right">
            <span className={`sw-engine-dot ${ready ? "is-live" : ""}`} />
            <span>{connectionLabel}</span>
            <i />
            <span className="sw-model-indicator">{modelTitle}</span>
          </div>
        </header>

        <div className="sw-page" id="create">
          <section className="sw-hero">
            <div>
              <div className="sw-overline"><span /> GROK IMAGINE · CREATIVE WORKSTATION</div>
              <h1>Make the impossible <em>move.</em></h1>
              <p>From a single idea to a directed sequence. Shape the scene, set the motion, and let Grok Imagine render the moment.</p>
            </div>
            <div className="sw-hero-stamp"><span className="sw-stamp-ring"><Aperture size={25} /></span><span>DIRECTED<br />BY YOU</span></div>
          </section>

          <section className="sw-model-strip" aria-label="Model selection">
            <div className="sw-model-intro"><span className="sw-model-icon"><Zap size={17} /></span><div><strong>Choose your engine</strong><small>The model controls your available creative tools.</small></div></div>
            <div className="sw-model-options">
              <button type="button" className={`sw-model-option ${model === "grok-imagine-video-1.5" ? "selected" : ""}`} onClick={() => changeModel("grok-imagine-video-1.5")}>
                <span className="sw-model-option-top">IMAGINE 1.5 <b>DIRECTOR'S CUT</b></span><strong>Full model</strong><small>Reference boards · keyframes · voices · native 1080p*</small>
              </button>
              <button type="button" className={`sw-model-option ${model === "grok-imagine-video-1.5-lite" ? "selected" : ""}`} onClick={() => changeModel("grok-imagine-video-1.5-lite")}>
                <span className="sw-model-option-top">IMAGINE 1.5 <b className="lite-tag">LITE</b></span><strong>Fast & economical</strong><small>Text or image · 1080p output is upscaled from 720p</small>
              </button>
            </div>
          </section>

          <section className="sw-mode-block">
            <div className="sw-section-meta"><span>01 / CREATIVE MODE</span><span>CHOOSE HOW TO BUILD YOUR SHOT</span></div>
            <div className="sw-mode-tabs" role="tablist" aria-label="Generation mode">
              <button type="button" role="tab" aria-selected={mode === "text"} className={mode === "text" ? "active" : ""} onClick={() => changeMode("text")}><span><WandSparkles size={18} /></span><strong>Text to video</strong><small>Start with an idea</small></button>
              <button type="button" role="tab" aria-selected={mode === "image"} className={mode === "image" ? "active" : ""} onClick={() => changeMode("image")}><span><ImagePlus size={18} /></span><strong>Image to video</strong><small>Bring a still to life</small></button>
              <button type="button" role="tab" aria-selected={mode === "reference"} className={mode === "reference" ? "active" : ""} onClick={() => changeMode("reference")}><span><Layers3 size={18} /></span><strong>Reference guided</strong><small>Define the visual world</small><b>1.5 FULL</b></button>
              <button type="button" role="tab" aria-selected={mode === "director"} className={mode === "director" ? "active" : ""} onClick={() => changeMode("director")}><span><Clapperboard size={18} /></span><strong>Director mode</strong><small>Pin the story beats</small><b>1.5 FULL</b></button>
            </div>
          </section>

          <div className="sw-workbench">
            <section className="sw-stage-column" aria-label="Visual direction">
              <div className="sw-panel-heading"><div><span className="sw-step">02</span><div><h2>{mode === "text" ? "The scene" : mode === "image" ? "Opening frame" : mode === "reference" ? "Reference board" : "Storyboard"}</h2><p>{mode === "text" ? "No source media required. Build from words." : mode === "image" ? "Choose the image that becomes frame one." : mode === "reference" ? "Upload visual DNA for Grok to follow." : "Pin the opening, closing, and the moments between."}</p></div></div><span className="sw-format-note">JPG · PNG · WEBP</span></div>

              {mode === "text" ? (
                <div className={`sw-canvas sw-text-canvas ratio-${aspectRatio.replace(":", "-")}`}>
                  <div className="sw-canvas-glow" /><div className="sw-canvas-grid" />
                  <div className="sw-frame-index"><span>FRAME 001</span><span>TEXT → MOTION</span></div>
                  <div className="sw-text-art"><span className="sw-art-kicker">NO SOURCE. NO LIMITS.</span><strong>Imagine<br /><i>what's next.</i></strong><span className="sw-art-line" /><small>Describe the moment you want to see.</small></div>
                  <div className="sw-canvas-cross sw-cross-a" /><div className="sw-canvas-cross sw-cross-b" />
                  <div className="sw-canvas-bottom"><span>GROK IMAGINE VIDEO 1.5</span><span>01 / 04</span></div>
                </div>
              ) : null}

              {mode === "image" ? (
                <div className={`sw-media-canvas ${opening ? "has-media" : ""}`} style={{ aspectRatio: aspectRatio.replace(":", " / ") }} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) void useOpeningFile(file); }}>
                  {opening ? <><img src={opening.dataUrl} alt="Opening frame" /><div className="sw-media-vignette" /><div className="sw-media-top"><span><Check size={12} /> OPENING FRAME</span><button type="button" onClick={removeOpeningFrame} aria-label="Remove opening frame"><X size={15} /></button></div><div className="sw-media-bottom"><strong>{imageLabel(opening)}</strong><small>{opening.width} × {opening.height} · CENTER CROP TO {aspectRatio}</small></div></> : <div className="sw-upload-empty"><span className="sw-upload-icon"><ImagePlus size={24} /></span><strong>Drop your first frame here</strong><span>or select a still from your device</span><button type="button" className="sw-choose-button" onClick={() => openingRef.current?.click()}><Upload size={14} /> Choose image</button><small>Up to 20 MB · optimized before upload</small></div>}
                  {dragging ? <div className="sw-drop-overlay">RELEASE TO ADD FRAME</div> : null}
                </div>
              ) : null}

              {mode === "reference" ? (
                <div className="sw-reference-board">
                  <div className="sw-reference-board-head"><div><Layers3 size={16} /><strong>VISUAL DNA</strong></div><span>{references.length} / {MAX_REFERENCE_IMAGES} REFERENCES</span></div>
                  {references.length ? <div className="sw-reference-grid">{references.map((item, index) => <div className="sw-reference-item" key={`${item.name}-${index}`}><img src={item.dataUrl} alt={`Reference ${index + 1}: ${item.name}`} /><span>REF {String(index + 1).padStart(2, "0")}</span><div className="sw-ref-actions"><button type="button" onClick={() => insertPromptTag(`<IMAGE_${index}>`)} aria-label={`Insert reference ${index + 1} prompt tag`}>TAG</button><button type="button" onClick={() => removeReference(index)} aria-label={`Remove reference ${index + 1}`}><X size={13} /></button></div></div>)}</div> : <div className="sw-reference-empty"><span className="sw-reference-orbit"><Aperture size={35} /></span><strong>Build your visual world.</strong><small>Add up to 14 images to guide style, characters, locations, materials, and continuity.</small></div>}
                  <button type="button" className="sw-add-media" onClick={() => referenceRef.current?.click()} disabled={references.length >= MAX_REFERENCE_IMAGES || addingMedia}><Plus size={15} /> Add reference images <span>{MAX_REFERENCE_IMAGES - references.length} slots</span></button>
                </div>
              ) : null}

              {mode === "director" ? (
                <div className="sw-director-board">
                  <div className="sw-board-heading"><div><Clapperboard size={16} /><strong>SHOT SEQUENCE</strong></div><span>{totalDirectorImages} / {MAX_TOTAL_IMAGE_ASSETS} MEDIA ASSETS</span></div>
                  <div className="sw-storyboard">
                    <div className={`sw-frame-slot ${opening ? "filled" : ""}`}>
                      <span className="sw-frame-slot-label">01 · OPEN</span>
                      {opening ? <><img src={opening.dataUrl} alt="Opening frame" /><button type="button" aria-label="Remove opening frame" onClick={removeOpeningFrame}><X size={13} /></button></> : <button type="button" onClick={() => openingRef.current?.click()}><Plus size={22} /><small>Opening frame</small></button>}
                    </div>
                    {keyframes.map((item, index) => <div className="sw-frame-slot filled" key={`${item.asset.name}-${index}`}><span className="sw-frame-slot-label">{String(index + 2).padStart(2, "0")} · BEAT</span><img src={item.asset.dataUrl} alt={`Keyframe at ${item.timestampS}s`} /><button type="button" aria-label={`Remove keyframe at ${item.timestampS} seconds`} onClick={() => setKeyframes((items) => items.filter((_, itemIndex) => itemIndex !== index))}><X size={13} /></button><select aria-label={`Keyframe ${index + 1} timestamp`} value={item.timestampS} onChange={(event) => { const next = Number(event.target.value); setKeyframes((items) => items.map((frame, itemIndex) => itemIndex === index ? { ...frame, timestampS: next } : frame).sort((a, b) => a.timestampS - b.timestampS)); }}><option value={item.timestampS}>{item.timestampS.toFixed(2)}s</option>{timestampOptions(duration, keyframes.filter((_, itemIndex) => itemIndex !== index).map((frame) => frame.timestampS)).map((time) => <option value={time} key={time}>{time.toFixed(2)}s</option>)}</select></div>)}
                    <div className={`sw-frame-slot ${ending ? "filled" : ""}`}>
                      <span className="sw-frame-slot-label">END · CLOSE</span>
                      {ending ? <><img src={ending.dataUrl} alt="Closing frame" /><button type="button" aria-label="Remove closing frame" onClick={() => setEnding(null)}><X size={13} /></button></> : <button type="button" onClick={() => endingRef.current?.click()}><Plus size={22} /><small>Closing frame</small></button>}
                    </div>
                  </div>
                  <div className="sw-sequence-actions"><button type="button" onClick={() => keyframeRef.current?.click()} disabled={keyframes.length >= MAX_KEYFRAMES || totalDirectorImages >= MAX_TOTAL_IMAGE_ASSETS || addingMedia}><Plus size={14} /> Add middle keyframe <span>{keyframes.length}/{MAX_KEYFRAMES}</span></button><button type="button" onClick={() => referenceRef.current?.click()} disabled={totalDirectorImages >= MAX_TOTAL_IMAGE_ASSETS || addingMedia}><Layers3 size={14} /> Add visual reference</button></div>
                  {references.length ? <div className="sw-director-refs"><span>VISUAL REFERENCES</span>{references.map((item, index) => <div key={`${item.name}-${index}`}><img src={item.dataUrl} alt={imageLabel(item)} /><small>{imageLabel(item)}</small><button type="button" className="sw-director-tag" onClick={() => insertPromptTag(`<IMAGE_${index + Number(Boolean(opening))}>`)} aria-label={`Insert image reference ${index + 1} prompt tag`}>TAG</button><button type="button" onClick={() => removeReference(index)} aria-label="Remove visual reference"><X size={12} /></button></div>)}</div> : null}
                  <div className="sw-board-footnote"><Frame size={13} /> Keyframes snap to Grok's ⅓-second timeline. Reorder beats by changing their timestamps.</div>
                </div>
              ) : null}

              {mode === "image" && !opening ? <div className="sw-sample-row"><span>START WITH A SAMPLE</span><button type="button" onClick={() => useSample("Window light", paintWindowStill)}>Window light <ArrowRight size={13} /></button><button type="button" onClick={() => useSample("Coastal dusk", paintPierStill)}>Coastal dusk <ArrowRight size={13} /></button></div> : null}

              <div className="sw-source-foot">
                <span><LockKeyhole size={13} /> Images are optimized in your browser before submission.</span>
                <span>{mode === "text" ? "No image input charge" : `${imageCount} image input${imageCount === 1 ? "" : "s"} · ${money(imageCount * IMAGE_INPUT_USD)} input cost`}</span>
              </div>

              {mode === "director" || mode === "reference" ? (
                <section className="sw-voice-panel">
                  <div className="sw-panel-heading compact"><div><span className="sw-step">03</span><div><h2>Speaker direction</h2><p>Assign preset voices to speaker tags in your prompt.</p></div></div><span className="sw-format-note">{voiceIds.length}/3 VOICES</span></div>
                  <div className="sw-voice-content">
                    <div className="sw-voice-explainer"><AudioLines size={17} /><span>Use <code>&lt;AUDIO_0&gt;</code>, <code>&lt;AUDIO_1&gt;</code> and <code>&lt;AUDIO_2&gt;</code> in your prompt to direct each speaker.</span></div>
                    {voiceIds.map((voice, index) => <div className="sw-voice-assignment" key={voice}><span className="sw-voice-index">AUDIO_{index}</span><span className="sw-voice-name"><Mic2 size={14} />{voiceLabel(voice)}</span><button type="button" className="sw-insert-voice" onClick={() => setPrompt((value) => `${value}${value.trim() ? " " : ""}<AUDIO_${index}>`)}>Insert tag</button><button type="button" onClick={() => removeVoice(index)} aria-label={`Remove voice ${voice}`}><Trash2 size={13} /></button></div>)}
                    {voiceCapacity > 0 ? <div className="sw-add-voice"><label className="sw-select-wrap"><span className="sr-only">Preset voice</span><select value={voiceToAdd} onChange={(event) => setVoiceToAdd(event.target.value as PresetVoice)}>{PRESET_VOICES.filter((voice) => !voiceIds.includes(voice)).map((voice) => <option value={voice} key={voice}>{voiceLabel(voice)}</option>)}</select><ChevronDown size={14} /></label><button type="button" onClick={addVoice}><Plus size={14} /> Add speaker</button></div> : <small className="sw-voice-limit">All three Grok preset speaker slots are assigned.</small>}
                  </div>
                </section>
              ) : null}

              {videoUrl ? <section className="sw-output-panel" id="output"><div className="sw-panel-heading"><div><span className="sw-step">04</span><div><h2>Rendered moment</h2><p>{preview ? "Local stand-in so you can test playback. Real Imagine video runs after you publish." : "Your latest creation, privately stored."}</p></div></div><span className="sw-ready-tag"><CheckCircle2 size={13} /> READY</span></div><video key={videoUrl} src={videoUrl} controls playsInline className="sw-output-video" /><div className="sw-output-actions"><a href={videoUrl} download="stillwake-render.mp4"><ArrowDownToLine size={15} /> Download MP4</a><span>{preview ? "DEVELOPMENT CLIP · NOT BILLED" : "PRIVATE FILE · 30-DAY RETENTION"}</span></div></section> : null}
            </section>

            <aside className="sw-control-column" aria-label="Generation controls">
              <div className="sw-panel-heading"><div><span className="sw-step">{mode === "text" || mode === "image" ? "03" : "04"}</span><div><h2>Direct the motion</h2><p>Tell Grok exactly what happens next.</p></div></div><Settings2 size={17} className="sw-heading-icon" /></div>
              <div className="sw-control-card">
                <label htmlFor="sw-prompt" className="sw-field-label">CREATIVE DIRECTION <span>{prompt.length}/{MAX_PROMPT}</span></label>
                <textarea id="sw-prompt" className="sw-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={MAX_PROMPT} placeholder="A helicopter dives between skyscrapers as the camera swings into a breathtaking aerial pursuit…" rows={8} />
                <div className="sw-prompt-guidance"><Sparkles size={13} /><span>Describe the action, camera movement, atmosphere, and what must remain consistent.</span></div>
                <div className="sw-prompt-presets">{PROMPT_PRESETS.map((item) => <button type="button" key={item.label} className={prompt === item.text ? "selected" : ""} onClick={() => setPrompt(item.text)}>{item.label}</button>)}</div>

                <div className="sw-control-divider" />
                <div className="sw-control-head"><span>OUTPUT FORMAT</span><small>Fine-tune the final frame</small></div>
                <div className="sw-setting-pair">
                  <label className="sw-setting"><span>DURATION</span><span className="sw-select-wrap"><select value={duration} onChange={(event) => changeDuration(Number(event.target.value) as ClipDuration)}>{CLIP_DURATIONS.map((value) => <option value={value} key={value}>{value} seconds</option>)}</select><ChevronDown size={14} /></span></label>
                  <label className="sw-setting"><span>ASPECT RATIO</span><span className="sw-select-wrap"><select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value as ClipAspectRatio)}>{CLIP_ASPECT_RATIOS.map((value) => <option value={value} key={value}>{value} {value === "16:9" ? "· Wide" : value === "9:16" ? "· Vertical" : value === "21:9" ? "· Cinema" : ""}</option>)}</select><ChevronDown size={14} /></span></label>
                  <label className="sw-setting"><span>RESOLUTION</span><span className="sw-select-wrap"><select value={resolution} onChange={(event) => setResolution(event.target.value as ClipResolution)}>{(advancedMode ? ["480p", "720p"] : CLIP_MODELS.includes(model) ? ["480p", "720p", "1080p"] : ["480p", "720p"]).map((value) => <option value={value} key={value}>{value}{value === "1080p" && model === "grok-imagine-video-1.5-lite" ? " · Upscaled" : ""}</option>)}</select><ChevronDown size={14} /></span></label>
                  <div className="sw-setting"><span>GENERATED AUDIO</span><button type="button" className={`sw-audio-switch ${generateAudio ? "on" : ""}`} role="switch" aria-checked={generateAudio} onClick={() => setGenerateAudio((value) => !value)}><span /><strong>{generateAudio ? "ON" : "OFF"}</strong></button></div>
                </div>
                {advancedMode ? <div className="sw-capability-note"><Zap size={13} /><span>Reference workflows use full Imagine 1.5 and are currently capped at 720p. Switch to Text or Image for native 1080p output.</span></div> : model === "grok-imagine-video-1.5-lite" && resolution === "1080p" ? <div className="sw-capability-note"><Zap size={13} /><span>Lite's 1080p option is upscaled from its 720p generation.</span></div> : null}
                {voiceIds.length > 0 && !generateAudio ? <div className="sw-capability-note"><AudioLines size={13} /><span>Preset speaker direction requires generated audio. Turn audio back on or remove the speaker assignments.</span></div> : null}

                <div className="sw-cost-card">
                  <div className="sw-cost-top"><span>{preview ? "DEVELOPMENT RENDER" : "ESTIMATED API COST"}</span><span><span className="sw-live-dot" /> {preview ? "NOT BILLED" : "LIVE"}</span></div>
                  <div className="sw-cost-number">{money(preview ? 0 : estimate)}<small> / render</small></div>
                  <div className="sw-cost-line"><span>{duration}s × {money(VIDEO_USD_PER_SECOND[model][resolution])}/sec</span><strong>{preview ? "$0.00" : money(duration * VIDEO_USD_PER_SECOND[model][resolution])}</strong></div>
                  {imageCount > 0 ? <div className="sw-cost-line"><span>{imageCount} image inputs × {money(IMAGE_INPUT_USD)}</span><strong>{preview ? "$0.00" : money(imageCount * IMAGE_INPUT_USD)}</strong></div> : <div className="sw-cost-line"><span>Image inputs</span><strong>$0.00</strong></div>}
                  <div className="sw-cost-foot">{preview ? `Published rate would be ${money(estimate)}. This workspace calls only its own server routes.` : `${model === "grok-imagine-video-1.5" ? "Full Imagine 1.5 rates" : "Imagine 1.5 Lite rates"} · Published xAI pricing. Actual usage may vary.`}</div>
                  {exceedsSharedBudget ? <div className="sw-budget-alert" role="status">This render exceeds the remaining shared budget of {money(status?.remainingSpendUsd ?? 0)}. Lower the settings or try after the UTC reset.</div> : null}
                </div>

                <label className="sw-confirm"><input type="checkbox" checked={confirmSpend} onChange={(event) => setConfirmSpend(event.target.checked)} /><span><Check size={12} /></span><small>{preview ? <>I approve this development render. <strong>It does not call xAI or bill my account.</strong></> : <>I approve an estimated charge of <strong>{money(estimate)}</strong> for this render.</>}</small></label>
                <button type="button" className="sw-generate" onClick={() => void generate()} disabled={blocked}>
                  {busy ? <LoaderCircle size={18} className="sw-spin" /> : <Sparkles size={18} />}
                  <span>{phase === "starting" ? "Preparing your scene…" : phase === "rendering" ? (preview ? "Finishing locally…" : "Grok is creating…") : phase === "done" ? "Create another video" : "Generate video"}</span>
                  {!busy ? <strong>{money(preview ? 0 : estimate)} <ArrowRight size={15} /></strong> : null}
                </button>
                <div className="sw-service-line"><span className={ready ? "online" : ""} />{statusError || (ready ? (preview ? `${remaining} development renders left today · $0 billed` : `${remaining} of ${status?.cap} personal renders left · ${money(status?.remainingSpendUsd ?? 0)} shared budget`) : !status ? "Connecting to secure generation service…" : !status.keyReady ? "XAI_API_KEY is missing in the server environment." : !status.securityReady ? "Configure STILLWAKE_SESSION_SECRET (32+ characters)." : "Shared PostgreSQL spend ledger unavailable.")}</div>
                <div className="sw-privacy-foot"><LockKeyhole size={12} /> {preview ? "Development mode uses server routes only. Nothing is sent to the billed xAI API." : `Visitor limit: ${status?.cap ?? VISITOR_CLIP_BUDGET}/day · Global spend cap: ${money(status?.spendCapUsd ?? 0)}/day.`}</div>
              </div>

              {error ? <div className="sw-message error" role="alert"><X size={15} /><span>{error}</span></div> : null}
              {notice ? <div className="sw-message notice" role="status"><CheckCircle2 size={15} /><span>{notice}</span></div> : null}
              {busy ? <div className="sw-progress-card"><div className="sw-progress-icon"><LoaderCircle size={20} /></div><div><strong>{phase === "starting" ? "Preparing your generation" : "Your scene is rendering"}</strong><small>Grok is building the sequence. Your saved job can be resumed if you leave this page.</small></div><span>LIVE</span></div> : null}
            </aside>
          </div>

          <section className="sw-recent-section" id="recent">
            <div className="sw-recent-heading"><div><span>05 / YOUR WORK</span><h2>Recent renders<span>.</span></h2></div><small>{recent.length ? `${recent.length} saved jobs` : "YOUR GENERATION HISTORY"}</small></div>
            {recent.length ? <div className="sw-recent-grid">{recent.map((item) => <button type="button" key={item.id} className="sw-recent-card" onClick={() => openRecent(item)}><span className="sw-recent-thumb">{item.thumbnail ? <img src={item.thumbnail} alt="" /> : <span className="sw-recent-placeholder"><Film size={24} /></span>}<i><MonitorPlay size={16} /></i><b className={`sw-job-state state-${item.status}`}>{item.status === "done" ? "READY" : item.status === "pending" || item.status === "submitting" ? "RENDERING" : item.status === "submission_unknown" ? "REVIEW" : item.status.toUpperCase()}</b></span><span className="sw-recent-info"><strong>{item.prompt || "Untitled generation"}</strong><small>{prettyMode(item.mode)} · {item.model.includes("lite") ? "Lite" : "1.5"} · {item.settings.duration}s · {item.settings.resolution}</small><em>{formatTime(item.createdAt)} <b>·</b> {money(item.cost)}</em></span><MoveUpRight size={15} /></button>)}</div> : <div className="sw-recent-empty"><span><Film size={20} /></span><div><strong>Your next great shot starts here.</strong><small>Completed videos and resumable generations will appear here. Nothing is rendered until you approve the cost and hit Generate.</small></div></div>}
          </section>
          <footer className="sw-footer"><span>STILLWAKE / IMAGINE STUDIO</span><span>Made for scenes that stay with you.</span><a href="https://docs.x.ai/developers/model-capabilities/video" target="_blank" rel="noreferrer">Grok Imagine API <MoveUpRight size={12} /></a></footer>
        </div>
      </div>

      <input ref={openingRef} type="file" accept="image/jpeg,image/png,image/webp" className="sw-hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void useOpeningFile(file); event.target.value = ""; }} />
      <input ref={endingRef} type="file" accept="image/jpeg,image/png,image/webp" className="sw-hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void useEndingFile(file); event.target.value = ""; }} />
      <input ref={referenceRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sw-hidden" onChange={(event) => { if (event.target.files?.length) void addReferenceFiles(event.target.files); event.target.value = ""; }} />
      <input ref={keyframeRef} type="file" accept="image/jpeg,image/png,image/webp" className="sw-hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addKeyframeFile(file); event.target.value = ""; }} />
    </main>
  );
}
