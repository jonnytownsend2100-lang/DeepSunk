import { o as __toESM } from "../_runtime.mjs";
import { K as require_react, _ as createFileRoute, b as require_jsx_runtime, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, v as createRootRoute, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { Buffer as Buffer$1 } from "node:buffer";
//#region node_modules/.nitro/vite/services/ssr/assets/router-D-VYi1Ba.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* Path-based preview hosts serve the dev server under `/{port_id}/` and strip
* that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
* prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
* client routing and generated links aligned with the public URL.
*/
var PATH_BASED_PREVIEW_HOSTS = /* @__PURE__ */ new Set([
	"preview.grok.genai.mil",
	"preview.grok.mil",
	"preview.grokgsac.com"
]);
var PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;
function previewPathPrefix(hostname, pathname) {
	if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return void 0;
	return PORT_ID_PREFIX.exec(pathname)?.[0];
}
function prefixRewrite(prefix) {
	return {
		input: ({ url }) => {
			if (url.pathname === prefix) url.pathname = "/";
			else if (url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = `${prefix}${url.pathname}`;
			return url;
		}
	};
}
function previewPathRewrite() {
	if (typeof window === "undefined") return void 0;
	const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
	return prefix ? prefixRewrite(prefix) : void 0;
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-muQtZ9oG.css";
var APP_NAME = "Stillwake Studio";
var Route$5 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "A cinematic Grok Imagine workstation for text-to-video, image-to-video, reference direction, and frame-by-frame story control."
			},
			{
				name: "theme-color",
				content: "#0a0d0a"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-ink font-sans text-paper antialiased",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
var $$splitComponentImporter = () => import("./routes-D6jatasJ.mjs");
var Route$4 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
function env(key) {
	return process.env[key]?.trim() || void 0;
}
/**
* Workspace preview vs deployed app. The deployer writes GROK_PROJECT_ID on
* every publish; the sandbox preview never has it. Single source of truth for
* the split — gate audience, gate endpoints and connector-token semantics all
* key off this predicate.
*/
function isWorkspacePreview() {
	return !env("GROK_PROJECT_ID");
}
var _0002_imagine_daily_budget_default = "-- Shared, non-personal spend counter for image-to-video generations.\n-- One row per UTC day; an atomic UPSERT reserves each generation slot.\nCREATE TABLE IF NOT EXISTS imagine_daily_budget (\n  bucket TEXT PRIMARY KEY,\n  used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\n";
var _0003_imagine_jobs_and_limits_default = "-- Durable anonymous visitor quotas, short-window abuse controls, and a job ledger.\n-- Prompts are encrypted by the application before storage. Uploaded source images\n-- are never persisted. The global daily budget remains the final spend backstop.\n\nALTER TABLE imagine_daily_budget\n  ADD COLUMN IF NOT EXISTS reserved_usd NUMERIC(12, 2) NOT NULL DEFAULT 0;\n\nCREATE TABLE IF NOT EXISTS imagine_visitor_daily_usage (\n  bucket TEXT NOT NULL,\n  visitor_hash TEXT NOT NULL,\n  used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  PRIMARY KEY (bucket, visitor_hash)\n);\n\nCREATE TABLE IF NOT EXISTS imagine_rate_limits (\n  window_key TEXT NOT NULL,\n  scope TEXT NOT NULL,\n  subject_hash TEXT NOT NULL,\n  used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  PRIMARY KEY (window_key, scope, subject_hash)\n);\n\nCREATE TABLE IF NOT EXISTS imagine_jobs (\n  id TEXT PRIMARY KEY,\n  visitor_hash TEXT NOT NULL,\n  daily_bucket TEXT NOT NULL,\n  upstream_request_id TEXT UNIQUE,\n  status TEXT NOT NULL CHECK (status IN ('submitting', 'submission_unknown', 'pending', 'done', 'failed', 'expired')),\n  prompt_ciphertext TEXT NOT NULL,\n  model TEXT NOT NULL,\n  duration INTEGER NOT NULL CHECK (duration BETWEEN 1 AND 15),\n  resolution TEXT NOT NULL CHECK (resolution IN ('480p', '720p', '1080p')),\n  aspect_ratio TEXT NOT NULL,\n  generate_audio BOOLEAN NOT NULL DEFAULT TRUE,\n  estimated_cost NUMERIC(12, 2) NOT NULL CHECK (estimated_cost >= 0),\n  video_url TEXT,\n  error_code TEXT,\n  error_message TEXT,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  completed_at TIMESTAMPTZ\n);\n\nCREATE INDEX IF NOT EXISTS imagine_jobs_owner_created_idx\n  ON imagine_jobs (visitor_hash, created_at DESC);\nCREATE INDEX IF NOT EXISTS imagine_jobs_status_updated_idx\n  ON imagine_jobs (status, updated_at);\n\nCREATE INDEX IF NOT EXISTS imagine_rate_limits_updated_idx\n  ON imagine_rate_limits (updated_at);\nCREATE INDEX IF NOT EXISTS imagine_visitor_usage_bucket_idx\n  ON imagine_visitor_daily_usage (bucket);\nCREATE INDEX IF NOT EXISTS imagine_budget_bucket_idx\n  ON imagine_daily_budget (bucket);\n";
var _0004_imagine_idempotency_default = "-- Client retries must never create a second paid xAI generation for the same intent.\n-- A visitor may reuse an idempotency key only with the exact same request payload.\nALTER TABLE imagine_jobs\n  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,\n  ADD COLUMN IF NOT EXISTS request_fingerprint TEXT;\n\nCREATE UNIQUE INDEX IF NOT EXISTS imagine_jobs_owner_idempotency_idx\n  ON imagine_jobs (visitor_hash, idempotency_key)\n  WHERE idempotency_key IS NOT NULL;\n";
var _0005_imagine_private_files_and_token_buckets_default = "-- Persist generated MP4s privately in xAI Files API and smooth provider polling.\n-- xai_file_id is only ever read through an owner-checked application endpoint.\nALTER TABLE imagine_jobs\n  ADD COLUMN IF NOT EXISTS xai_file_id TEXT;\n\nCREATE INDEX IF NOT EXISTS imagine_jobs_file_id_idx\n  ON imagine_jobs (xai_file_id)\n  WHERE xai_file_id IS NOT NULL;\n\n-- Token bucket rows are updated atomically with one UPSERT. Unlike fixed\n-- wall-clock windows, capacity + refill rate limits bursts across boundaries.\nCREATE TABLE IF NOT EXISTS imagine_token_buckets (\n  bucket_key TEXT PRIMARY KEY,\n  tokens DOUBLE PRECISION NOT NULL CHECK (tokens >= 0),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\n\nCREATE INDEX IF NOT EXISTS imagine_token_buckets_updated_idx\n  ON imagine_token_buckets (updated_at);\n";
var _0006_imagine_generation_modes_default = "-- Persist the exact Grok Imagine workflow and number of billable image inputs.\n-- Rows created before multi-mode generation are classified as image-to-video.\nALTER TABLE imagine_jobs\n  ADD COLUMN IF NOT EXISTS generation_mode TEXT NOT NULL DEFAULT 'image';\n\nALTER TABLE imagine_jobs\n  ADD COLUMN IF NOT EXISTS image_input_count INTEGER NOT NULL DEFAULT 1\n  CHECK (image_input_count BETWEEN 0 AND 14);\n\nCREATE INDEX IF NOT EXISTS imagine_jobs_mode_created_idx\n  ON imagine_jobs (generation_mode, created_at DESC);\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef$1 = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run, transactionRunner) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	sql.transaction = async (work) => {
		if (!transactionRunner) throw new Error("Nested SQL transactions are not supported.");
		return transactionRunner((txRun) => work(toSql(txRun)));
	};
	return sql;
}
function createNeonSql() {
	globalRef$1.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({
			connectionString: databaseUrl,
			max: 2,
			idleTimeoutMillis: 1e4,
			connectionTimeoutMillis: 5e3,
			query_timeout: 12e3,
			statement_timeout: 1e4,
			keepAlive: true,
			allowExitOnIdle: true
		});
		pool.on("error", (error) => {
			console.error("[db] idle PostgreSQL client error:", error.message);
		});
		const run = async (text, params) => {
			return (await pool.query(text, params)).rows;
		};
		return toSql(run, async (work) => {
			const client = await pool.connect();
			try {
				await client.query("BEGIN");
				const result = await work(async (text, params) => {
					return (await client.query(text, params)).rows;
				});
				await client.query("COMMIT");
				return result;
			} catch (error) {
				try {
					await client.query("ROLLBACK");
				} catch {}
				throw error;
			} finally {
				client.release();
			}
		});
	})().catch((err) => {
		globalRef$1.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef$1.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef$1.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef$1.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef$1.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({
			"/migrations/0002_imagine_daily_budget.sql": _0002_imagine_daily_budget_default,
			"/migrations/0003_imagine_jobs_and_limits.sql": _0003_imagine_jobs_and_limits_default,
			"/migrations/0004_imagine_idempotency.sql": _0004_imagine_idempotency_default,
			"/migrations/0005_imagine_private_files_and_token_buckets.sql": _0005_imagine_private_files_and_token_buckets_default,
			"/migrations/0006_imagine_generation_modes.sql": _0006_imagine_generation_modes_default
		});
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef$1.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef$1.__pgliteMigrateChain__ = pass;
	await pass;
	const run = async (text, params) => {
		return (await pg.query(text, params)).rows;
	};
	return toSql(run, async (work) => pg.transaction(async (tx) => work(async (text, params) => {
		return (await tx.query(text, params)).rows;
	})));
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
/** Billing split: workspace preview never spends the owner's xAI key. */
var DEV_STANDIN_FILE_ID = "file_devlocalstudio";
/** True only on a published app. Preview keeps generation on internal routes. */
function liveXaiBillingEnabled(workspacePreview) {
	return workspacePreview === false;
}
function developmentRequestId(jobId) {
	return `dev-${jobId.replace(/-/g, "")}`.slice(0, 40);
}
function isDevelopmentRequestId(id) {
	return typeof id === "string" && /^dev-[a-f0-9]{8,36}$/i.test(id);
}
/** Bind an idempotency key to every paid model setting and every source asset. */
function fingerprintGenerationIntent(intent) {
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
		keyframeTimestamps: intent.keyframes.map((frame) => frame.timestampS)
	};
	digest.update(JSON.stringify(stable));
	for (const asset of [
		intent.imageDataUrl ?? "",
		intent.lastFrameDataUrl ?? "",
		...intent.referenceImages,
		...intent.keyframes.map((frame) => frame.imageDataUrl)
	]) {
		digest.update("\0");
		digest.update(createHash("sha256").update(asset).digest());
	}
	return digest.digest("hex");
}
/** Official Grok Imagine Video model catalog and conservative spend guard. */
var CLIP_MODELS = ["grok-imagine-video-1.5-lite", "grok-imagine-video-1.5"];
var DEFAULT_CLIP_MODEL = "grok-imagine-video-1.5";
var GENERATION_MODES = [
	"text",
	"image",
	"reference",
	"director"
];
var CLIP_DURATIONS = [
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15
];
var CLIP_RESOLUTIONS = [
	"480p",
	"720p",
	"1080p"
];
var CLIP_ASPECT_RATIOS = [
	"1:1",
	"16:9",
	"9:16",
	"4:3",
	"3:4",
	"3:2",
	"2:3",
	"21:9",
	"5:2"
];
var DEFAULT_CLIP_RESOLUTION = "1080p";
var DEFAULT_CLIP_ASPECT_RATIO = "16:9";
var IMAGE_INPUT_USD = .01;
var VIDEO_USD_PER_SECOND = {
	"grok-imagine-video-1.5-lite": {
		"480p": .02,
		"720p": .03,
		"1080p": .14
	},
	"grok-imagine-video-1.5": {
		"480p": .08,
		"720p": .14,
		"1080p": .25
	}
};
/** Preset xAI TTS voices accepted by reference-to-video. */
var PRESET_VOICES = [
	"carina",
	"zagan",
	"helix",
	"orion",
	"luna",
	"iris",
	"altair",
	"zenith",
	"perseus",
	"helios",
	"lux",
	"kepler",
	"rigel",
	"cosmo",
	"celeste",
	"ursa",
	"sirius",
	"lumen",
	"castor",
	"naksh",
	"atlas",
	"aurora",
	"liora",
	"ara",
	"eve",
	"leo",
	"rex",
	"sal"
];
var PREVIEW_SPEND_CAP_USD = 2.5;
var MAX_PROMPT = 1200;
var MAX_REQUEST_BODY_BYTES = 42e5;
function estimateClipCost(duration, resolution, model = DEFAULT_CLIP_MODEL, imageInputCount = 0) {
	return Number((Math.max(0, Math.min(14, Math.floor(imageInputCount))) * IMAGE_INPUT_USD + duration * VIDEO_USD_PER_SECOND[model][resolution]).toFixed(2));
}
/** Strict image data-URI validation for the public generation endpoint. */
var DATA_URL = /^data:image\/(jpeg|png|webp);base64,([a-z0-9+/]+={0,2})$/i;
var PNG_SIGNATURE = Buffer$1.from([
	137,
	80,
	78,
	71,
	13,
	10,
	26,
	10
]);
var MAX_PIXELS = 4e7;
var MAX_DIMENSION = 16384;
function validDimensions(width, height) {
	return Number.isSafeInteger(width) && Number.isSafeInteger(height) && width >= 2 && height >= 2 && width <= MAX_DIMENSION && height <= MAX_DIMENSION && width * height <= MAX_PIXELS;
}
function jpegDimensions(bytes) {
	if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) return null;
	let offset = 2;
	const sof = /* @__PURE__ */ new Set([
		192,
		193,
		194,
		195,
		197,
		198,
		199,
		201,
		202,
		203,
		205,
		206,
		207
	]);
	while (offset + 4 <= bytes.length) {
		if (bytes[offset] !== 255) {
			offset += 1;
			continue;
		}
		while (offset < bytes.length && bytes[offset] === 255) offset += 1;
		if (offset >= bytes.length) return null;
		const marker = bytes[offset++];
		if (marker === 216 || marker === 217 || marker >= 208 && marker <= 215 || marker === 1) continue;
		if (offset + 2 > bytes.length) return null;
		const segmentLength = bytes.readUInt16BE(offset);
		if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;
		if (sof.has(marker)) {
			if (segmentLength < 7) return null;
			const height = bytes.readUInt16BE(offset + 3);
			const width = bytes.readUInt16BE(offset + 5);
			return validDimensions(width, height) ? {
				width,
				height
			} : null;
		}
		offset += segmentLength;
	}
	return null;
}
function pngDimensions(bytes) {
	if (bytes.length < 33 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE) || bytes.toString("ascii", 12, 16) !== "IHDR") return null;
	if (bytes.readUInt32BE(8) !== 13) return null;
	const width = bytes.readUInt32BE(16);
	const height = bytes.readUInt32BE(20);
	return validDimensions(width, height) ? {
		width,
		height
	} : null;
}
function webpDimensions(bytes) {
	if (bytes.length < 25 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") return null;
	if (bytes.readUInt32LE(4) + 8 > bytes.length) return null;
	const kind = bytes.toString("ascii", 12, 16);
	let width = 0;
	let height = 0;
	if (kind === "VP8X" && bytes.length >= 30) {
		width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
		height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
	} else if (kind === "VP8 " && bytes.length >= 30 && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) {
		width = bytes.readUInt16LE(26) & 16383;
		height = bytes.readUInt16LE(28) & 16383;
	} else if (kind === "VP8L" && bytes.length >= 25 && bytes[20] === 47) {
		const b1 = bytes[21], b2 = bytes[22], b3 = bytes[23], b4 = bytes[24];
		width = 1 + b1 + ((b2 & 63) << 8);
		height = 1 + ((b2 & 192) >> 6) + (b3 << 2) + ((b4 & 15) << 10);
	} else return null;
	return validDimensions(width, height) ? {
		width,
		height
	} : null;
}
/** Returns decoded container dimensions, rejecting malformed or oversized headers. */
function inspectImageDataUrl(value, maxCharacters) {
	if (typeof value !== "string" || value.length > maxCharacters) return null;
	const match = DATA_URL.exec(value);
	if (!match || match[2].length % 4 !== 0) return null;
	const bytes = Buffer$1.from(match[2], "base64");
	if (!bytes.length || bytes.toString("base64") !== match[2]) return null;
	const mime = match[1].toLowerCase();
	const dimensions = mime === "jpeg" ? jpegDimensions(bytes) : mime === "png" ? pngDimensions(bytes) : webpDimensions(bytes);
	if (!dimensions) return null;
	return {
		mime,
		...dimensions,
		bytes: bytes.length
	};
}
function validImageDataUrl(value, maxCharacters) {
	return inspectImageDataUrl(value, maxCharacters) !== null;
}
function imageAssetCount(input) {
	return Number(Boolean(input.imageDataUrl)) + Number(Boolean(input.lastFrameDataUrl)) + input.referenceImages.length + input.keyframes.length;
}
function validateGenerationInput(input) {
	if (!GENERATION_MODES.includes(input.mode)) return "Choose a valid generation mode.";
	if (!CLIP_MODELS.includes(input.model)) return "Choose a valid Grok Imagine model.";
	if (!CLIP_DURATIONS.includes(input.duration)) return "Choose a duration from 1 to 15 seconds.";
	if (!CLIP_RESOLUTIONS.includes(input.resolution)) return "Choose a supported resolution.";
	if (!CLIP_ASPECT_RATIOS.includes(input.aspectRatio)) return "Choose a supported aspect ratio.";
	if (typeof input.generateAudio !== "boolean") return "Audio must be enabled or disabled.";
	if (typeof input.confirmSpend !== "boolean") return "Confirm the estimated charge before generating.";
	if (input.prompt.length > 1200) return `Keep the creative direction under ${MAX_PROMPT} characters.`;
	if (input.prompt.length < 3 && imageAssetCount(input) === 0 && input.voiceIds.length === 0) return "A creative direction is required unless visual or voice references are supplied.";
	if (input.referenceImages.length > 14) return `Use up to 14 reference images.`;
	if (input.keyframes.length > 4) return `Use up to 4 middle keyframes.`;
	if (input.voiceIds.length > 3) return "Use up to three voice references.";
	if (input.voiceIds.some((voice) => !PRESET_VOICES.includes(voice))) return "Choose a supported preset voice.";
	const count = imageAssetCount(input);
	if (count > 14) return `Use up to 14 total images across references and pinned frames.`;
	if ([
		input.imageDataUrl,
		input.lastFrameDataUrl,
		...input.referenceImages,
		...input.keyframes.map((item) => item.imageDataUrl)
	].filter(Boolean).some((image) => !validImageDataUrl(image, 285e3))) return "One or more images are invalid or too large. Re-add the affected image.";
	const advanced = input.mode === "reference" || input.referenceImages.length > 0 || input.lastFrameDataUrl !== void 0 || input.keyframes.length > 0 || input.voiceIds.length > 0;
	if (advanced && input.model !== "grok-imagine-video-1.5") return "Reference direction, voices, and pinned frames require Grok Imagine Video 1.5.";
	if (input.voiceIds.length > 0 && !input.generateAudio) return "Enable generated audio to use preset speaker references.";
	if (input.mode === "text" && (count > 0 || input.voiceIds.length > 0)) return "Text-to-video cannot include image or speaker references. Switch to Reference or Director mode.";
	if (input.mode === "image" && (!input.imageDataUrl || input.lastFrameDataUrl || input.referenceImages.length || input.keyframes.length || input.voiceIds.length)) return "Image-to-video needs exactly one opening image. Use Director mode for additional references or frames.";
	if (input.mode === "reference" && (input.imageDataUrl || input.lastFrameDataUrl || input.keyframes.length)) return "Reference mode accepts a visual reference board and speaker voices. Use Director mode for pinned frames.";
	if (input.mode === "reference" && !input.referenceImages.length && !input.voiceIds.length) return "Add at least one visual reference or speaker voice.";
	if (input.mode === "director" && count === 0 && input.voiceIds.length === 0) return "Director mode needs a first frame, last frame, keyframe, visual reference, or voice.";
	if (input.referenceImages.length && input.model !== "grok-imagine-video-1.5") return "Reference images require the full 1.5 model.";
	if (advanced && input.resolution === "1080p") return "Reference-guided generation is limited to 720p. Choose 720p or switch to Text/Image mode for native 1080p.";
	const slots = /* @__PURE__ */ new Set();
	for (const frame of input.keyframes) {
		const slot = Math.round(frame.timestampS * 3);
		if (!Number.isFinite(frame.timestampS) || slot <= 0 || frame.timestampS >= input.duration || Math.abs(frame.timestampS * 3 - slot) > 1e-5) return "Keyframe times must fall inside the clip on Grok's ⅓-second timing grid.";
		if (slots.has(slot)) return "Each keyframe needs a unique timestamp at least ⅓ second apart.";
		slots.add(slot);
	}
	if (!input.confirmSpend) return "Confirm the estimated charge before generating.";
	return null;
}
function buildXaiVideoPayload(input, jobId) {
	const payload = {
		model: input.model,
		duration: input.duration,
		aspect_ratio: input.aspectRatio,
		resolution: input.resolution,
		generate_audio: input.generateAudio,
		storage_options: {
			filename: `stillwake-${jobId}.mp4`,
			expires_after: 2592e3
		}
	};
	if (input.prompt.trim()) payload.prompt = input.prompt.trim();
	if (input.imageDataUrl) payload.image = { url: input.imageDataUrl };
	if (input.lastFrameDataUrl) payload.last_frame = { url: input.lastFrameDataUrl };
	if (input.referenceImages.length) payload.reference_images = input.referenceImages.map((url) => ({ url }));
	if (input.keyframes.length) payload.keyframes = input.keyframes.map((frame) => ({
		image: { url: frame.imageDataUrl },
		timestamp_s: frame.timestampS
	}));
	if (input.voiceIds.length) payload.reference_audios = input.voiceIds.map((voice_id) => ({ voice_id }));
	return payload;
}
async function consumeTokenBucket(sql, { key, capacity, refillPerSecond, cost = 1 }) {
	if (!key || key.length > 256 || !Number.isFinite(capacity) || capacity <= 0 || !Number.isFinite(refillPerSecond) || refillPerSecond <= 0 || !Number.isFinite(cost) || cost <= 0 || cost > capacity) throw new Error("Invalid token bucket configuration.");
	return (await sql.query(`INSERT INTO imagine_token_buckets (bucket_key, tokens, updated_at)
     VALUES ($1, GREATEST($2::double precision - $4::double precision, 0), clock_timestamp())
     ON CONFLICT (bucket_key)
     DO UPDATE SET
       tokens = LEAST(
         $2::double precision,
         imagine_token_buckets.tokens +
           GREATEST(EXTRACT(EPOCH FROM (clock_timestamp() - imagine_token_buckets.updated_at)), 0) * $3::double precision
       ) - $4::double precision,
       updated_at = clock_timestamp()
     WHERE LEAST(
       $2::double precision,
       imagine_token_buckets.tokens +
         GREATEST(EXTRACT(EPOCH FROM (clock_timestamp() - imagine_token_buckets.updated_at)), 0) * $3::double precision
     ) >= $4::double precision
     RETURNING tokens`, [
		key,
		capacity,
		refillPerSecond,
		cost
	])).length === 1;
}
/** Server-side anonymous visitor identity for the public, no-account workspace.
*
* The cookie is random, HttpOnly, SameSite=Lax and HMAC-signed. Only a keyed
* digest is persisted, so database rows cannot be correlated with the cookie
* value. Production must set STILLWAKE_SESSION_SECRET (32+ characters).
*/
var COOKIE_BASE = "stillwake_visitor";
var COOKIE_TTL_SECONDS = 2592e3;
var globalRef = globalThis;
function getSecuritySecret() {
	const configured = process.env.STILLWAKE_SESSION_SECRET?.trim();
	if (configured && Buffer.byteLength(configured, "utf8") >= 32) return Buffer.from(configured, "utf8");
	if (!isWorkspacePreview()) return null;
	globalRef.__stillwakePreviewSecret__ ??= randomBytes(32);
	return globalRef.__stillwakePreviewSecret__;
}
function mac(secret, payload) {
	return createHmac("sha256", secret).update(payload).digest("base64url");
}
function safeEqual(left, right) {
	const a = Buffer.from(left);
	const b = Buffer.from(right);
	return a.length === b.length && timingSafeEqual(a, b);
}
function parseCookies(header) {
	const result = /* @__PURE__ */ new Map();
	for (const part of (header ?? "").split(";")) {
		const index = part.indexOf("=");
		if (index <= 0) continue;
		const name = part.slice(0, index).trim();
		const value = part.slice(index + 1).trim();
		if (name && value) result.set(name, value);
	}
	return result;
}
function cookieName(secure) {
	return secure ? `__Host-${COOKIE_BASE}` : COOKIE_BASE;
}
function makeCookie(id, expiresAt, secret, secure) {
	const payload = `${id}.${expiresAt}`;
	const value = `${payload}.${mac(secret, `visitor:${payload}`)}`;
	const attributes = [
		`${cookieName(secure)}=${value}`,
		"Path=/",
		`Max-Age=${COOKIE_TTL_SECONDS}`,
		"HttpOnly",
		"SameSite=Lax"
	];
	if (secure) attributes.push("Secure");
	return attributes.join("; ");
}
function getVisitorFromRequest(request, createIfMissing = false) {
	const secret = getSecuritySecret();
	if (!secret) return null;
	const secure = new URL(request.url).protocol === "https:";
	const cookies = parseCookies(request.headers.get("cookie"));
	const names = [cookieName(secure)];
	for (const name of names) {
		const token = cookies.get(name);
		if (!token) continue;
		const parts = token.split(".");
		if (parts.length !== 3) continue;
		const [id, expiresText, signature] = parts;
		if (!/^[A-Za-z0-9_-]{32,64}$/.test(id)) continue;
		if (!/^\d{10}$/.test(expiresText)) continue;
		const expiresAt = Number(expiresText);
		if (!Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1e3)) continue;
		const payload = `${id}.${expiresAt}`;
		if (!/^[A-Za-z0-9_-]{40,64}$/.test(signature)) continue;
		if (!safeEqual(signature, mac(secret, `visitor:${payload}`))) continue;
		const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
		const trustedIp = process.env.VERCEL === "1" && request.headers.get("x-vercel-id") && forwardedFor ? forwardedFor : null;
		return {
			ownerHash: mac(secret, `owner:${id}`),
			ipHash: trustedIp ? mac(secret, `ip:${trustedIp}`) : null
		};
	}
	if (!createIfMissing) return null;
	const id = randomBytes(32).toString("base64url");
	const expiresAt = Math.floor(Date.now() / 1e3) + COOKIE_TTL_SECONDS;
	const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
	const trustedIp = process.env.VERCEL === "1" && request.headers.get("x-vercel-id") && forwardedFor ? forwardedFor : null;
	return {
		ownerHash: mac(secret, `owner:${id}`),
		ipHash: trustedIp ? mac(secret, `ip:${trustedIp}`) : null,
		setCookie: makeCookie(id, expiresAt, secret, secure)
	};
}
function issueJobToken(jobId, ownerHash) {
	const secret = getSecuritySecret();
	if (!secret) throw new Error("The visitor signing secret is not configured.");
	const expiresAt = Math.floor(Date.now() / 1e3) + COOKIE_TTL_SECONDS;
	return `${jobId}.${expiresAt}.${mac(secret, `job:${`${jobId}.${expiresAt}.${ownerHash}`}`)}`;
}
function verifyJobToken(token, ownerHash) {
	const secret = getSecuritySecret();
	if (!secret || token.length > 256) return null;
	const parts = token.split(".");
	if (parts.length !== 3) return null;
	const [jobId, expiresText, signature] = parts;
	if (!/^[0-9a-f-]{36}$/i.test(jobId)) return null;
	if (!/^\d{10}$/.test(expiresText)) return null;
	const expiresAt = Number(expiresText);
	if (!Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1e3)) return null;
	if (!safeEqual(signature, mac(secret, `job:${`${jobId}.${expiresAt}.${ownerHash}`}`))) return null;
	return jobId;
}
function encryptionKey(secret) {
	return createHash("sha256").update("stillwake-prompt-encryption:").update(secret).digest();
}
/** Encrypt persisted prompts so database exports do not contain user text. */
function encryptPrompt(prompt) {
	const secret = getSecuritySecret();
	if (!secret) throw new Error("The visitor signing secret is not configured.");
	const nonce = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), nonce);
	const encrypted = Buffer.concat([cipher.update(prompt, "utf8"), cipher.final()]);
	return Buffer.concat([
		nonce,
		cipher.getAuthTag(),
		encrypted
	]).toString("base64url");
}
function decryptPrompt(value) {
	const secret = getSecuritySecret();
	if (!secret) return "";
	try {
		const packed = Buffer.from(value, "base64url");
		if (packed.length < 29) return "";
		const nonce = packed.subarray(0, 12);
		const tag = packed.subarray(12, 28);
		const encrypted = packed.subarray(28);
		const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), nonce);
		decipher.setAuthTag(tag);
		return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
	} catch {
		return "";
	}
}
/** Server-only Grok Imagine Video integration with durable, visitor-scoped jobs. */
if (typeof window !== "undefined") throw new Error("imagine/video.server is server-only");
var XAI_VIDEOS = "https://api.x.ai/v1/videos";
/** Paid xAI calls are refused in the workspace. Published apps are the only callers. */
async function xaiFetch(url, init) {
	if (!liveXaiBillingEnabled(isWorkspacePreview())) throw new Error("Refusing a billed xAI call from the development server.");
	if (!url.startsWith("https://api.x.ai/")) throw new Error("Unexpected video upstream.");
	return fetch(url, init);
}
var REQUEST_TIMEOUT_MS = 45e3;
var POLL_TIMEOUT_MS = 2e4;
var MAX_UPSTREAM_RESPONSE_BYTES = 65536;
var cleanupGlobal = globalThis;
var ReservationDenied = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "ReservationDenied";
	}
};
function clipCap() {
	return isWorkspacePreview() ? 5 : 50;
}
function visitorCap() {
	return isWorkspacePreview() ? 5 : 5;
}
function spendCap() {
	return isWorkspacePreview() ? PREVIEW_SPEND_CAP_USD : 25;
}
function key() {
	return process.env.XAI_API_KEY?.trim() || void 0;
}
function persistentBudgetAvailable() {
	return isWorkspacePreview() || dbSource === "neon";
}
function utcDayBucket() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function utcHourBucket() {
	return (/* @__PURE__ */ new Date(Math.floor(Date.now() / 36e5) * 36e5)).toISOString().slice(0, 13);
}
function utcMinuteBucket() {
	return (/* @__PURE__ */ new Date(Math.floor(Date.now() / 6e4) * 6e4)).toISOString().slice(0, 16);
}
async function cleanupOldRows(sql) {
	if (cleanupGlobal.__stillwakeCleanupAt__ && Date.now() - cleanupGlobal.__stillwakeCleanupAt__ < 864e5) return;
	cleanupGlobal.__stillwakeCleanupAt__ = Date.now();
	try {
		await Promise.all([
			sql.query("DELETE FROM imagine_jobs WHERE created_at < NOW() - INTERVAL '90 days'"),
			sql.query("DELETE FROM imagine_rate_limits WHERE updated_at < NOW() - INTERVAL '2 days'"),
			sql.query("DELETE FROM imagine_token_buckets WHERE updated_at < NOW() - INTERVAL '2 days'"),
			sql.query("DELETE FROM imagine_visitor_daily_usage WHERE bucket < TO_CHAR(NOW() - INTERVAL '90 days', 'YYYY-MM-DD')"),
			sql.query("DELETE FROM imagine_daily_budget WHERE bucket < TO_CHAR(NOW() - INTERVAL '90 days', 'YYYY-MM-DD')")
		]);
	} catch (error) {
		cleanupGlobal.__stillwakeCleanupAt__ = void 0;
		console.warn("[imagine] retention cleanup skipped:", error instanceof Error ? error.message : "unknown error");
	}
}
async function readBudget(sql, bucket) {
	const rows = await sql.query("SELECT used, reserved_usd FROM imagine_daily_budget WHERE bucket = $1 LIMIT 1", [bucket]);
	return {
		used: Number(rows[0]?.used ?? 0),
		reservedUsd: Number(rows[0]?.reserved_usd ?? 0)
	};
}
async function readVisitorUsage(sql, bucket, ownerHash) {
	const rows = await sql.query("SELECT used FROM imagine_visitor_daily_usage WHERE bucket = $1 AND visitor_hash = $2 LIMIT 1", [bucket, ownerHash]);
	return Number(rows[0]?.used ?? 0);
}
async function reserveGlobalBudget(sql, bucket, cost) {
	return (await sql.query(`INSERT INTO imagine_daily_budget (bucket, used, reserved_usd)
     VALUES ($1, 1, $2)
     ON CONFLICT (bucket)
     DO UPDATE SET
       used = imagine_daily_budget.used + 1,
       reserved_usd = imagine_daily_budget.reserved_usd + $2,
       updated_at = NOW()
     WHERE imagine_daily_budget.used < $3
       AND imagine_daily_budget.reserved_usd + $2 <= $4
     RETURNING used`, [
		bucket,
		cost,
		clipCap(),
		spendCap()
	])).length > 0;
}
async function reserveVisitor(sql, bucket, ownerHash) {
	return (await sql.query(`INSERT INTO imagine_visitor_daily_usage (bucket, visitor_hash, used)
     VALUES ($1, $2, 1)
     ON CONFLICT (bucket, visitor_hash)
     DO UPDATE SET used = imagine_visitor_daily_usage.used + 1, updated_at = NOW()
     WHERE imagine_visitor_daily_usage.used < $3
     RETURNING used`, [
		bucket,
		ownerHash,
		visitorCap()
	])).length > 0;
}
async function reserveRateLimit(sql, windowKey, scope, subjectHash, limit) {
	return (await sql.query(`INSERT INTO imagine_rate_limits (window_key, scope, subject_hash, used)
     VALUES ($1, $2, $3, 1)
     ON CONFLICT (window_key, scope, subject_hash)
     DO UPDATE SET used = imagine_rate_limits.used + 1, updated_at = NOW()
     WHERE imagine_rate_limits.used < $4
     RETURNING used`, [
		windowKey,
		scope,
		subjectHash,
		limit
	])).length > 0;
}
async function releaseGlobalBudget(sql, bucket, cost) {
	await sql.query(`UPDATE imagine_daily_budget
       SET used = GREATEST(used - 1, 0),
           reserved_usd = GREATEST(reserved_usd - $2, 0),
           updated_at = NOW()
     WHERE bucket = $1`, [bucket, cost]);
}
async function releaseVisitor(sql, bucket, ownerHash) {
	await sql.query(`UPDATE imagine_visitor_daily_usage
       SET used = GREATEST(used - 1, 0), updated_at = NOW()
     WHERE bucket = $1 AND visitor_hash = $2`, [bucket, ownerHash]);
}
async function releaseReservation(sql, bucket, ownerHash, cost) {
	await sql.transaction(async (tx) => {
		await releaseGlobalBudget(tx, bucket, cost);
		await releaseVisitor(tx, bucket, ownerHash);
	});
}
function scrub(text) {
	return text.replace(/Bearer\s+\S+/gi, "Bearer [redacted]").replace(/(?:xai-[A-Za-z0-9_-]{12,})/g, "[redacted]").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
}
function messageFrom(status, raw, body) {
	if (status === 401 || status === 403) return "The xAI server key was rejected. Check the key configured for this app.";
	if (status === 429) return "xAI rate-limited this request. Wait a moment before trying again.";
	if (body && typeof body === "object") {
		const record = body;
		if (typeof record.error === "string") return scrub(record.error);
		if (record.error && typeof record.error === "object") {
			const nested = record.error.message;
			if (typeof nested === "string") return scrub(nested);
		}
		if (typeof record.message === "string") return scrub(record.message);
	}
	return scrub(raw) || `Video service error ${status}`;
}
async function readLimitedResponse(res) {
	if (!res.body) return "";
	const reader = res.body.getReader();
	const chunks = [];
	let total = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			total += value.byteLength;
			if (total > MAX_UPSTREAM_RESPONSE_BYTES) {
				await reader.cancel().catch(() => void 0);
				return "Upstream response exceeded the allowed size.";
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return new TextDecoder().decode(bytes);
}
async function createJob(sql, input, ownerHash, bucket, cost, fingerprint) {
	const id = randomUUID();
	await sql.query(`INSERT INTO imagine_jobs
      (id, visitor_hash, daily_bucket, status, prompt_ciphertext, model, generation_mode, image_input_count,
       duration, resolution, aspect_ratio, generate_audio, estimated_cost, idempotency_key, request_fingerprint)
     VALUES ($1, $2, $3, 'submitting', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`, [
		id,
		ownerHash,
		bucket,
		encryptPrompt(input.prompt),
		input.model,
		input.mode,
		imageAssetCount(input),
		input.duration,
		input.resolution,
		input.aspectRatio,
		input.generateAudio,
		cost,
		input.idempotencyKey,
		fingerprint
	]);
	return id;
}
async function currentRemaining(sql, ownerHash) {
	const bucket = utcDayBucket();
	const [visitorUsed, budget] = await Promise.all([readVisitorUsage(sql, bucket, ownerHash), readBudget(sql, bucket)]);
	const visitorRemaining = Math.max(0, visitorCap() - visitorUsed);
	const clipRemaining = Math.max(0, clipCap() - budget.used);
	const affordableSlots = Math.floor(Math.max(0, spendCap() - budget.reservedUsd) / estimateClipCost(1, "480p", "grok-imagine-video-1.5-lite", 0));
	return Math.min(visitorRemaining, clipRemaining, affordableSlots);
}
async function listRecentJobs(sql, ownerHash) {
	return (await sql.query(`SELECT id, status, prompt_ciphertext, duration, resolution, aspect_ratio,
            generate_audio, model, generation_mode, image_input_count, estimated_cost, created_at, video_url, xai_file_id, error_message
       FROM imagine_jobs
      WHERE visitor_hash = $1
      ORDER BY created_at DESC
      LIMIT 12`, [ownerHash])).map((row) => ({
		id: row.id,
		token: issueJobToken(row.id, ownerHash),
		status: row.status,
		prompt: decryptPrompt(row.prompt_ciphertext),
		model: row.model,
		mode: row.generation_mode,
		imageCount: Number(row.image_input_count),
		settings: {
			duration: Number(row.duration),
			resolution: row.resolution,
			aspectRatio: row.aspect_ratio
		},
		generateAudio: row.generate_audio,
		cost: Number(row.estimated_cost),
		createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
		...row.xai_file_id && /^file_[A-Za-z0-9_-]{8,128}$/.test(row.xai_file_id) ? { videoUrl: `/api/imagine/download/${row.id}` } : row.video_url?.startsWith("https://") ? { videoUrl: row.video_url } : {},
		...row.error_message ? { error: row.error_message } : {}
	}));
}
function requestFingerprint(input) {
	return fingerprintGenerationIntent(input);
}
async function findIdempotentJob(sql, ownerHash, idempotencyKey) {
	return (await sql.query(`SELECT id, status, request_fingerprint, error_message
       FROM imagine_jobs
      WHERE visitor_hash = $1 AND idempotency_key = $2
      LIMIT 1`, [ownerHash, idempotencyKey]))[0] ?? null;
}
async function replayIdempotentJob(sql, job, fingerprint, ownerHash) {
	if (!job.request_fingerprint || job.request_fingerprint !== fingerprint) return {
		ok: false,
		code: "idempotency_conflict",
		error: "This retry key was already used for different input. Start a new render with a new request key.",
		remaining: await safeRemaining(ownerHash)
	};
	const token = issueJobToken(job.id, ownerHash);
	const remaining = await safeRemaining(ownerHash);
	if (job.status === "pending" || job.status === "done") return {
		ok: true,
		token,
		remaining
	};
	if (job.status === "failed" || job.status === "expired") return {
		ok: false,
		code: "already_failed",
		error: job.error_message || "The original render did not complete. Start a new render to retry.",
		remaining
	};
	return {
		ok: false,
		code: "network_ambiguous",
		error: job.error_message || "The original request is still being reconciled. Do not submit a duplicate.",
		remaining,
		token
	};
}
async function imagineStatus(visitor) {
	const preview = isWorkspacePreview();
	const securityReady = Boolean(getSecuritySecret());
	const base = {
		keyReady: liveXaiBillingEnabled(preview) ? Boolean(key()) : true,
		preview,
		securityReady,
		budgetReady: false,
		usedToday: 0,
		remaining: 0,
		cap: visitorCap(),
		globalUsedToday: 0,
		globalRemaining: 0,
		reservedSpendUsd: 0,
		remainingSpendUsd: spendCap(),
		spendCapUsd: spendCap(),
		model: DEFAULT_CLIP_MODEL,
		jobs: []
	};
	if (!visitor || !securityReady || !persistentBudgetAvailable()) return base;
	try {
		const sql = await getSql();
		await cleanupOldRows(sql);
		const bucket = utcDayBucket();
		const [budget, usedToday, jobs] = await Promise.all([
			readBudget(sql, bucket),
			readVisitorUsage(sql, bucket, visitor.ownerHash),
			listRecentJobs(sql, visitor.ownerHash)
		]);
		const globalRemaining = Math.min(Math.max(0, clipCap() - budget.used), budget.reservedUsd >= spendCap() ? 0 : Math.max(0, Math.floor((spendCap() - budget.reservedUsd) / estimateClipCost(1, "480p", "grok-imagine-video-1.5-lite", 0))));
		base.budgetReady = true;
		base.usedToday = usedToday;
		base.globalUsedToday = budget.used;
		base.globalRemaining = globalRemaining;
		base.reservedSpendUsd = Number(budget.reservedUsd.toFixed(2));
		base.remainingSpendUsd = Number(Math.max(0, spendCap() - budget.reservedUsd).toFixed(2));
		base.remaining = Math.min(Math.max(0, visitorCap() - usedToday), globalRemaining);
		base.jobs = jobs;
		return base;
	} catch (error) {
		console.error("[imagine] status query failed:", error instanceof Error ? error.message : "unknown error");
		return base;
	}
}
async function startClip(input, visitor) {
	const live = liveXaiBillingEnabled(isWorkspacePreview());
	const apiKey = live ? key() : void 0;
	if (live && !apiKey) return {
		ok: false,
		code: "no_key",
		error: "Video generation is unavailable: the server key is not configured.",
		remaining: 0
	};
	if (!getSecuritySecret()) return {
		ok: false,
		code: "security_config",
		error: "Paid generation is locked: configure STILLWAKE_SESSION_SECRET with at least 32 characters.",
		remaining: 0
	};
	if (!persistentBudgetAvailable()) return {
		ok: false,
		code: "budget_storage",
		error: "Paid generation is locked because a shared PostgreSQL database is not configured.",
		remaining: 0
	};
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.idempotencyKey)) return {
		ok: false,
		code: "idempotency_key",
		error: "A valid generation request key is required. Reload the studio and try again.",
		remaining: await safeRemaining(visitor.ownerHash)
	};
	if (typeof input.prompt !== "string") return {
		ok: false,
		code: "prompt",
		error: "Provide a creative direction or source media.",
		remaining: await safeRemaining(visitor.ownerHash)
	};
	const prompt = input.prompt.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, MAX_PROMPT);
	const normalizedInput = {
		...input,
		prompt
	};
	const validationError = validateGenerationInput(normalizedInput);
	if (validationError) return {
		ok: false,
		code: validationError.toLowerCase().includes("image") || validationError.toLowerCase().includes("frame") || validationError.toLowerCase().includes("reference") ? "image" : "settings",
		error: validationError,
		remaining: await safeRemaining(visitor.ownerHash)
	};
	const fingerprint = requestFingerprint(normalizedInput);
	const catalogCost = estimateClipCost(input.duration, input.resolution, input.model, imageAssetCount(input));
	const cost = live ? catalogCost : 0;
	const bucket = utcDayBucket();
	let sql;
	try {
		sql = await getSql();
		await cleanupOldRows(sql);
	} catch {
		return {
			ok: false,
			code: "budget_storage",
			error: "The shared spend-protection database is unavailable. No request was sent to xAI.",
			remaining: 0
		};
	}
	try {
		const existing = await findIdempotentJob(sql, visitor.ownerHash, input.idempotencyKey);
		if (existing) return await replayIdempotentJob(sql, existing, fingerprint, visitor.ownerHash);
	} catch (error) {
		console.error("[imagine] idempotency lookup failed:", error instanceof Error ? error.message : "unknown error");
		return {
			ok: false,
			code: "job_storage",
			error: "Could not verify the generation request key. No request was sent to xAI.",
			remaining: 0
		};
	}
	let jobId;
	try {
		jobId = await sql.transaction(async (tx) => {
			if (!await reserveGlobalBudget(tx, bucket, cost)) throw new ReservationDenied("budget", "The application has reached its daily spend or render ceiling. The budget resets at 00:00 UTC.");
			if (!await reserveVisitor(tx, bucket, visitor.ownerHash)) throw new ReservationDenied("visitor_budget", `Your daily limit is ${visitorCap()} renders. It resets at 00:00 UTC.`);
			if (visitor.ipHash) {
				if (!await reserveRateLimit(tx, `hour:${utcHourBucket()}`, "ip_hour", visitor.ipHash, 8)) throw new ReservationDenied("rate_limit", "Too many generation attempts from this network. Try again in an hour.");
				if (!await reserveRateLimit(tx, `day:${bucket}`, "ip_day", visitor.ipHash, 15)) throw new ReservationDenied("rate_limit", "This network has reached its daily generation limit. Try again after the UTC reset.");
			}
			return createJob(tx, normalizedInput, visitor.ownerHash, bucket, cost, fingerprint);
		});
	} catch (error) {
		if (error instanceof ReservationDenied) {
			const remaining = error.code === "visitor_budget" ? 0 : await safeRemaining(visitor.ownerHash);
			return {
				ok: false,
				code: error.code,
				error: error.message,
				remaining
			};
		}
		try {
			const existing = await findIdempotentJob(sql, visitor.ownerHash, input.idempotencyKey);
			if (existing) return await replayIdempotentJob(sql, existing, fingerprint, visitor.ownerHash);
		} catch {}
		console.error("[imagine] atomic reservation/job transaction failed:", error instanceof Error ? error.message : "unknown error");
		return {
			ok: false,
			code: "job_storage",
			error: "Could not atomically reserve the shared budget and create the durable job. No request was sent to xAI.",
			remaining: await safeRemaining(visitor.ownerHash)
		};
	}
	const token = issueJobToken(jobId, visitor.ownerHash);
	if (!live) {
		const requestId = developmentRequestId(jobId);
		await sql.query("UPDATE imagine_jobs SET upstream_request_id = $2, status = 'pending', error_code = NULL, error_message = NULL, updated_at = NOW() WHERE id = $1", [jobId, requestId]);
		return {
			ok: true,
			token,
			remaining: await safeRemaining(visitor.ownerHash)
		};
	}
	if (!apiKey) return {
		ok: false,
		code: "no_key",
		error: "Video generation is unavailable: the server key is not configured.",
		remaining: 0
	};
	let response;
	try {
		response = await xaiFetch(`${XAI_VIDEOS}/generations`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify(buildXaiVideoPayload(normalizedInput, jobId)),
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
		});
	} catch {
		await sql.query("UPDATE imagine_jobs SET status = 'submission_unknown', error_code = 'network_ambiguous', error_message = $2, updated_at = NOW() WHERE id = $1", [jobId, "The connection ended before xAI confirmed whether the job was accepted. The spend reservation is retained to prevent duplicate generation."]);
		return {
			ok: false,
			code: "network_ambiguous",
			error: "The connection ended before xAI confirmed the request. The job is saved as submission-unknown and its spend reservation remains held. Check your xAI request history before retrying.",
			remaining: await safeRemaining(visitor.ownerHash),
			token
		};
	}
	let raw;
	try {
		raw = await readLimitedResponse(response);
	} catch (error) {
		await sql.query("UPDATE imagine_jobs SET status = 'submission_unknown', error_code = 'response_read_failed', error_message = $2, updated_at = NOW() WHERE id = $1", [jobId, "xAI response could not be read completely. Its acceptance state is unknown; do not submit a duplicate."]).catch(() => void 0);
		console.error("[imagine] xAI response stream failed after submit:", {
			jobId,
			message: error instanceof Error ? error.message : "unknown error"
		});
		return {
			ok: false,
			code: "network_ambiguous",
			error: "The xAI response was interrupted. The job is retained as submission-unknown; do not submit a duplicate.",
			remaining: await safeRemaining(visitor.ownerHash),
			token
		};
	}
	let body = null;
	try {
		body = JSON.parse(raw);
	} catch {
		body = null;
	}
	const requestId = body && typeof body === "object" && typeof body.request_id === "string" ? body.request_id : "";
	if (!response.ok) {
		const message = messageFrom(response.status, raw, body);
		if (response.status < 500 && response.status !== 408 && response.status !== 425) {
			await sql.query("UPDATE imagine_jobs SET status = 'failed', error_code = 'upstream_rejected', error_message = $2, updated_at = NOW(), completed_at = NOW() WHERE id = $1", [jobId, message]);
			await releaseReservation(sql, bucket, visitor.ownerHash, cost).catch((error) => {
				console.error("[imagine] rejected-job quota release failed:", error instanceof Error ? error.message : "unknown error");
			});
			return {
				ok: false,
				code: "upstream",
				error: message,
				remaining: await safeRemaining(visitor.ownerHash)
			};
		}
		await sql.query("UPDATE imagine_jobs SET status = 'submission_unknown', error_code = 'upstream_5xx', error_message = $2, updated_at = NOW() WHERE id = $1", [jobId, message]);
		return {
			ok: false,
			code: "network_ambiguous",
			error: `${message} The job is retained as submission-unknown to prevent duplicate spend.`,
			remaining: await safeRemaining(visitor.ownerHash),
			token
		};
	}
	if (!/^[\w-]{8,128}$/.test(requestId)) {
		await sql.query("UPDATE imagine_jobs SET status = 'submission_unknown', error_code = 'upstream_shape', error_message = $2, updated_at = NOW() WHERE id = $1", [jobId, "xAI returned success without a usable request ID."]);
		return {
			ok: false,
			code: "upstream_shape",
			error: "xAI returned an unusable success response. The job and spend reservation were retained for manual reconciliation.",
			remaining: await safeRemaining(visitor.ownerHash),
			token
		};
	}
	try {
		await sql.query("UPDATE imagine_jobs SET upstream_request_id = $2, status = 'pending', error_code = NULL, error_message = NULL, updated_at = NOW() WHERE id = $1", [jobId, requestId]);
	} catch (error) {
		console.error("[imagine] xAI accepted job but request ID persistence failed:", {
			jobId,
			requestId,
			message: error instanceof Error ? error.message : "unknown error"
		});
		return {
			ok: false,
			code: "network_ambiguous",
			error: "xAI accepted the generation, but the job ID could not be saved. Do not retry this request. Contact the operator with the job reference shown in Recent renders.",
			remaining: await safeRemaining(visitor.ownerHash),
			token
		};
	}
	return {
		ok: true,
		token,
		remaining: await safeRemaining(visitor.ownerHash)
	};
}
async function safeRemaining(ownerHash) {
	try {
		return await currentRemaining(await getSql(), ownerHash);
	} catch {
		return 0;
	}
}
async function pollClip(token, visitor) {
	const live = liveXaiBillingEnabled(isWorkspacePreview());
	const apiKey = live ? key() : void 0;
	if (live && !apiKey) return {
		ok: false,
		code: "no_key",
		error: "Video generation is unavailable."
	};
	const jobId = verifyJobToken(token, visitor.ownerHash);
	if (!jobId) return {
		ok: false,
		code: "unknown",
		error: "That job token is invalid, expired, or belongs to another visitor."
	};
	let sql;
	try {
		sql = await getSql();
	} catch {
		return {
			ok: false,
			code: "database",
			error: "The job database is temporarily unavailable."
		};
	}
	const job = (await sql.query("SELECT upstream_request_id, status, video_url, xai_file_id, error_message FROM imagine_jobs WHERE id = $1 AND visitor_hash = $2 LIMIT 1", [jobId, visitor.ownerHash]))[0];
	if (!job) return {
		ok: false,
		code: "unknown",
		error: "That job does not exist for this visitor."
	};
	if (job.status === "submitting") {
		const message = "The local job was created, but its upstream request ID was not durably recorded. Check xAI request history before retrying.";
		await sql.query("UPDATE imagine_jobs SET status = 'submission_unknown', error_code = 'stale_submitting', error_message = $3, updated_at = NOW() WHERE id = $1 AND visitor_hash = $2 AND status = 'submitting'", [
			jobId,
			visitor.ownerHash,
			message
		]);
		return {
			ok: true,
			status: "unknown",
			error: message
		};
	}
	if (job.status === "submission_unknown") return {
		ok: true,
		status: "unknown",
		error: job.error_message || "The upstream request outcome is unknown. Check xAI request history before retrying."
	};
	if (job.status === "failed" || job.status === "expired") return {
		ok: true,
		status: job.status,
		error: job.error_message || "The render did not complete."
	};
	if (job.status === "done") {
		if (job.xai_file_id && /^file_[A-Za-z0-9_-]{8,128}$/.test(job.xai_file_id)) return {
			ok: true,
			status: "done",
			url: `/api/imagine/download/${jobId}`
		};
		if (job.video_url?.startsWith("https://")) return {
			ok: true,
			status: "done",
			url: job.video_url
		};
	}
	if (isDevelopmentRequestId(job.upstream_request_id)) {
		await sql.query("UPDATE imagine_jobs SET status = 'done', video_url = NULL, xai_file_id = $2, error_code = NULL, error_message = NULL, completed_at = NOW(), updated_at = NOW() WHERE id = $1", [jobId, DEV_STANDIN_FILE_ID]);
		return {
			ok: true,
			status: "done",
			url: `/api/imagine/download/${jobId}`
		};
	}
	if (!live) return {
		ok: false,
		code: "development",
		error: "Development mode does not call the billed xAI API."
	};
	if (!apiKey) return {
		ok: false,
		code: "no_key",
		error: "Video generation is unavailable."
	};
	if (!job.upstream_request_id) return {
		ok: true,
		status: "unknown",
		error: "The upstream request ID was not recorded. Check xAI request history."
	};
	class PollRateLimitDenied extends Error {}
	try {
		await sql.transaction(async (tx) => {
			const minuteKey = `minute:${utcMinuteBucket()}`;
			if (!await reserveRateLimit(tx, minuteKey, "visitor_poll", visitor.ownerHash, 120)) throw new PollRateLimitDenied();
			if (visitor.ipHash && !await reserveRateLimit(tx, minuteKey, "ip_poll", visitor.ipHash, 240)) throw new PollRateLimitDenied();
			if (!await consumeTokenBucket(tx, {
				key: "stillwake:global-poll",
				capacity: 1,
				refillPerSecond: 8
			})) throw new PollRateLimitDenied();
			if (!await consumeTokenBucket(tx, {
				key: `visitor-poll:${visitor.ownerHash}`,
				capacity: 3,
				refillPerSecond: .5
			})) throw new PollRateLimitDenied();
			if (visitor.ipHash && !await consumeTokenBucket(tx, {
				key: `ip-poll:${visitor.ipHash}`,
				capacity: 8,
				refillPerSecond: 2
			})) throw new PollRateLimitDenied();
		});
	} catch (error) {
		if (error instanceof PollRateLimitDenied) return {
			ok: false,
			code: "rate_limit",
			error: "The studio is checking many renders at once. Status checks will resume shortly."
		};
		throw error;
	}
	let response;
	try {
		response = await xaiFetch(`${XAI_VIDEOS}/${encodeURIComponent(job.upstream_request_id)}`, {
			headers: { Authorization: `Bearer ${apiKey}` },
			signal: AbortSignal.timeout(POLL_TIMEOUT_MS)
		});
	} catch {
		return {
			ok: false,
			code: "network",
			error: "Couldn't reach xAI to check this render."
		};
	}
	const raw = await readLimitedResponse(response);
	let body = null;
	try {
		body = JSON.parse(raw);
	} catch {
		body = null;
	}
	if (!response.ok || !body || typeof body !== "object") return {
		ok: false,
		code: "upstream",
		error: messageFrom(response.status, raw, body)
	};
	const record = body;
	const upstreamStatus = typeof record.status === "string" ? record.status.toLowerCase() : "pending";
	if (upstreamStatus === "done") {
		const url = record.video && typeof record.video.url === "string" ? record.video.url : "";
		const fileId = record.video?.file_output?.file_id;
		const storedFileId = typeof fileId === "string" && /^file_[A-Za-z0-9_-]{8,128}$/.test(fileId) ? fileId : null;
		if (!storedFileId && !url.startsWith("https://")) {
			await sql.query("UPDATE imagine_jobs SET status = 'failed', error_code = 'missing_video_url', error_message = $2, completed_at = NOW(), updated_at = NOW() WHERE id = $1", [jobId, "The render completed without a valid HTTPS video link."]);
			return {
				ok: true,
				status: "failed",
				error: "The render completed without a valid video link."
			};
		}
		await sql.query("UPDATE imagine_jobs SET status = 'done', video_url = $2, xai_file_id = $3, error_code = NULL, error_message = NULL, completed_at = NOW(), updated_at = NOW() WHERE id = $1", [
			jobId,
			storedFileId ? null : url,
			storedFileId
		]);
		return {
			ok: true,
			status: "done",
			url: storedFileId ? `/api/imagine/download/${jobId}` : url
		};
	}
	if (upstreamStatus === "failed" || upstreamStatus === "expired") {
		const message = typeof record.error === "string" ? scrub(record.error) : upstreamStatus === "expired" ? "The render expired before it finished." : "Video generation failed.";
		await sql.query("UPDATE imagine_jobs SET status = $2, error_code = $3, error_message = $4, completed_at = NOW(), updated_at = NOW() WHERE id = $1", [
			jobId,
			upstreamStatus,
			upstreamStatus,
			message
		]);
		return {
			ok: true,
			status: upstreamStatus,
			error: message
		};
	}
	await sql.query("UPDATE imagine_jobs SET status = 'pending', updated_at = NOW() WHERE id = $1", [jobId]);
	return {
		ok: true,
		status: "pending"
	};
}
var NO_STORE$1 = {
	"Cache-Control": "private, no-store, max-age=0",
	"Content-Type": "application/json; charset=utf-8",
	"Pragma": "no-cache",
	"Referrer-Policy": "no-referrer",
	"X-Content-Type-Options": "nosniff",
	Vary: "Cookie"
};
var MAX_BODY_BYTES$1 = 1024;
async function readToken(request) {
	if (!request.body) return null;
	const reader = request.body.getReader();
	const chunks = [];
	let total = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			total += value.byteLength;
			if (total > MAX_BODY_BYTES$1) {
				await reader.cancel().catch(() => void 0);
				return null;
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	try {
		const body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
		if (!body || typeof body !== "object" || Array.isArray(body)) return null;
		const token = body.token;
		return typeof token === "string" && token.length <= 256 ? token : null;
	} catch {
		return null;
	}
}
var Route$3 = createFileRoute("/api/imagine/poll")({ server: { handlers: { POST: async ({ request }) => {
	const origin = request.headers.get("origin");
	const site = request.headers.get("sec-fetch-site");
	if (!origin || site === "cross-site") return Response.json({
		ok: false,
		code: "origin",
		error: "A same-origin browser request is required."
	}, {
		status: 403,
		headers: NO_STORE$1
	});
	try {
		if (new URL(origin).origin !== new URL(request.url).origin) return Response.json({
			ok: false,
			code: "origin",
			error: "Request origin rejected."
		}, {
			status: 403,
			headers: NO_STORE$1
		});
	} catch {
		return Response.json({
			ok: false,
			code: "origin",
			error: "Request origin rejected."
		}, {
			status: 403,
			headers: NO_STORE$1
		});
	}
	if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return Response.json({
		ok: false,
		code: "content_type",
		error: "Use application/json."
	}, {
		status: 415,
		headers: NO_STORE$1
	});
	const visitor = getVisitorFromRequest(request, false);
	if (!visitor) return Response.json({
		ok: false,
		code: "visitor",
		error: "Your visitor session is missing or expired. Reload the studio."
	}, {
		status: 401,
		headers: NO_STORE$1
	});
	const token = await readToken(request);
	if (!token) return Response.json({
		ok: false,
		code: "body",
		error: "A valid job token is required."
	}, {
		status: 400,
		headers: NO_STORE$1
	});
	try {
		const result = await pollClip(token, visitor);
		const status = result.ok ? 200 : result.code === "network" || result.code === "upstream" ? 502 : result.code === "rate_limit" ? 429 : 400;
		return Response.json(result, {
			status,
			headers: NO_STORE$1
		});
	} catch (error) {
		console.error("[imagine] poll handler failed:", error instanceof Error ? error.message : "unknown error");
		return Response.json({
			ok: false,
			code: "internal",
			error: "The render status service encountered an internal error. Retry the status check."
		}, {
			status: 500,
			headers: NO_STORE$1
		});
	}
} } } });
var NO_STORE = {
	"Cache-Control": "private, no-store, max-age=0",
	Pragma: "no-cache",
	"Referrer-Policy": "no-referrer",
	"X-Content-Type-Options": "nosniff",
	Vary: "Cookie"
};
var MAX_BODY_BYTES = MAX_REQUEST_BODY_BYTES;
async function readLimitedBody(request, maxBytes) {
	if (!request.body) return "";
	const reader = request.body.getReader();
	const chunks = [];
	let total = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			total += value.byteLength;
			if (total > maxBytes) {
				await reader.cancel().catch(() => void 0);
				throw new Error("body_too_large");
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
var Route$2 = createFileRoute("/api/imagine/start")({ server: { handlers: { POST: async ({ request }) => {
	const origin = request.headers.get("origin");
	const site = request.headers.get("sec-fetch-site");
	if (!origin || site === "cross-site") return Response.json({
		ok: false,
		code: "origin",
		error: "A same-origin browser request is required.",
		remaining: 0
	}, {
		status: 403,
		headers: NO_STORE
	});
	try {
		if (new URL(origin).origin !== new URL(request.url).origin) return Response.json({
			ok: false,
			code: "origin",
			error: "Request origin rejected.",
			remaining: 0
		}, {
			status: 403,
			headers: NO_STORE
		});
	} catch {
		return Response.json({
			ok: false,
			code: "origin",
			error: "Request origin rejected.",
			remaining: 0
		}, {
			status: 403,
			headers: NO_STORE
		});
	}
	if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return Response.json({
		ok: false,
		code: "content_type",
		error: "Use application/json for generation requests.",
		remaining: 0
	}, {
		status: 415,
		headers: NO_STORE
	});
	const contentLength = request.headers.get("content-length");
	if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_BODY_BYTES)) return Response.json({
		ok: false,
		code: "image",
		error: "The combined media request is too large. Reduce the number or size of source images.",
		remaining: 0
	}, {
		status: 413,
		headers: NO_STORE
	});
	const visitor = getVisitorFromRequest(request, false);
	if (!visitor) return Response.json({
		ok: false,
		code: "visitor",
		error: "Your visitor session is missing or expired. Reload the studio and try again.",
		remaining: 0
	}, {
		status: 401,
		headers: NO_STORE
	});
	let raw;
	try {
		raw = await readLimitedBody(request, MAX_BODY_BYTES);
	} catch (error) {
		const tooLarge = error instanceof Error && error.message === "body_too_large";
		return Response.json({
			ok: false,
			code: tooLarge ? "image" : "body",
			error: tooLarge ? "The combined media request is too large. Reduce the number or size of source images." : "Could not read the request body.",
			remaining: 0
		}, {
			status: tooLarge ? 413 : 400,
			headers: NO_STORE
		});
	}
	let body;
	try {
		body = JSON.parse(raw);
	} catch {
		return Response.json({
			ok: false,
			code: "body",
			error: "The request was not valid JSON.",
			remaining: 0
		}, {
			status: 400,
			headers: NO_STORE
		});
	}
	const record = body && typeof body === "object" && !Array.isArray(body) ? body : {};
	if (record.generateAudio !== void 0 && typeof record.generateAudio !== "boolean") return Response.json({
		ok: false,
		code: "settings",
		error: "generateAudio must be a boolean.",
		remaining: 0
	}, {
		status: 400,
		headers: NO_STORE
	});
	const duration = Number(record.duration);
	const idempotencyKey = typeof record.idempotencyKey === "string" ? record.idempotencyKey : "";
	const keyframes = (Array.isArray(record.keyframes) ? record.keyframes : []).map((value) => {
		const item = value && typeof value === "object" ? value : {};
		return {
			imageDataUrl: typeof item.imageDataUrl === "string" ? item.imageDataUrl : "",
			timestampS: typeof item.timestampS === "number" ? item.timestampS : NaN
		};
	});
	const referenceImages = Array.isArray(record.referenceImages) ? record.referenceImages.map((value) => typeof value === "string" ? value : "") : [];
	const voiceIds = Array.isArray(record.voiceIds) ? record.voiceIds.map((value) => typeof value === "string" ? value : "") : [];
	const input = {
		mode: record.mode,
		model: record.model,
		prompt: typeof record.prompt === "string" ? record.prompt : "",
		imageDataUrl: typeof record.imageDataUrl === "string" ? record.imageDataUrl : void 0,
		lastFrameDataUrl: typeof record.lastFrameDataUrl === "string" ? record.lastFrameDataUrl : void 0,
		referenceImages,
		keyframes,
		voiceIds,
		confirmSpend: record.confirmSpend === true,
		duration,
		resolution: record.resolution,
		aspectRatio: record.aspectRatio,
		generateAudio: record.generateAudio !== false,
		idempotencyKey
	};
	if (voiceIds.some((voice) => !PRESET_VOICES.includes(voice))) return Response.json({
		ok: false,
		code: "settings",
		error: "Choose a supported preset voice.",
		remaining: 0
	}, {
		status: 400,
		headers: NO_STORE
	});
	let result;
	try {
		result = await startClip(input, visitor);
	} catch (error) {
		console.error("[imagine] start handler failed:", error instanceof Error ? error.message : "unknown error");
		return Response.json({
			ok: false,
			code: "internal",
			error: "The generation service encountered an internal error. Check Recent renders before retrying.",
			remaining: 0
		}, {
			status: 500,
			headers: NO_STORE
		});
	}
	const status = result.ok ? 200 : result.code === "budget" || result.code === "visitor_budget" || result.code === "rate_limit" ? 429 : result.code === "budget_storage" || result.code === "security_config" || result.code === "job_storage" ? 503 : result.code === "no_key" ? 503 : result.code === "idempotency_conflict" ? 409 : 400;
	return Response.json(result, {
		status,
		headers: NO_STORE
	});
} } } });
var HEADERS$1 = {
	"Cache-Control": "private, no-store, max-age=0",
	Pragma: "no-cache",
	"Referrer-Policy": "no-referrer",
	"X-Content-Type-Options": "nosniff",
	Vary: "Cookie"
};
var Route$1 = createFileRoute("/api/imagine/status")({ server: { handlers: { GET: async ({ request }) => {
	if (request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "Cross-site request rejected." }, {
		status: 403,
		headers: HEADERS$1
	});
	const visitor = getVisitorFromRequest(request, true);
	const status = await imagineStatus(visitor);
	const headers = new Headers(HEADERS$1);
	if (visitor?.setCookie) headers.append("Set-Cookie", visitor.setCookie);
	return Response.json(status, { headers });
} } } });
/** Streaming protections for provider-hosted generated MP4 files. */
var MAX_VIDEO_BYTES = 314572800;
/** Accept one byte range only; multipart ranges are deliberately unsupported. */
var SINGLE_BYTE_RANGE = /^bytes=(?:\d+-\d*|-\d+)$/;
/** RFC 9110 Content-Range value returned with a valid 206 response. */
var CONTENT_RANGE = /^bytes \d+-\d+\/(?:\d+|\*)$/;
/** Enforce a hard streaming cap even when the provider omits Content-Length. */
function limitStream(body, maxBytes = MAX_VIDEO_BYTES, idleTimeoutMs = 3e4) {
	if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new Error("Invalid stream byte limit.");
	if (!Number.isSafeInteger(idleTimeoutMs) || idleTimeoutMs <= 0) throw new Error("Invalid stream idle timeout.");
	const reader = body.getReader();
	let total = 0;
	return new ReadableStream({
		async pull(controller) {
			let timer;
			try {
				const nextChunk = reader.read();
				const { done, value } = await Promise.race([nextChunk, new Promise((_, reject) => {
					timer = setTimeout(() => reject(/* @__PURE__ */ new Error("Video provider stream became idle.")), idleTimeoutMs);
				})]);
				if (done) {
					controller.close();
					return;
				}
				total += value.byteLength;
				if (total > maxBytes) {
					await reader.cancel("Video exceeded the download limit.").catch(() => void 0);
					controller.error(/* @__PURE__ */ new Error("Video exceeded the download limit."));
					return;
				}
				controller.enqueue(value);
			} catch (error) {
				await reader.cancel(error).catch(() => void 0);
				controller.error(error);
			} finally {
				if (timer) clearTimeout(timer);
			}
		},
		cancel(reason) {
			return reader.cancel(reason);
		}
	});
}
var HEADERS = {
	"Cache-Control": "private, no-store, max-age=0",
	"Referrer-Policy": "no-referrer",
	"X-Content-Type-Options": "nosniff",
	"Cross-Origin-Resource-Policy": "same-origin",
	"X-Frame-Options": "DENY",
	"X-Download-Options": "noopen",
	Vary: "Cookie"
};
var XAI_FILES = "https://api.x.ai/v1/files";
var UPSTREAM_HEADERS_TIMEOUT_MS = 2e4;
async function standinBytes() {
	const { DEV_STANDIN_MP4_BASE64 } = await import("./dev-standin-D5jK7uYM.mjs");
	return Buffer.from(DEV_STANDIN_MP4_BASE64, "base64");
}
async function standinResponse(request, jobId) {
	const bytes = await standinBytes();
	const headers = new Headers(HEADERS);
	headers.set("Content-Type", "video/mp4");
	headers.set("Content-Disposition", `inline; filename="stillwake-dev-${jobId}.mp4"`);
	headers.set("Accept-Ranges", "bytes");
	const range = request.headers.get("range");
	if (range && SINGLE_BYTE_RANGE.test(range)) {
		const match = /^bytes=(\d*)-(\d*)$/.exec(range);
		const size = bytes.byteLength;
		let start = match?.[1] ? Number(match[1]) : 0;
		let end = match?.[2] ? Number(match[2]) : size - 1;
		if (!match?.[1] && match?.[2]) {
			start = Math.max(0, size - Number(match[2]));
			end = size - 1;
		}
		if (start > end || start >= size) return new Response(null, {
			status: 416,
			headers: {
				...Object.fromEntries(headers),
				"Content-Range": `bytes */${size}`
			}
		});
		end = Math.min(end, size - 1);
		const slice = bytes.subarray(start, end + 1);
		headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
		headers.set("Content-Length", String(slice.byteLength));
		return new Response(responseBody(slice), {
			status: 206,
			headers
		});
	}
	headers.set("Content-Length", String(bytes.byteLength));
	return new Response(responseBody(bytes), {
		status: 200,
		headers
	});
}
function responseBody(bytes) {
	const copy = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(copy).set(bytes);
	return copy;
}
function jsonError(message, status) {
	return Response.json({ error: message }, {
		status,
		headers: HEADERS
	});
}
var Route = createFileRoute("/api/imagine/download/$jobId")({ server: { handlers: { GET: async ({ request, params }) => {
	if (request.headers.get("sec-fetch-site") === "cross-site") return jsonError("Cross-site downloads are not allowed.", 403);
	const visitor = getVisitorFromRequest(request, false);
	if (!visitor) return jsonError("Your visitor session is missing or expired.", 401);
	const jobId = params.jobId;
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) return jsonError("Invalid render reference.", 400);
	const sql = await getSql().catch(() => null);
	if (!sql) return jsonError("The render database is temporarily unavailable.", 503);
	let rows;
	try {
		rows = await sql.query("SELECT status, xai_file_id FROM imagine_jobs WHERE id = $1 AND visitor_hash = $2 LIMIT 1", [jobId, visitor.ownerHash]);
	} catch {
		return jsonError("The render database is temporarily unavailable.", 503);
	}
	const job = rows[0];
	if (!job) return jsonError("Render not found for this visitor.", 404);
	if (job.status !== "done" || !job.xai_file_id) return jsonError("This render has no privately stored video file yet.", 409);
	if (!/^file_[A-Za-z0-9_-]{8,128}$/.test(job.xai_file_id)) return jsonError("The stored video reference is invalid.", 502);
	let downloadAllowed;
	try {
		downloadAllowed = await consumeTokenBucket(sql, {
			key: `download:${visitor.ownerHash}`,
			capacity: 120,
			refillPerSecond: 2
		});
	} catch {
		return jsonError("Download protection is temporarily unavailable.", 503);
	}
	if (!downloadAllowed) return jsonError("Too many downloads. Please slow down.", 429);
	if (job.xai_file_id === "file_devlocalstudio") return await standinResponse(request, jobId);
	if (isWorkspacePreview()) return jsonError("Development mode does not retrieve billed xAI files.", 409);
	const apiKey = process.env.XAI_API_KEY?.trim();
	if (!apiKey) return jsonError("Video downloads are temporarily unavailable.", 503);
	const headers = new Headers({ Authorization: `Bearer ${apiKey}` });
	const range = request.headers.get("range");
	if (range && SINGLE_BYTE_RANGE.test(range)) headers.set("Range", range);
	let upstream;
	const upstreamController = new AbortController();
	const headerTimer = setTimeout(() => upstreamController.abort(), UPSTREAM_HEADERS_TIMEOUT_MS);
	try {
		upstream = await fetch(`${XAI_FILES}/${encodeURIComponent(job.xai_file_id)}/content`, {
			headers,
			signal: upstreamController.signal
		});
	} catch {
		return jsonError("Could not retrieve the stored video from xAI. Try again.", 502);
	} finally {
		clearTimeout(headerTimer);
	}
	if (upstream.status === 416) {
		await upstream.body?.cancel().catch(() => void 0);
		return jsonError("The requested video byte range is invalid.", 416);
	}
	if (!upstream.ok || !upstream.body) {
		const status = upstream.status === 404 ? 410 : 502;
		return jsonError(status === 410 ? "The stored video is no longer available from xAI." : "The video provider could not retrieve this file.", status);
	}
	const upstreamType = (upstream.headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase();
	if (upstreamType && upstreamType !== "video/mp4" && upstreamType !== "application/octet-stream" && upstreamType !== "binary/octet-stream") {
		await upstream.body.cancel().catch(() => void 0);
		return jsonError("The provider returned an unexpected file type.", 502);
	}
	if (Number(upstream.headers.get("content-length") ?? 0) > 314572800) {
		await upstream.body.cancel().catch(() => void 0);
		return jsonError("The stored video exceeds the download safety limit.", 502);
	}
	const upstreamRange = upstream.headers.get("content-range");
	if (upstream.status === 206 && (!upstreamRange || !CONTENT_RANGE.test(upstreamRange))) {
		await upstream.body.cancel().catch(() => void 0);
		return jsonError("The video provider returned an invalid partial-content response.", 502);
	}
	const responseHeaders = new Headers(HEADERS);
	responseHeaders.set("Content-Type", "video/mp4");
	responseHeaders.set("Content-Disposition", `inline; filename="stillwake-${jobId}.mp4"`);
	responseHeaders.set("Accept-Ranges", upstream.status === 206 || upstream.headers.get("accept-ranges") === "bytes" ? "bytes" : "none");
	if (upstreamRange) responseHeaders.set("Content-Range", upstreamRange);
	const upstreamLength = upstream.headers.get("content-length");
	if (upstreamLength && /^\d+$/.test(upstreamLength) && Number(upstreamLength) <= 314572800) responseHeaders.set("Content-Length", upstreamLength);
	return new Response(limitStream(upstream.body, MAX_VIDEO_BYTES), {
		status: upstream.status === 206 ? 206 : 200,
		headers: responseHeaders
	});
} } } });
var rootRouteChildren = {
	IndexRoute: Route$4.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$5
	}),
	ApiImaginePollRoute: Route$3.update({
		id: "/api/imagine/poll",
		path: "/api/imagine/poll",
		getParentRoute: () => Route$5
	}),
	ApiImagineStartRoute: Route$2.update({
		id: "/api/imagine/start",
		path: "/api/imagine/start",
		getParentRoute: () => Route$5
	}),
	ApiImagineStatusRoute: Route$1.update({
		id: "/api/imagine/status",
		path: "/api/imagine/status",
		getParentRoute: () => Route$5
	}),
	ApiImagineDownloadJobIdRoute: Route.update({
		id: "/api/imagine/download/$jobId",
		path: "/api/imagine/download/$jobId",
		getParentRoute: () => Route$5
	})
};
var routeTree = Route$5._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		rewrite: previewPathRewrite(),
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { DEFAULT_CLIP_ASPECT_RATIO as a, IMAGE_INPUT_USD as c, PRESET_VOICES as f, previewPathPrefix as h, CLIP_MODELS as i, estimateClipCost as m, CLIP_ASPECT_RATIOS as n, DEFAULT_CLIP_MODEL as o, VIDEO_USD_PER_SECOND as p, CLIP_DURATIONS as r, DEFAULT_CLIP_RESOLUTION as s, router_exports as t, MAX_PROMPT as u };
