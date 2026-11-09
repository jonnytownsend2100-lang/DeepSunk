import { o as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as AudioLines, E as Aperture, S as Check, T as ArrowDownToLine, _ as Frame, b as CircleCheck, c as Settings2, d as MonitorPlay, f as MicVocal, g as ImagePlus, h as Layers, i as Upload, l as Plus, m as LoaderCircle, n as X, o as Trash2, p as LockKeyhole, r as WandSparkles, s as Sparkles, t as Zap, u as MoveUpRight, v as Film, w as ArrowRight, x as ChevronDown, y as Clapperboard } from "../_libs/lucide-react.mjs";
import { a as DEFAULT_CLIP_ASPECT_RATIO, c as IMAGE_INPUT_USD, f as PRESET_VOICES, h as previewPathPrefix, i as CLIP_MODELS, m as estimateClipCost, n as CLIP_ASPECT_RATIOS, o as DEFAULT_CLIP_MODEL, p as VIDEO_USD_PER_SECOND, r as CLIP_DURATIONS, s as DEFAULT_CLIP_RESOLUTION, u as MAX_PROMPT } from "./router-D-VYi1Ba.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D6jatasJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Keep fetches on the path-based preview prefix when the host uses one. */
function apiUrl(path) {
	if (typeof window === "undefined") return path;
	const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
	return prefix ? `${prefix}${path}` : path;
}
function canvas(width, height) {
	const element = document.createElement("canvas");
	element.width = width;
	element.height = height;
	const context = element.getContext("2d", { alpha: false });
	if (!context) throw new Error("Your browser could not prepare this image.");
	return context;
}
function paintWindowStill() {
	const g = canvas(960, 540);
	const sky = g.createLinearGradient(0, 0, 0, 320);
	sky.addColorStop(0, "#f2c27a");
	sky.addColorStop(1, "#7ea8c4");
	g.fillStyle = "#c9b394";
	g.fillRect(0, 0, 960, 540);
	g.save();
	g.beginPath();
	g.rect(250, 64, 460, 286);
	g.clip();
	g.fillStyle = sky;
	g.fillRect(0, 0, 960, 540);
	g.fillStyle = "#6d8b5e";
	g.beginPath();
	g.moveTo(0, 250);
	g.quadraticCurveTo(220, 190, 460, 240);
	g.quadraticCurveTo(700, 290, 960, 200);
	g.lineTo(960, 360);
	g.lineTo(0, 360);
	g.fill();
	g.fillStyle = "#fff1d2";
	g.beginPath();
	g.arc(630, 130, 34, 0, Math.PI * 2);
	g.fill();
	g.restore();
	g.strokeStyle = "#3c2a1e";
	g.lineWidth = 16;
	g.strokeRect(250, 64, 460, 286);
	g.beginPath();
	g.moveTo(480, 64);
	g.lineTo(480, 350);
	g.moveTo(250, 207);
	g.lineTo(710, 207);
	g.stroke();
	g.fillStyle = "#6b4a32";
	g.fillRect(214, 346, 532, 20);
	g.fillStyle = "#4d3424";
	g.fillRect(292, 300, 64, 46);
	g.fillStyle = "#2f6b45";
	g.beginPath();
	g.ellipse(324, 268, 48, 26, -.5, 0, Math.PI * 2);
	g.ellipse(356, 250, 28, 16, .6, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = "#8a6b4e";
	g.fillRect(0, 430, 960, 110);
	g.fillStyle = "rgba(255, 214, 150, 0.2)";
	g.beginPath();
	g.moveTo(540, 78);
	g.lineTo(780, 430);
	g.lineTo(500, 430);
	g.closePath();
	g.fill();
	return g.canvas.toDataURL("image/jpeg", .86);
}
function paintPierStill() {
	const g = canvas(960, 540);
	const sky = g.createLinearGradient(0, 0, 0, 320);
	sky.addColorStop(0, "#1c2433");
	sky.addColorStop(.62, "#c56b45");
	sky.addColorStop(1, "#e7b07a");
	g.fillStyle = sky;
	g.fillRect(0, 0, 960, 540);
	g.fillStyle = "#f4efe4";
	g.beginPath();
	g.arc(760, 92, 22, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = "#16343f";
	g.fillRect(0, 300, 960, 240);
	g.strokeStyle = "rgba(232, 196, 150, 0.35)";
	g.lineWidth = 2;
	for (let y = 330; y < 520; y += 18) {
		g.beginPath();
		g.moveTo(0, y);
		g.quadraticCurveTo(240, y - 6, 480, y + 2);
		g.quadraticCurveTo(720, y + 8, 960, y - 2);
		g.stroke();
	}
	g.fillStyle = "#2a211c";
	g.beginPath();
	g.moveTo(80, 540);
	g.lineTo(250, 310);
	g.lineTo(700, 310);
	g.lineTo(860, 540);
	g.fill();
	g.fillStyle = "#e08a3c";
	g.beginPath();
	g.arc(470, 286, 8, 0, Math.PI * 2);
	g.fill();
	return g.canvas.toDataURL("image/jpeg", .86);
}
async function fileToStill(file) {
	if (![
		"image/jpeg",
		"image/png",
		"image/webp"
	].includes(file.type)) throw new Error("Choose a JPEG, PNG, or WebP image.");
	if (file.size > 20971520) throw new Error("That image is over 20 MB. Choose a smaller original.");
	if (!file.size) throw new Error("That image file is empty.");
	const objectUrl = URL.createObjectURL(file);
	try {
		const image = new Image();
		image.decoding = "async";
		image.src = objectUrl;
		await image.decode();
		if (!image.naturalWidth || !image.naturalHeight) throw new Error("That image has no readable dimensions.");
		if (image.naturalWidth * image.naturalHeight > 4e7) throw new Error("That image exceeds 40 megapixels. Export a smaller still and try again.");
		const originalWidth = image.naturalWidth;
		const originalHeight = image.naturalHeight;
		let maxDimension = 1440;
		let dataUrl = "";
		for (let pass = 0; pass < 4; pass += 1) {
			const scale = Math.min(1, maxDimension / Math.max(originalWidth, originalHeight));
			const width = Math.max(2, Math.round(originalWidth * scale));
			const height = Math.max(2, Math.round(originalHeight * scale));
			const g = canvas(width, height);
			g.drawImage(image, 0, 0, width, height);
			const quality = [
				.86,
				.78,
				.7,
				.62
			][pass];
			dataUrl = g.canvas.toDataURL("image/jpeg", quality);
			if (dataUrl.length <= 285e3) return {
				dataUrl,
				name: file.name || "Uploaded image",
				width: originalWidth,
				height: originalHeight,
				sourceBytes: file.size
			};
			maxDimension = Math.round(maxDimension * .82);
		}
		throw new Error("This image could not be compressed enough. Try a smaller image.");
	} catch (error) {
		if (error instanceof Error && error.message) throw error;
		throw new Error("Could not decode this image. Try a JPEG, PNG, or WebP file.");
	} finally {
		URL.revokeObjectURL(objectUrl);
	}
}
/** Center-crop the source to the chosen output frame before submitting it.
* xAI image-to-video uses the input still's aspect ratio, so cropping the image
* first is the reliable way to select landscape, portrait, or square framing.
*/
async function cropStillToAspect(dataUrl, ratio) {
	const [ratioWidth, ratioHeight] = ratio.split(":").map(Number);
	if (!ratioWidth || !ratioHeight) throw new Error("Choose a valid output aspect ratio.");
	const targetRatio = ratioWidth / ratioHeight;
	const image = new Image();
	image.decoding = "async";
	image.src = dataUrl;
	await image.decode();
	let sx = 0;
	let sy = 0;
	let sw = image.naturalWidth;
	let sh = image.naturalHeight;
	const sourceRatio = sw / sh;
	if (sourceRatio > targetRatio) {
		sw = sh * targetRatio;
		sx = (image.naturalWidth - sw) / 2;
	} else if (sourceRatio < targetRatio) {
		sh = sw / targetRatio;
		sy = (image.naturalHeight - sh) / 2;
	}
	let maxDimension = 1440;
	for (let pass = 0; pass < 4; pass += 1) {
		const scale = Math.min(1, maxDimension / Math.max(sw, sh));
		const width = Math.max(2, Math.round(sw * scale));
		const height = Math.max(2, Math.round(sh * scale));
		const g = canvas(width, height);
		g.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
		const data = g.canvas.toDataURL("image/jpeg", [
			.86,
			.78,
			.7,
			.62
		][pass]);
		if (data.length <= 285e3) return data;
		maxDimension = Math.round(maxDimension * .82);
	}
	throw new Error("The cropped image is too large to send. Choose a smaller source image.");
}
var POLL_MS = 4500;
var POLL_LIMIT = 240;
var PROMPT_PRESETS = [
	{
		label: "Cinematic",
		text: "A confident cinematic camera move with deliberate parallax, tactile atmosphere, natural motion physics, and richly controlled light. Preserve the subject's identity and the composition."
	},
	{
		label: "Action sequence",
		text: "A high-energy action shot with decisive camera movement, physically believable momentum, crisp subject readability, dynamic environmental motion, and a strong cinematic finish."
	},
	{
		label: "Luxury product",
		text: "A premium product film. Slow precision camera movement, sculpted reflections, refined highlights, subtle material detail, and an immaculate studio atmosphere. Keep the product geometry and branding stable."
	},
	{
		label: "Dreamlike",
		text: "An otherworldly cinematic moment with graceful, continuous movement, atmospheric depth, delicate particles, volumetric light, and surreal but physically coherent motion."
	}
];
function voiceLabel(voice) {
	return voice.charAt(0).toUpperCase() + voice.slice(1);
}
async function readJson(response) {
	try {
		return await response.json();
	} catch {
		return null;
	}
}
function money(value) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD"
	}).format(value);
}
function assetCount(mode, opening, ending, references, keyframes) {
	if (mode === "text") return 0;
	if (mode === "image") return Number(Boolean(opening));
	if (mode === "reference") return references.length;
	return Number(Boolean(opening)) + Number(Boolean(ending)) + references.length + keyframes.length;
}
function imageLabel(asset) {
	return asset.name.length > 22 ? `${asset.name.slice(0, 19)}…` : asset.name;
}
function prettyMode(mode) {
	return {
		text: "Text to video",
		image: "Image to video",
		reference: "Reference guided",
		director: "Director mode"
	}[mode];
}
function timestampOptions(duration, used) {
	const values = [];
	for (let tick = 1; tick < duration * 3; tick += 1) values.push(Number((tick / 3).toFixed(3)));
	return values.filter((value) => !used.some((item) => Math.abs(item - value) < 1e-4));
}
function preferredTimestamp(duration, used) {
	return [
		2,
		4,
		6,
		1,
		3,
		5,
		7,
		1 / 3,
		2 / 3,
		4 / 3,
		5 / 3
	].find((value) => value < duration && !used.some((item) => Math.abs(item - value) < 1e-4)) ?? timestampOptions(duration, used)[0] ?? 1 / 3;
}
function formatTime(date) {
	return date.toLocaleString([], {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit"
	});
}
function Studio() {
	const [status, setStatus] = (0, import_react.useState)(null);
	const [statusError, setStatusError] = (0, import_react.useState)("");
	const [mode, setMode] = (0, import_react.useState)("text");
	const [model, setModel] = (0, import_react.useState)(DEFAULT_CLIP_MODEL);
	const [prompt, setPrompt] = (0, import_react.useState)("A low camera races through a rain-slick neon boulevard as a superbike tears past. Water erupts from the tires, signs streak across the wet asphalt, and the camera swings into a dramatic pursuit. Hyperreal, high contrast, coherent motion, no cuts.");
	const [opening, setOpening] = (0, import_react.useState)(null);
	const [ending, setEnding] = (0, import_react.useState)(null);
	const [references, setReferences] = (0, import_react.useState)([]);
	const [keyframes, setKeyframes] = (0, import_react.useState)([]);
	const [voiceIds, setVoiceIds] = (0, import_react.useState)([]);
	const [duration, setDuration] = (0, import_react.useState)(8);
	const [resolution, setResolution] = (0, import_react.useState)(DEFAULT_CLIP_RESOLUTION);
	const [aspectRatio, setAspectRatio] = (0, import_react.useState)(DEFAULT_CLIP_ASPECT_RATIO);
	const [generateAudio, setGenerateAudio] = (0, import_react.useState)(true);
	const [confirmSpend, setConfirmSpend] = (0, import_react.useState)(false);
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [error, setError] = (0, import_react.useState)("");
	const [notice, setNotice] = (0, import_react.useState)("");
	const [videoUrl, setVideoUrl] = (0, import_react.useState)("");
	const [recent, setRecent] = (0, import_react.useState)([]);
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const [addingMedia, setAddingMedia] = (0, import_react.useState)(false);
	const [voiceToAdd, setVoiceToAdd] = (0, import_react.useState)("eve");
	const openingRef = (0, import_react.useRef)(null);
	const endingRef = (0, import_react.useRef)(null);
	const referenceRef = (0, import_react.useRef)(null);
	const keyframeRef = (0, import_react.useRef)(null);
	const pollTimer = (0, import_react.useRef)(null);
	const idempotencyKey = (0, import_react.useRef)("");
	const idempotencyFingerprint = (0, import_react.useRef)("");
	const imageCount = assetCount(mode, opening, ending, references, keyframes);
	const advancedMode = mode === "reference" || mode === "director" && (Boolean(ending) || references.length > 0 || keyframes.length > 0 || voiceIds.length > 0);
	const estimate = estimateClipCost(duration, resolution, model, imageCount);
	const preview = status?.preview ?? true;
	const remaining = status?.remaining ?? 0;
	const busy = phase === "starting" || phase === "rendering";
	const ready = Boolean(status?.keyReady && status.budgetReady && status.securityReady);
	const exceedsSharedBudget = Boolean(!preview && status?.budgetReady && estimate > (status?.remainingSpendUsd ?? 0));
	const sourceReady = mode === "text" ? prompt.trim().length >= 3 : mode === "image" ? Boolean(opening) : mode === "reference" ? references.length > 0 || voiceIds.length > 0 : Boolean(opening || ending || references.length || keyframes.length || voiceIds.length);
	const promptReady = prompt.trim().length >= 3 || mode !== "text" && (imageCount > 0 || voiceIds.length > 0);
	const modelReady = !advancedMode || model === "grok-imagine-video-1.5";
	const voiceAudioReady = voiceIds.length === 0 || generateAudio;
	const blocked = busy || !ready || remaining <= 0 || !sourceReady || !promptReady || !modelReady || !voiceAudioReady || !confirmSpend || exceedsSharedBudget;
	(0, import_react.useEffect)(() => {
		const controller = new AbortController();
		(async () => {
			try {
				const response = await fetch(apiUrl("/api/imagine/status"), {
					signal: controller.signal,
					cache: "no-store"
				});
				const body = await readJson(response);
				if (!response.ok || !body || typeof body.keyReady !== "boolean" || !Array.isArray(body.jobs)) {
					setStatusError("The generation service did not return a valid status response.");
					return;
				}
				setStatus(body);
				const restored = body.jobs.map((job) => ({
					id: job.id,
					token: job.token,
					url: job.videoUrl ? job.videoUrl.startsWith("/") ? apiUrl(job.videoUrl) : job.videoUrl : "",
					prompt: job.prompt || "Untitled generation",
					model: job.model,
					mode: job.mode,
					imageCount: job.imageCount,
					settings: job.settings,
					cost: job.cost,
					createdAt: new Date(job.createdAt),
					thumbnail: "",
					status: job.status,
					error: job.error
				}));
				setRecent(restored);
				const resumable = restored.find((job) => job.status === "pending" || job.status === "submitting");
				if (resumable && !controller.signal.aborted) {
					setPhase("rendering");
					setNotice("Reconnecting to your saved render. You can keep building while Grok works.");
					poll(resumable.token, 1, 0, resumable);
				}
			} catch (err) {
				if (err.name !== "AbortError") setStatusError("Can't reach the generation service. Check the Grok app environment and reload.");
			}
		})();
		return () => {
			controller.abort();
			if (pollTimer.current !== null) window.clearTimeout(pollTimer.current);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		setConfirmSpend(false);
	}, [
		mode,
		model,
		prompt,
		opening,
		ending,
		references,
		keyframes,
		voiceIds,
		duration,
		resolution,
		aspectRatio,
		generateAudio
	]);
	(0, import_react.useEffect)(() => () => {
		if (pollTimer.current !== null) window.clearTimeout(pollTimer.current);
	}, []);
	function clearMessage() {
		setError("");
		setNotice("");
	}
	function insertPromptTag(tag) {
		setPrompt((value) => `${value}${value.trim() ? " " : ""}${tag}`);
	}
	function removeIndexedPromptTag(prefix, removedIndex) {
		const pattern = new RegExp(`<${prefix}_(\\d+)>`, "g");
		setPrompt((value) => value.replace(pattern, (tag, rawIndex) => {
			const index = Number(rawIndex);
			if (index === removedIndex) return "";
			return index > removedIndex ? `<${prefix}_${index - 1}>` : tag;
		}).replace(/[ \t]{2,}/g, " ").replace(/\s+([,.!?])/g, "$1"));
	}
	function shiftImagePromptTags(delta) {
		if (delta === 1) setPrompt((value) => value.replace(/<IMAGE_(\d+)>/g, (_tag, rawIndex) => `<IMAGE_${Number(rawIndex) + 1}>`));
		else removeIndexedPromptTag("IMAGE", 0);
	}
	function removeOpeningFrame() {
		if (mode === "director" && opening) shiftImagePromptTags(-1);
		setOpening(null);
	}
	function removeReference(index) {
		removeIndexedPromptTag("IMAGE", index + (mode === "director" && opening ? 1 : 0));
		setReferences((items) => items.filter((_, itemIndex) => itemIndex !== index));
	}
	function removeVoice(index) {
		removeIndexedPromptTag("AUDIO", index);
		setVoiceIds((items) => items.filter((_, itemIndex) => itemIndex !== index));
	}
	async function prepareFile(file) {
		return await fileToStill(file);
	}
	async function useOpeningFile(file) {
		clearMessage();
		if (mode === "director" && !opening && totalDirectorImages >= 14) {
			setError(`Director mode supports 14 total image assets. Remove an asset first.`);
			return;
		}
		setAddingMedia(true);
		try {
			const asset = await prepareFile(file);
			if (mode === "director" && !opening) shiftImagePromptTags(1);
			setOpening(asset);
			setVideoUrl("");
			setPhase("idle");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not read that image.");
		} finally {
			setAddingMedia(false);
		}
	}
	async function useEndingFile(file) {
		clearMessage();
		if (!ending && mode === "director" && totalDirectorImages >= 14) {
			setError(`Director mode supports 14 total image assets. Remove an asset first.`);
			return;
		}
		setAddingMedia(true);
		try {
			promoteAdvanced();
			setEnding(await prepareFile(file));
			setVideoUrl("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not read the closing frame.");
		} finally {
			setAddingMedia(false);
		}
	}
	async function addReferenceFiles(files) {
		clearMessage();
		const incoming = Array.from(files);
		const openSlots = Math.min(14 - references.length, 14 - (mode === "director" ? Number(Boolean(opening)) + Number(Boolean(ending)) + keyframes.length + references.length : references.length));
		if (openSlots <= 0) {
			setError(`This board is full. Remove an image before adding more (maximum 14 references and 14 total images).`);
			return;
		}
		if (incoming.length > openSlots) setNotice(`Added the first ${openSlots} images; the current workflow has room for ${openSlots} more.`);
		setAddingMedia(true);
		try {
			const next = [];
			for (const file of incoming.slice(0, openSlots)) next.push(await prepareFile(file));
			promoteAdvanced();
			setReferences((items) => [...items, ...next].slice(0, 14));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not prepare one of those reference images.");
		} finally {
			setAddingMedia(false);
		}
	}
	async function addKeyframeFile(file) {
		clearMessage();
		if (keyframes.length >= 4) {
			setError(`Director mode supports up to 4 middle keyframes.`);
			return;
		}
		if (assetCount("director", opening, ending, references, keyframes) >= 14) {
			setError(`Director mode supports 14 total image assets.`);
			return;
		}
		setAddingMedia(true);
		try {
			const asset = await prepareFile(file);
			const used = keyframes.map((item) => item.timestampS);
			promoteAdvanced();
			setKeyframes((items) => [...items, {
				asset,
				timestampS: preferredTimestamp(duration, used)
			}].sort((a, b) => a.timestampS - b.timestampS));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not prepare that keyframe.");
		} finally {
			setAddingMedia(false);
		}
	}
	function useSample(name, paint, target = "opening") {
		const asset = {
			dataUrl: paint(),
			name,
			width: 960,
			height: 540,
			sourceBytes: 0
		};
		if (target === "reference") setReferences((items) => [...items, asset].slice(0, 14));
		else setOpening(asset);
		clearMessage();
		setVideoUrl("");
	}
	function promoteAdvanced() {
		setModel("grok-imagine-video-1.5");
		setResolution((value) => value === "1080p" ? "720p" : value);
	}
	function changeMode(next) {
		if (next === mode) return;
		clearMessage();
		if (/<(?:IMAGE|AUDIO)_\d+>/.test(prompt)) {
			setPrompt((value) => value.replace(/<(?:IMAGE|AUDIO)_\d+>/g, "").replace(/[ \t]{2,}/g, " ").trim());
			setNotice("Reference tags were cleared because their image or speaker slots change between creative modes.");
		}
		setMode(next);
		if (next === "reference" || next === "director" && (ending || references.length > 0 || keyframes.length > 0 || voiceIds.length > 0)) promoteAdvanced();
		setVideoUrl("");
	}
	function changeModel(next) {
		clearMessage();
		setModel(next);
		if (next === "grok-imagine-video-1.5-lite" && advancedMode) {
			setMode(opening ? "image" : "text");
			setEnding(null);
			setReferences([]);
			setKeyframes([]);
			setVoiceIds([]);
			setPrompt((value) => value.replace(/<(?:IMAGE|AUDIO)_\d+>/g, "").replace(/[ \t]{2,}/g, " ").trim());
			setNotice("Lite supports Text and Image mode. Reference, keyframe, and voice direction were cleared from this draft.");
		}
	}
	function changeDuration(next) {
		setDuration(next);
		setKeyframes((items) => {
			const used = [];
			return items.map((item) => {
				const timestampS = item.timestampS < next && !used.some((value) => Math.abs(value - item.timestampS) < 1e-4) ? item.timestampS : preferredTimestamp(next, used);
				used.push(timestampS);
				return {
					...item,
					timestampS
				};
			}).sort((a, b) => a.timestampS - b.timestampS);
		});
	}
	function addVoice() {
		if (voiceIds.length >= 3) {
			setError("Grok supports up to three preset speaker references.");
			return;
		}
		if (voiceIds.includes(voiceToAdd)) {
			setError("That voice is already assigned. Choose another preset.");
			return;
		}
		promoteAdvanced();
		setVoiceIds((items) => [...items, voiceToAdd]);
		const next = PRESET_VOICES.find((item) => !voiceIds.includes(item) && item !== voiceToAdd);
		if (next) setVoiceToAdd(next);
		clearMessage();
	}
	function schedulePoll(token, attempt, networkFailures, record) {
		if (pollTimer.current !== null) window.clearTimeout(pollTimer.current);
		const delay = networkFailures > 0 ? Math.min(45e3, POLL_MS * 2 ** Math.min(networkFailures, 4)) + Math.floor(Math.random() * 900) : POLL_MS;
		pollTimer.current = window.setTimeout(() => {
			poll(token, attempt + 1, networkFailures, record);
		}, delay);
	}
	function updateRecent(record, patch) {
		setRecent((items) => items.map((item) => item.id === record.id ? {
			...item,
			...patch
		} : item));
	}
	async function poll(token, attempt, networkFailures = 0, record) {
		if (attempt > POLL_LIMIT) {
			setPhase("idle");
			setError("Grok is still working. Your render remains saved—select it in Recent renders to resume status checks.");
			return;
		}
		try {
			const response = await fetch(apiUrl("/api/imagine/poll"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token }),
				cache: "no-store"
			});
			const body = await readJson(response);
			if (!response.ok || !body || body.ok === false) {
				const message = body && body.ok === false ? body.error : "Could not check the render.";
				if ((response.status >= 500 || response.status === 429) && networkFailures < 6) {
					schedulePoll(token, attempt, networkFailures + 1, record);
					return;
				}
				setPhase("idle");
				setError(message);
				return;
			}
			if (body.status === "done" && body.url) {
				const url = body.url.startsWith("/") ? apiUrl(body.url) : body.url;
				setVideoUrl(url);
				setPhase("done");
				setNotice(preview ? "Development clip is ready. Nothing was sent to xAI." : "Your video is ready. It is privately stored with xAI and served through your visitor session.");
				if (record) updateRecent(record, {
					status: "done",
					url,
					error: void 0
				});
				return;
			}
			if (body.status === "failed" || body.status === "expired") {
				setPhase("idle");
				setError(body.error || "The render did not complete.");
				if (record) updateRecent(record, {
					status: body.status,
					error: body.error || "The render did not complete."
				});
				return;
			}
			if (body.status === "unknown") {
				setPhase("idle");
				const message = body.error || "The request outcome is unknown. Check xAI request history before retrying.";
				setError(message);
				if (record) updateRecent(record, {
					status: "submission_unknown",
					error: message
				});
				return;
			}
			schedulePoll(token, attempt, 0, record);
		} catch {
			if (networkFailures < 6) {
				schedulePoll(token, attempt, networkFailures + 1, record);
				return;
			}
			setPhase("idle");
			setError("Lost connection while checking the render. Your job remains saved; select it below to reconnect.");
		}
	}
	async function dataUrl(asset) {
		if (!asset) return void 0;
		return cropStillToAspect(asset.dataUrl, aspectRatio);
	}
	async function generate() {
		if (blocked) return;
		clearMessage();
		setVideoUrl("");
		setPhase("starting");
		try {
			const [imageDataUrl, lastFrameDataUrl, refDataUrls, keyframeDataUrls] = await Promise.all([
				mode === "image" || mode === "director" ? dataUrl(opening) : Promise.resolve(void 0),
				mode === "director" ? dataUrl(ending) : Promise.resolve(void 0),
				mode === "reference" || mode === "director" ? Promise.all(references.map(async (item) => await dataUrl(item))) : Promise.resolve([]),
				mode === "director" ? Promise.all(keyframes.map(async (item) => ({
					imageDataUrl: await dataUrl(item.asset),
					timestampS: item.timestampS
				}))) : Promise.resolve([])
			]);
			const input = {
				mode,
				model,
				prompt: prompt.trim(),
				...imageDataUrl ? { imageDataUrl } : {},
				...lastFrameDataUrl ? { lastFrameDataUrl } : {},
				referenceImages: refDataUrls,
				keyframes: keyframeDataUrls,
				voiceIds: mode === "reference" || mode === "director" ? voiceIds : [],
				confirmSpend,
				duration,
				resolution,
				aspectRatio,
				generateAudio
			};
			const signature = JSON.stringify(input);
			const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signature));
			const signatureHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
			if (!idempotencyKey.current || idempotencyFingerprint.current !== signatureHash) {
				idempotencyKey.current = crypto.randomUUID();
				idempotencyFingerprint.current = signatureHash;
			}
			const response = await fetch(apiUrl("/api/imagine/start"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...input,
					idempotencyKey: idempotencyKey.current
				})
			});
			const body = await readJson(response);
			if (!response.ok || !body || body.ok === false) {
				setPhase("idle");
				setError(body && body.ok === false ? body.error : "Grok did not start the render.");
				const uncertainToken = body && "token" in body ? body.token : void 0;
				const uncertainJobId = uncertainToken?.split(".")[0] ?? "";
				const delta = uncertainJobId && !recent.some((item) => item.id === uncertainJobId) ? 1 : 0;
				if (body && "remaining" in body) setStatus((current) => current ? {
					...current,
					remaining: body.remaining,
					usedToday: Math.min(current.cap, current.usedToday + delta),
					globalUsedToday: current.globalUsedToday + delta,
					globalRemaining: Math.max(0, current.globalRemaining - delta),
					reservedSpendUsd: Number((current.reservedSpendUsd + delta * estimate).toFixed(2)),
					remainingSpendUsd: Number(Math.max(0, current.remainingSpendUsd - delta * estimate).toFixed(2))
				} : current);
				if (uncertainToken) {
					const uncertain = {
						id: uncertainJobId,
						token: uncertainToken,
						url: "",
						prompt: prompt.trim(),
						model,
						mode,
						imageCount,
						settings: {
							duration,
							resolution,
							aspectRatio
						},
						cost: estimate,
						createdAt: /* @__PURE__ */ new Date(),
						thumbnail: opening?.dataUrl ?? references[0]?.dataUrl ?? "",
						status: "submission_unknown",
						error: body && body.ok === false ? body.error : "The render needs review."
					};
					setRecent((items) => [uncertain, ...items.filter((item) => item.id !== uncertain.id)].slice(0, 12));
				} else if (response.status < 500) {
					idempotencyKey.current = "";
					idempotencyFingerprint.current = "";
				}
				return;
			}
			idempotencyKey.current = "";
			idempotencyFingerprint.current = "";
			const jobId = body.token.split(".")[0];
			const delta = recent.some((item) => item.id === jobId) ? 0 : 1;
			setStatus((current) => current ? {
				...current,
				remaining: body.remaining,
				usedToday: Math.min(current.cap, current.usedToday + delta),
				globalUsedToday: current.globalUsedToday + delta,
				globalRemaining: Math.max(0, current.globalRemaining - delta),
				reservedSpendUsd: Number((current.reservedSpendUsd + delta * estimate).toFixed(2)),
				remainingSpendUsd: Number(Math.max(0, current.remainingSpendUsd - delta * estimate).toFixed(2))
			} : current);
			setConfirmSpend(false);
			const record = {
				id: jobId,
				token: body.token,
				url: "",
				prompt: prompt.trim(),
				model,
				mode,
				imageCount,
				settings: {
					duration,
					resolution,
					aspectRatio
				},
				cost: estimate,
				createdAt: /* @__PURE__ */ new Date(),
				thumbnail: opening?.dataUrl ?? references[0]?.dataUrl ?? "",
				status: "pending"
			};
			setRecent((items) => [record, ...items.filter((item) => item.id !== record.id)].slice(0, 12));
			setPhase("rendering");
			setNotice(preview ? "Saved on the development server. Your xAI account was not billed." : "Grok accepted your generation. The job is saved and can resume after a refresh.");
			await poll(body.token, 1, 0, record);
		} catch (err) {
			setPhase("idle");
			setError(err instanceof Error ? err.message : "Could not prepare and submit this generation. Your draft is still here.");
		}
	}
	function openRecent(item) {
		setPrompt(item.prompt);
		setMode(item.mode);
		setModel(item.model);
		setDuration(item.settings.duration);
		setResolution(item.settings.resolution);
		setAspectRatio(item.settings.aspectRatio);
		if (item.status === "done" && item.url) {
			setVideoUrl(item.url);
			setPhase("done");
			setNotice("Showing a saved private render.");
			return;
		}
		setVideoUrl("");
		if (item.status === "pending" || item.status === "submitting") {
			setPhase("rendering");
			setNotice("Reconnecting to the saved render.");
			poll(item.token, 1, 0, item);
			return;
		}
		setPhase("idle");
		setError(item.error || "This job needs review before you submit another generation.");
	}
	const connectionLabel = statusError ? "Service unavailable" : !status ? "Connecting to Grok" : !status.keyReady ? "API key missing" : !status.securityReady ? "Session security missing" : !status.budgetReady ? "Spend protection unavailable" : status.preview ? "Dev route online" : "Engine online";
	const modelTitle = model === "grok-imagine-video-1.5" ? "Grok Imagine 1.5" : "Grok Imagine 1.5 Lite";
	const voiceCapacity = 3 - voiceIds.length;
	const totalDirectorImages = assetCount("director", opening, ending, references, keyframes);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "sw-app",
		id: "studio",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "sw-rail",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						className: "sw-brand",
						href: "#studio",
						"aria-label": "Stillwake Studio",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "sw-brand-mark",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Aperture, {
								size: 20,
								strokeWidth: 1.7
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "sw-brand-word",
							children: ["stillwake", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "IMAGINE / MOTION" })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sw-rail-label",
						children: "WORKSPACE"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "sw-nav",
						"aria-label": "Studio navigation",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							className: "sw-nav-item is-current",
							href: "#create",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 16 }),
								" Create ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "sw-nav-pulse" })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							className: "sw-nav-item",
							href: "#recent",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, { size: 16 }),
								" Your renders ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sw-nav-count",
									children: recent.length
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sw-rail-bottom",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sw-budget",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sw-budget-head",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "DAILY RENDERS" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: status ? `${status.usedToday}/${status.cap}` : "—" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "sw-budget-bar",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: `${status?.cap ? Math.min(100, status.usedToday / status.cap * 100) : 0}%` } })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: status?.budgetReady ? `${remaining} available today` : "Checking budget ledger…" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sw-budget-separator" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sw-budget-spend",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: preview ? "THIS WORKSPACE" : "SHARED SPEND LEFT" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: preview ? "$0.00" : money(status?.remainingSpendUsd ?? 0) })]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sw-private",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, { size: 13 }),
									" ",
									preview ? "Development renders stay on the server and do not bill you." : "Your API key never reaches the browser."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sw-version",
								children: [
									"STILLWAKE STUDIO ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
									" BUILD 01"
								]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sw-main",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "sw-topbar",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sw-crumb",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Workspace" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "New generation" })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sw-topbar-right",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `sw-engine-dot ${ready ? "is-live" : ""}` }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: connectionLabel }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "sw-model-indicator",
								children: modelTitle
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sw-page",
					id: "create",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "sw-hero",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "sw-overline",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), " GROK IMAGINE · CREATIVE WORKSTATION"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: ["Make the impossible ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "move." })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "From a single idea to a directed sequence. Shape the scene, set the motion, and let Grok Imagine render the moment." })
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sw-hero-stamp",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sw-stamp-ring",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Aperture, { size: 25 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"DIRECTED",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									"BY YOU"
								] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "sw-model-strip",
							"aria-label": "Model selection",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sw-model-intro",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sw-model-icon",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 17 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Choose your engine" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "The model controls your available creative tools." })] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sw-model-options",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: `sw-model-option ${model === "grok-imagine-video-1.5" ? "selected" : ""}`,
									onClick: () => changeModel("grok-imagine-video-1.5"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "sw-model-option-top",
											children: ["IMAGINE 1.5 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "DIRECTOR'S CUT" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Full model" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Reference boards · keyframes · voices · native 1080p*" })
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: `sw-model-option ${model === "grok-imagine-video-1.5-lite" ? "selected" : ""}`,
									onClick: () => changeModel("grok-imagine-video-1.5-lite"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "sw-model-option-top",
											children: ["IMAGINE 1.5 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
												className: "lite-tag",
												children: "LITE"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Fast & economical" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Text or image · 1080p output is upscaled from 720p" })
									]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "sw-mode-block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sw-section-meta",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "01 / CREATIVE MODE" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "CHOOSE HOW TO BUILD YOUR SHOT" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sw-mode-tabs",
								role: "tablist",
								"aria-label": "Generation mode",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										role: "tab",
										"aria-selected": mode === "text",
										className: mode === "text" ? "active" : "",
										onClick: () => changeMode("text"),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { size: 18 }) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Text to video" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Start with an idea" })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										role: "tab",
										"aria-selected": mode === "image",
										className: mode === "image" ? "active" : "",
										onClick: () => changeMode("image"),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { size: 18 }) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Image to video" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Bring a still to life" })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										role: "tab",
										"aria-selected": mode === "reference",
										className: mode === "reference" ? "active" : "",
										onClick: () => changeMode("reference"),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { size: 18 }) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Reference guided" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Define the visual world" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "1.5 FULL" })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										role: "tab",
										"aria-selected": mode === "director",
										className: mode === "director" ? "active" : "",
										onClick: () => changeMode("director"),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, { size: 18 }) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Director mode" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Pin the story beats" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "1.5 FULL" })
										]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sw-workbench",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "sw-stage-column",
								"aria-label": "Visual direction",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sw-panel-heading",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "sw-step",
											children: "02"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: mode === "text" ? "The scene" : mode === "image" ? "Opening frame" : mode === "reference" ? "Reference board" : "Storyboard" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: mode === "text" ? "No source media required. Build from words." : mode === "image" ? "Choose the image that becomes frame one." : mode === "reference" ? "Upload visual DNA for Grok to follow." : "Pin the opening, closing, and the moments between." })] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "sw-format-note",
											children: "JPG · PNG · WEBP"
										})]
									}),
									mode === "text" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `sw-canvas sw-text-canvas ratio-${aspectRatio.replace(":", "-")}`,
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sw-canvas-glow" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sw-canvas-grid" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-frame-index",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "FRAME 001" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "TEXT → MOTION" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-text-art",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "sw-art-kicker",
														children: "NO SOURCE. NO LIMITS."
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
														"Imagine",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "what's next." })
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "sw-art-line" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Describe the moment you want to see." })
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sw-canvas-cross sw-cross-a" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sw-canvas-cross sw-cross-b" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-canvas-bottom",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "GROK IMAGINE VIDEO 1.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "01 / 04" })]
											})
										]
									}) : null,
									mode === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `sw-media-canvas ${opening ? "has-media" : ""}`,
										style: { aspectRatio: aspectRatio.replace(":", " / ") },
										onDragOver: (event) => {
											event.preventDefault();
											setDragging(true);
										},
										onDragLeave: (event) => {
											if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
										},
										onDrop: (event) => {
											event.preventDefault();
											setDragging(false);
											const file = event.dataTransfer.files[0];
											if (file) useOpeningFile(file);
										},
										children: [opening ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: opening.dataUrl,
												alt: "Opening frame"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sw-media-vignette" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-media-top",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 12 }), " OPENING FRAME"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: removeOpeningFrame,
													"aria-label": "Remove opening frame",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 15 })
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-media-bottom",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: imageLabel(opening) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
													opening.width,
													" × ",
													opening.height,
													" · CENTER CROP TO ",
													aspectRatio
												] })]
											})
										] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "sw-upload-empty",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "sw-upload-icon",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { size: 24 })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Drop your first frame here" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "or select a still from your device" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													className: "sw-choose-button",
													onClick: () => openingRef.current?.click(),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 14 }), " Choose image"]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Up to 20 MB · optimized before upload" })
											]
										}), dragging ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "sw-drop-overlay",
											children: "RELEASE TO ADD FRAME"
										}) : null]
									}) : null,
									mode === "reference" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sw-reference-board",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-reference-board-head",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "VISUAL DNA" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													references.length,
													" / ",
													14,
													" REFERENCES"
												] })]
											}),
											references.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "sw-reference-grid",
												children: references.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "sw-reference-item",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: item.dataUrl,
															alt: `Reference ${index + 1}: ${item.name}`
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["REF ", String(index + 1).padStart(2, "0")] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "sw-ref-actions",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																type: "button",
																onClick: () => insertPromptTag(`<IMAGE_${index}>`),
																"aria-label": `Insert reference ${index + 1} prompt tag`,
																children: "TAG"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																type: "button",
																onClick: () => removeReference(index),
																"aria-label": `Remove reference ${index + 1}`,
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 13 })
															})]
														})
													]
												}, `${item.name}-${index}`))
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-reference-empty",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "sw-reference-orbit",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Aperture, { size: 35 })
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Build your visual world." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Add up to 14 images to guide style, characters, locations, materials, and continuity." })
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "sw-add-media",
												onClick: () => referenceRef.current?.click(),
												disabled: references.length >= 14 || addingMedia,
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 15 }),
													" Add reference images ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [14 - references.length, " slots"] })
												]
											})
										]
									}) : null,
									mode === "director" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sw-director-board",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-board-heading",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "SHOT SEQUENCE" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													totalDirectorImages,
													" / ",
													14,
													" MEDIA ASSETS"
												] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-storyboard",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: `sw-frame-slot ${opening ? "filled" : ""}`,
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "sw-frame-slot-label",
															children: "01 · OPEN"
														}), opening ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: opening.dataUrl,
															alt: "Opening frame"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															"aria-label": "Remove opening frame",
															onClick: removeOpeningFrame,
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 13 })
														})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
															type: "button",
															onClick: () => openingRef.current?.click(),
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 22 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Opening frame" })]
														})]
													}),
													keyframes.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "sw-frame-slot filled",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "sw-frame-slot-label",
																children: [String(index + 2).padStart(2, "0"), " · BEAT"]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																src: item.asset.dataUrl,
																alt: `Keyframe at ${item.timestampS}s`
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																type: "button",
																"aria-label": `Remove keyframe at ${item.timestampS} seconds`,
																onClick: () => setKeyframes((items) => items.filter((_, itemIndex) => itemIndex !== index)),
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 13 })
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
																"aria-label": `Keyframe ${index + 1} timestamp`,
																value: item.timestampS,
																onChange: (event) => {
																	const next = Number(event.target.value);
																	setKeyframes((items) => items.map((frame, itemIndex) => itemIndex === index ? {
																		...frame,
																		timestampS: next
																	} : frame).sort((a, b) => a.timestampS - b.timestampS));
																},
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
																	value: item.timestampS,
																	children: [item.timestampS.toFixed(2), "s"]
																}), timestampOptions(duration, keyframes.filter((_, itemIndex) => itemIndex !== index).map((frame) => frame.timestampS)).map((time) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
																	value: time,
																	children: [time.toFixed(2), "s"]
																}, time))]
															})
														]
													}, `${item.asset.name}-${index}`)),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: `sw-frame-slot ${ending ? "filled" : ""}`,
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "sw-frame-slot-label",
															children: "END · CLOSE"
														}), ending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: ending.dataUrl,
															alt: "Closing frame"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															"aria-label": "Remove closing frame",
															onClick: () => setEnding(null),
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 13 })
														})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
															type: "button",
															onClick: () => endingRef.current?.click(),
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 22 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Closing frame" })]
														})]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-sequence-actions",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: () => keyframeRef.current?.click(),
													disabled: keyframes.length >= 4 || totalDirectorImages >= 14 || addingMedia,
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }),
														" Add middle keyframe ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
															keyframes.length,
															"/",
															4
														] })
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: () => referenceRef.current?.click(),
													disabled: totalDirectorImages >= 14 || addingMedia,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { size: 14 }), " Add visual reference"]
												})]
											}),
											references.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-director-refs",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "VISUAL REFERENCES" }), references.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														src: item.dataUrl,
														alt: imageLabel(item)
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: imageLabel(item) }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														className: "sw-director-tag",
														onClick: () => insertPromptTag(`<IMAGE_${index + Number(Boolean(opening))}>`),
														"aria-label": `Insert image reference ${index + 1} prompt tag`,
														children: "TAG"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => removeReference(index),
														"aria-label": "Remove visual reference",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 12 })
													})
												] }, `${item.name}-${index}`))]
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-board-footnote",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { size: 13 }), " Keyframes snap to Grok's ⅓-second timeline. Reorder beats by changing their timestamps."]
											})
										]
									}) : null,
									mode === "image" && !opening ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sw-sample-row",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "START WITH A SAMPLE" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => useSample("Window light", paintWindowStill),
												children: ["Window light ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 13 })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => useSample("Coastal dusk", paintPierStill),
												children: ["Coastal dusk ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 13 })]
											})
										]
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sw-source-foot",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, { size: 13 }), " Images are optimized in your browser before submission."] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: mode === "text" ? "No image input charge" : `${imageCount} image input${imageCount === 1 ? "" : "s"} · ${money(imageCount * IMAGE_INPUT_USD)} input cost` })]
									}),
									mode === "director" || mode === "reference" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										className: "sw-voice-panel",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "sw-panel-heading compact",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "sw-step",
												children: "03"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Speaker direction" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Assign preset voices to speaker tags in your prompt." })] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "sw-format-note",
												children: [voiceIds.length, "/3 VOICES"]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "sw-voice-content",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "sw-voice-explainer",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioLines, { size: 17 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
														"Use ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "<AUDIO_0>" }),
														", ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "<AUDIO_1>" }),
														" and ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "<AUDIO_2>" }),
														" in your prompt to direct each speaker."
													] })]
												}),
												voiceIds.map((voice, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "sw-voice-assignment",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "sw-voice-index",
															children: ["AUDIO_", index]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "sw-voice-name",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MicVocal, { size: 14 }), voiceLabel(voice)]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															className: "sw-insert-voice",
															onClick: () => setPrompt((value) => `${value}${value.trim() ? " " : ""}<AUDIO_${index}>`),
															children: "Insert tag"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: () => removeVoice(index),
															"aria-label": `Remove voice ${voice}`,
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 13 })
														})
													]
												}, voice)),
												voiceCapacity > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "sw-add-voice",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
														className: "sw-select-wrap",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "sr-only",
																children: "Preset voice"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
																value: voiceToAdd,
																onChange: (event) => setVoiceToAdd(event.target.value),
																children: PRESET_VOICES.filter((voice) => !voiceIds.includes(voice)).map((voice) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																	value: voice,
																	children: voiceLabel(voice)
																}, voice))
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 14 })
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														onClick: addVoice,
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), " Add speaker"]
													})]
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", {
													className: "sw-voice-limit",
													children: "All three Grok preset speaker slots are assigned."
												})
											]
										})]
									}) : null,
									videoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										className: "sw-output-panel",
										id: "output",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-panel-heading",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "sw-step",
													children: "04"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Rendered moment" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: preview ? "Local stand-in so you can test playback. Real Imagine video runs after you publish." : "Your latest creation, privately stored." })] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "sw-ready-tag",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 13 }), " READY"]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
												src: videoUrl,
												controls: true,
												playsInline: true,
												className: "sw-output-video"
											}, videoUrl),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-output-actions",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
													href: videoUrl,
													download: "stillwake-render.mp4",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownToLine, { size: 15 }), " Download MP4"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: preview ? "DEVELOPMENT CLIP · NOT BILLED" : "PRIVATE FILE · 30-DAY RETENTION" })]
											})
										]
									}) : null
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
								className: "sw-control-column",
								"aria-label": "Generation controls",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sw-panel-heading",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "sw-step",
											children: mode === "text" || mode === "image" ? "03" : "04"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Direct the motion" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Tell Grok exactly what happens next." })] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, {
											size: 17,
											className: "sw-heading-icon"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sw-control-card",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												htmlFor: "sw-prompt",
												className: "sw-field-label",
												children: ["CREATIVE DIRECTION ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													prompt.length,
													"/",
													MAX_PROMPT
												] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
												id: "sw-prompt",
												className: "sw-prompt",
												value: prompt,
												onChange: (event) => setPrompt(event.target.value),
												maxLength: MAX_PROMPT,
												placeholder: "A helicopter dives between skyscrapers as the camera swings into a breathtaking aerial pursuit…",
												rows: 8
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-prompt-guidance",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 13 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Describe the action, camera movement, atmosphere, and what must remain consistent." })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "sw-prompt-presets",
												children: PROMPT_PRESETS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													className: prompt === item.text ? "selected" : "",
													onClick: () => setPrompt(item.text),
													children: item.label
												}, item.label))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sw-control-divider" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-control-head",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "OUTPUT FORMAT" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Fine-tune the final frame" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-setting-pair",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
														className: "sw-setting",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "DURATION" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "sw-select-wrap",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
																value: duration,
																onChange: (event) => changeDuration(Number(event.target.value)),
																children: CLIP_DURATIONS.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
																	value,
																	children: [value, " seconds"]
																}, value))
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 14 })]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
														className: "sw-setting",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ASPECT RATIO" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "sw-select-wrap",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
																value: aspectRatio,
																onChange: (event) => setAspectRatio(event.target.value),
																children: CLIP_ASPECT_RATIOS.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
																	value,
																	children: [
																		value,
																		" ",
																		value === "16:9" ? "· Wide" : value === "9:16" ? "· Vertical" : value === "21:9" ? "· Cinema" : ""
																	]
																}, value))
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 14 })]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
														className: "sw-setting",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "RESOLUTION" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "sw-select-wrap",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
																value: resolution,
																onChange: (event) => setResolution(event.target.value),
																children: (advancedMode ? ["480p", "720p"] : CLIP_MODELS.includes(model) ? [
																	"480p",
																	"720p",
																	"1080p"
																] : ["480p", "720p"]).map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
																	value,
																	children: [value, value === "1080p" && model === "grok-imagine-video-1.5-lite" ? " · Upscaled" : ""]
																}, value))
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 14 })]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "sw-setting",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "GENERATED AUDIO" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
															type: "button",
															className: `sw-audio-switch ${generateAudio ? "on" : ""}`,
															role: "switch",
															"aria-checked": generateAudio,
															onClick: () => setGenerateAudio((value) => !value),
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: generateAudio ? "ON" : "OFF" })]
														})]
													})
												]
											}),
											advancedMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-capability-note",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 13 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Reference workflows use full Imagine 1.5 and are currently capped at 720p. Switch to Text or Image for native 1080p output." })]
											}) : model === "grok-imagine-video-1.5-lite" && resolution === "1080p" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-capability-note",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 13 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Lite's 1080p option is upscaled from its 720p generation." })]
											}) : null,
											voiceIds.length > 0 && !generateAudio ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-capability-note",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioLines, { size: 13 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Preset speaker direction requires generated audio. Turn audio back on or remove the speaker assignments." })]
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-cost-card",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "sw-cost-top",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: preview ? "DEVELOPMENT RENDER" : "ESTIMATED API COST" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "sw-live-dot" }),
															" ",
															preview ? "NOT BILLED" : "LIVE"
														] })]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "sw-cost-number",
														children: [money(preview ? 0 : estimate), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: " / render" })]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "sw-cost-line",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
															duration,
															"s × ",
															money(VIDEO_USD_PER_SECOND[model][resolution]),
															"/sec"
														] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: preview ? "$0.00" : money(duration * VIDEO_USD_PER_SECOND[model][resolution]) })]
													}),
													imageCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "sw-cost-line",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
															imageCount,
															" image inputs × ",
															money(IMAGE_INPUT_USD)
														] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: preview ? "$0.00" : money(imageCount * IMAGE_INPUT_USD) })]
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "sw-cost-line",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Image inputs" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "$0.00" })]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "sw-cost-foot",
														children: preview ? `Published rate would be ${money(estimate)}. This workspace calls only its own server routes.` : `${model === "grok-imagine-video-1.5" ? "Full Imagine 1.5 rates" : "Imagine 1.5 Lite rates"} · Published xAI pricing. Actual usage may vary.`
													}),
													exceedsSharedBudget ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "sw-budget-alert",
														role: "status",
														children: [
															"This render exceeds the remaining shared budget of ",
															money(status?.remainingSpendUsd ?? 0),
															". Lower the settings or try after the UTC reset."
														]
													}) : null
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "sw-confirm",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "checkbox",
														checked: confirmSpend,
														onChange: (event) => setConfirmSpend(event.target.checked)
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 12 }) }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["I approve this development render. ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "It does not call xAI or bill my account." })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
														"I approve an estimated charge of ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money(estimate) }),
														" for this render."
													] }) })
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "sw-generate",
												onClick: () => void generate(),
												disabled: blocked,
												children: [
													busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
														size: 18,
														className: "sw-spin"
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 18 }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: phase === "starting" ? "Preparing your scene…" : phase === "rendering" ? preview ? "Finishing locally…" : "Grok is creating…" : phase === "done" ? "Create another video" : "Generate video" }),
													!busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
														money(preview ? 0 : estimate),
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 15 })
													] }) : null
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-service-line",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: ready ? "online" : "" }), statusError || (ready ? preview ? `${remaining} development renders left today · $0 billed` : `${remaining} of ${status?.cap} personal renders left · ${money(status?.remainingSpendUsd ?? 0)} shared budget` : !status ? "Connecting to secure generation service…" : !status.keyReady ? "XAI_API_KEY is missing in the server environment." : !status.securityReady ? "Configure STILLWAKE_SESSION_SECRET (32+ characters)." : "Shared PostgreSQL spend ledger unavailable.")]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sw-privacy-foot",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, { size: 12 }),
													" ",
													preview ? "Development mode uses server routes only. Nothing is sent to the billed xAI API." : `Visitor limit: ${status?.cap ?? 5}/day · Global spend cap: ${money(status?.spendCapUsd ?? 0)}/day.`
												]
											})
										]
									}),
									error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sw-message error",
										role: "alert",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 15 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error })]
									}) : null,
									notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sw-message notice",
										role: "status",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 15 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: notice })]
									}) : null,
									busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "sw-progress-card",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "sw-progress-icon",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { size: 20 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: phase === "starting" ? "Preparing your generation" : "Your scene is rendering" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Grok is building the sequence. Your saved job can be resumed if you leave this page." })] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "LIVE" })
										]
									}) : null
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "sw-recent-section",
							id: "recent",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sw-recent-heading",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "05 / YOUR WORK" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: ["Recent renders", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "." })] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: recent.length ? `${recent.length} saved jobs` : "YOUR GENERATION HISTORY" })]
							}), recent.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "sw-recent-grid",
								children: recent.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "sw-recent-card",
									onClick: () => openRecent(item),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "sw-recent-thumb",
											children: [
												item.thumbnail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: item.thumbnail,
													alt: ""
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "sw-recent-placeholder",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, { size: 24 })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorPlay, { size: 16 }) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
													className: `sw-job-state state-${item.status}`,
													children: item.status === "done" ? "READY" : item.status === "pending" || item.status === "submitting" ? "RENDERING" : item.status === "submission_unknown" ? "REVIEW" : item.status.toUpperCase()
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "sw-recent-info",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.prompt || "Untitled generation" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
													prettyMode(item.mode),
													" · ",
													item.model.includes("lite") ? "Lite" : "1.5",
													" · ",
													item.settings.duration,
													"s · ",
													item.settings.resolution
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
													formatTime(item.createdAt),
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "·" }),
													" ",
													money(item.cost)
												] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveUpRight, { size: 15 })
									]
								}, item.id))
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sw-recent-empty",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, { size: 20 }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Your next great shot starts here." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Completed videos and resumable generations will appear here. Nothing is rendered until you approve the cost and hit Generate." })] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
							className: "sw-footer",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "STILLWAKE / IMAGINE STUDIO" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Made for scenes that stay with you." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: "https://docs.x.ai/developers/model-capabilities/video",
									target: "_blank",
									rel: "noreferrer",
									children: ["Grok Imagine API ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveUpRight, { size: 12 })]
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: openingRef,
				type: "file",
				accept: "image/jpeg,image/png,image/webp",
				className: "sw-hidden",
				onChange: (event) => {
					const file = event.target.files?.[0];
					if (file) useOpeningFile(file);
					event.target.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: endingRef,
				type: "file",
				accept: "image/jpeg,image/png,image/webp",
				className: "sw-hidden",
				onChange: (event) => {
					const file = event.target.files?.[0];
					if (file) useEndingFile(file);
					event.target.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: referenceRef,
				type: "file",
				accept: "image/jpeg,image/png,image/webp",
				multiple: true,
				className: "sw-hidden",
				onChange: (event) => {
					if (event.target.files?.length) addReferenceFiles(event.target.files);
					event.target.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: keyframeRef,
				type: "file",
				accept: "image/jpeg,image/png,image/webp",
				className: "sw-hidden",
				onChange: (event) => {
					const file = event.target.files?.[0];
					if (file) addKeyframeFile(file);
					event.target.value = "";
				}
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, {});
}
//#endregion
export { Home as component };
