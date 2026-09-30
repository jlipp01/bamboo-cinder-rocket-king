import { i as __toESM } from "../_runtime.mjs";
import { i as require_react, r as require_jsx_runtime, t as useInfiniteQuery } from "../_libs/react+tanstack__react-query.mjs";
import { a as SkipForward, c as Pause, l as LoaderCircle, n as VolumeX, o as Search, r as Volume2, s as Play, t as X, u as Heart } from "../_libs/lucide-react.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-vHQq2DNQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MIRRORS = [
	"https://de1.api.radio-browser.info",
	"https://fi1.api.radio-browser.info",
	"https://at1.api.radio-browser.info"
];
var PLAYABLE = /* @__PURE__ */ new Set([
	"MP3",
	"AAC",
	"AAC+",
	"OGG",
	"OPUS"
]);
var GENRES = [
	{
		id: "",
		label: "Top"
	},
	{
		id: "news",
		label: "News"
	},
	{
		id: "jazz",
		label: "Jazz"
	},
	{
		id: "classical",
		label: "Classical"
	},
	{
		id: "rock",
		label: "Rock"
	},
	{
		id: "pop",
		label: "Pop"
	},
	{
		id: "country",
		label: "Country"
	},
	{
		id: "hiphop",
		label: "Hip-hop"
	},
	{
		id: "electronic",
		label: "Electronic"
	},
	{
		id: "dance",
		label: "Dance"
	},
	{
		id: "talk",
		label: "Talk"
	},
	{
		id: "oldies",
		label: "Oldies"
	},
	{
		id: "blues",
		label: "Blues"
	},
	{
		id: "soul",
		label: "Soul"
	},
	{
		id: "ambient",
		label: "Ambient"
	},
	{
		id: "reggae",
		label: "Reggae"
	}
];
var COUNTRIES = [
	{
		code: "",
		label: "Worldwide"
	},
	{
		code: "US",
		label: "United States"
	},
	{
		code: "GB",
		label: "United Kingdom"
	},
	{
		code: "CA",
		label: "Canada"
	},
	{
		code: "AU",
		label: "Australia"
	},
	{
		code: "DE",
		label: "Germany"
	},
	{
		code: "FR",
		label: "France"
	},
	{
		code: "MX",
		label: "Mexico"
	},
	{
		code: "BR",
		label: "Brazil"
	},
	{
		code: "JP",
		label: "Japan"
	},
	{
		code: "IN",
		label: "India"
	},
	{
		code: "NG",
		label: "Nigeria"
	},
	{
		code: "NL",
		label: "Netherlands"
	},
	{
		code: "IT",
		label: "Italy"
	},
	{
		code: "ES",
		label: "Spain"
	},
	{
		code: "SE",
		label: "Sweden"
	},
	{
		code: "KR",
		label: "South Korea"
	},
	{
		code: "ZA",
		label: "South Africa"
	}
];
var US_STATES = [
	"Alabama",
	"Alaska",
	"Arizona",
	"Arkansas",
	"California",
	"Colorado",
	"Connecticut",
	"Delaware",
	"District of Columbia",
	"Florida",
	"Georgia",
	"Hawaii",
	"Idaho",
	"Illinois",
	"Indiana",
	"Iowa",
	"Kansas",
	"Kentucky",
	"Louisiana",
	"Maine",
	"Maryland",
	"Massachusetts",
	"Michigan",
	"Minnesota",
	"Mississippi",
	"Missouri",
	"Montana",
	"Nebraska",
	"Nevada",
	"New Hampshire",
	"New Jersey",
	"New Mexico",
	"New York",
	"North Carolina",
	"North Dakota",
	"Ohio",
	"Oklahoma",
	"Oregon",
	"Pennsylvania",
	"Rhode Island",
	"South Carolina",
	"South Dakota",
	"Tennessee",
	"Texas",
	"Utah",
	"Vermont",
	"Virginia",
	"Washington",
	"West Virginia",
	"Wisconsin",
	"Wyoming"
];
function asString(value) {
	return typeof value === "string" ? value.trim() : "";
}
function asNumber(value) {
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : 0;
}
function toStation(raw) {
	if (!raw || typeof raw !== "object") return null;
	const row = raw;
	const stationuuid = asString(row.stationuuid);
	const name = asString(row.name);
	const url = asString(row.url);
	const urlResolved = asString(row.url_resolved) || url;
	if (!stationuuid || !name || !/^https?:\/\//i.test(urlResolved)) return null;
	const codec = asString(row.codec).toUpperCase();
	if (codec && !PLAYABLE.has(codec)) return null;
	const tags = asString(row.tags).split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 4);
	return {
		stationuuid,
		name,
		url,
		urlResolved,
		favicon: asString(row.favicon),
		tags,
		country: asString(row.country),
		countrycode: asString(row.countrycode),
		state: asString(row.state),
		language: asString(row.language),
		bitrate: asNumber(row.bitrate),
		codec,
		homepage: asString(row.homepage)
	};
}
function dedupe(stations) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const station of stations) {
		const key = station.name.toLowerCase();
		if (seen.has(station.stationuuid) || seen.has(key)) continue;
		seen.add(station.stationuuid);
		seen.add(key);
		out.push(station);
	}
	return out;
}
async function radioGet(path) {
	let lastError;
	for (const mirror of MIRRORS) try {
		const response = await fetch(`${mirror}${path}`, { headers: { Accept: "application/json" } });
		if (!response.ok) {
			lastError = /* @__PURE__ */ new Error(`Directory responded ${response.status}`);
			continue;
		}
		return await response.json();
	} catch (error) {
		lastError = error;
	}
	throw lastError instanceof Error ? lastError : /* @__PURE__ */ new Error("Directory unavailable");
}
async function searchStations(args) {
	const params = new URLSearchParams();
	params.set("hidebroken", "true");
	params.set("order", "clickcount");
	params.set("reverse", "true");
	params.set("limit", String(args.limit));
	params.set("offset", String(args.offset));
	if (args.name) params.set("name", args.name);
	if (args.tag) params.set("tag", args.tag);
	if (args.countrycode) params.set("countrycode", args.countrycode);
	if (args.state) params.set("state", args.state);
	const payload = await radioGet(`/json/stations/search?${params.toString()}`);
	if (!Array.isArray(payload)) throw new Error("Unexpected directory response");
	return {
		stations: dedupe(payload.map(toStation).filter((station) => station !== null)),
		rawCount: payload.length
	};
}
/** Counts a listen with Radio Browser and returns a fresh stream URL when possible. */
async function resolvePlayUrl(stationuuid) {
	try {
		const payload = await radioGet(`/json/url/${encodeURIComponent(stationuuid)}`);
		if (!payload || typeof payload !== "object") return null;
		const url = asString(payload.url);
		return /^https?:\/\//i.test(url) ? url : null;
	} catch {
		return null;
	}
}
function proxySrc(url) {
	return `/api/stream?src=${encodeURIComponent(url)}`;
}
function stationMeta(station) {
	const country = station.countrycode === "US" ? "United States" : station.country.replace(/^The /, "").replace(/ Of America$/, "");
	return [
		station.state || country,
		station.tags[0],
		station.bitrate > 0 ? `${station.bitrate} kbps` : ""
	].filter(Boolean).slice(0, 3).join(" · ");
}
function safeHomepage(homepage) {
	if (!homepage.startsWith("https://")) return null;
	try {
		const url = new URL(homepage);
		return url.protocol === "https:" ? url.toString() : null;
	} catch {
		return null;
	}
}
var usePlayer = create()(persist((set, get) => ({
	current: null,
	status: "idle",
	error: null,
	volume: .85,
	muted: false,
	favorites: [],
	recents: [],
	setCurrent: (station) => set({
		current: station,
		error: null
	}),
	setStatus: (status, error = null) => set({
		status,
		error
	}),
	setVolume: (volume) => set({
		volume: Math.min(1, Math.max(0, volume)),
		muted: volume === 0
	}),
	setMuted: (muted) => set({ muted }),
	toggleFavorite: (station) => {
		set({ favorites: get().favorites.some((item) => item.stationuuid === station.stationuuid) ? get().favorites.filter((item) => item.stationuuid !== station.stationuuid) : [station, ...get().favorites].slice(0, 200) });
	},
	remember: (station) => {
		set({ recents: [station, ...get().recents.filter((item) => item.stationuuid !== station.stationuuid)].slice(0, 24) });
	},
	isFavorite: (uuid) => get().favorites.some((item) => item.stationuuid === uuid)
}), {
	name: "airwave",
	skipHydration: true,
	partialize: (state) => ({
		current: state.current,
		volume: state.volume,
		muted: state.muted,
		favorites: state.favorites,
		recents: state.recents
	})
}));
var PlaybackContext = (0, import_react.createContext)(null);
function usePlayback() {
	const api = (0, import_react.useContext)(PlaybackContext);
	if (!api) throw new Error("Playback is unavailable");
	return api;
}
var FAIL = "This station isn't responding. Try another.";
function benign(error) {
	if (error instanceof DOMException && error.name === "AbortError") return "ignore";
	if (error instanceof DOMException && error.name === "NotAllowedError") return "blocked";
	return "fail";
}
function streamSrc(url, forceProxy) {
	if (forceProxy || url.startsWith("http://")) return proxySrc(url);
	return url;
}
function PlaybackProvider({ children, queue }) {
	const audioRef = (0, import_react.useRef)(null);
	const gen = (0, import_react.useRef)(0);
	const failing = (0, import_react.useRef)(false);
	const phase = (0, import_react.useRef)(0);
	const loaded = (0, import_react.useRef)(null);
	const counted = (0, import_react.useRef)(null);
	const volume = usePlayer((s) => s.volume);
	const muted = usePlayer((s) => s.muted);
	(0, import_react.useEffect)(() => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.volume = muted ? 0 : volume;
	}, [muted, volume]);
	const failover = (0, import_react.useCallback)(async (station, token) => {
		if (failing.current || phase.current >= 2) return;
		failing.current = true;
		phase.current = 2;
		const audio = audioRef.current;
		try {
			if (!audio || gen.current !== token) return;
			const original = station.urlResolved || station.url;
			if (original.startsWith("https://")) {
				audio.src = streamSrc(original, true);
				try {
					await audio.play();
					return;
				} catch (error) {
					const kind = benign(error);
					if (kind === "ignore" || gen.current !== token) return;
					if (kind === "blocked") {
						usePlayer.getState().setStatus("error", "Tap play once more to start audio.");
						return;
					}
				}
			}
			if (gen.current !== token) return;
			const fresh = await resolvePlayUrl(station.stationuuid);
			if (gen.current !== token) return;
			if (!fresh) {
				usePlayer.getState().setStatus("error", FAIL);
				return;
			}
			audio.src = streamSrc(fresh, true);
			try {
				await audio.play();
			} catch (error) {
				const kind = benign(error);
				if (kind === "ignore" || gen.current !== token) return;
				if (kind === "blocked") {
					usePlayer.getState().setStatus("error", "Tap play once more to start audio.");
					return;
				}
				usePlayer.getState().setStatus("error", FAIL);
			}
		} finally {
			failing.current = false;
		}
	}, []);
	const play = (0, import_react.useCallback)((station) => {
		const audio = audioRef.current;
		if (!audio) return;
		const token = ++gen.current;
		phase.current = 0;
		failing.current = false;
		counted.current = null;
		loaded.current = station.stationuuid;
		const { setCurrent, setStatus, remember } = usePlayer.getState();
		setCurrent(station);
		remember(station);
		setStatus("connecting");
		audio.src = streamSrc(station.urlResolved || station.url, false);
		audio.play().catch((error) => {
			if (gen.current !== token) return;
			const kind = benign(error);
			if (kind === "ignore") return;
			if (kind === "blocked") {
				usePlayer.getState().setStatus("error", "Tap play once more to start audio.");
				return;
			}
			failover(station, token);
		});
	}, [failover]);
	const toggle = (0, import_react.useCallback)(() => {
		const audio = audioRef.current;
		const { current, status } = usePlayer.getState();
		if (!current) return;
		if (!audio || loaded.current !== current.stationuuid) {
			play(current);
			return;
		}
		if (status === "playing" || status === "connecting") {
			audio.pause();
			usePlayer.getState().setStatus("paused");
			return;
		}
		usePlayer.getState().setStatus("connecting");
		audio.play().catch((error) => {
			const kind = benign(error);
			if (kind === "blocked") {
				usePlayer.getState().setStatus("error", "Tap play once more to start audio.");
				return;
			}
			if (kind === "fail") play(current);
		});
	}, [play]);
	(0, import_react.useEffect)(() => {
		const audio = audioRef.current;
		if (!audio) return;
		const onPlaying = () => {
			const station = usePlayer.getState().current;
			usePlayer.getState().setStatus("playing");
			if (station && counted.current !== station.stationuuid) {
				counted.current = station.stationuuid;
				resolvePlayUrl(station.stationuuid);
			}
		};
		const onWaiting = () => {
			if (usePlayer.getState().status === "playing") usePlayer.getState().setStatus("connecting");
		};
		const onError = () => {
			if (audio.error?.code === MediaError.MEDIA_ERR_ABORTED) return;
			const station = usePlayer.getState().current;
			if (!station) return;
			if (phase.current >= 2) {
				if (!failing.current) usePlayer.getState().setStatus("error", FAIL);
				return;
			}
			failover(station, gen.current);
		};
		audio.addEventListener("playing", onPlaying);
		audio.addEventListener("waiting", onWaiting);
		audio.addEventListener("error", onError);
		return () => {
			audio.removeEventListener("playing", onPlaying);
			audio.removeEventListener("waiting", onWaiting);
			audio.removeEventListener("error", onError);
		};
	}, [failover]);
	(0, import_react.useEffect)(() => {
		function onKey(event) {
			if (event.code !== "Space" || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
			const target = event.target;
			if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
			event.preventDefault();
			toggle();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [toggle]);
	const skip = (0, import_react.useCallback)(() => {
		if (queue.length < 2) return;
		const current = usePlayer.getState().current;
		const next = queue[(queue.findIndex((station) => station.stationuuid === current?.stationuuid) + 1) % queue.length];
		if (next && next.stationuuid !== current?.stationuuid) play(next);
	}, [play, queue]);
	const playFirst = (0, import_react.useCallback)(() => {
		if (usePlayer.getState().current) toggle();
		else if (queue[0]) play(queue[0]);
	}, [
		play,
		queue,
		toggle
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PlaybackContext.Provider, {
		value: {
			play,
			toggle
		},
		children: [
			children,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
				ref: audioRef,
				preload: "none",
				playsInline: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayerDock, {
				queueLength: queue.length,
				onToggle: playFirst,
				onSkip: skip
			})
		]
	});
}
function PlayerDock({ queueLength, onToggle, onSkip }) {
	const current = usePlayer((s) => s.current);
	const status = usePlayer((s) => s.status);
	const error = usePlayer((s) => s.error);
	const volume = usePlayer((s) => s.volume);
	const muted = usePlayer((s) => s.muted);
	const favorites = usePlayer((s) => s.favorites);
	const setVolume = usePlayer((s) => s.setVolume);
	const setMuted = usePlayer((s) => s.setMuted);
	const toggleFavorite = usePlayer((s) => s.toggleFavorite);
	const saved = current ? favorites.some((station) => station.stationuuid === current.stationuuid) : false;
	const site = current ? safeHomepage(current.homepage) : null;
	const busy = status === "connecting";
	const playing = status === "playing" || busy;
	function mute() {
		if (muted || volume === 0) {
			setMuted(false);
			if (volume === 0) setVolume(.85);
			return;
		}
		setMuted(true);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "dock-safe mx-auto flex max-w-6xl flex-col gap-1 px-4 pt-3 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { station: current }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [status === "playing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eq, {}) : null, status === "playing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-live",
									children: "Live"
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-display text-lg leading-tight text-fg",
								children: current ? current.name : "Choose a station"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: `truncate text-sm ${status === "error" ? "text-live" : "text-muted"}`,
								children: [status === "error" ? error : status === "connecting" ? "Connecting" : current ? stationMeta(current) : "Search, or start with what is popular right now.", site && status !== "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [" · ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: site,
									target: "_blank",
									rel: "noreferrer",
									className: "underline decoration-border underline-offset-2 hover:text-fg",
									children: "Site"
								})] }) : null]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": saved ? "Remove from saved" : "Save station",
						"aria-pressed": saved,
						disabled: !current,
						onClick: () => current && toggleFavorite(current),
						className: "grid size-11 place-items-center rounded-full text-fg disabled:opacity-40",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: `size-5 ${saved ? "fill-current" : "text-muted"}` })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Next station",
						disabled: queueLength < 2,
						onClick: onSkip,
						className: "hidden size-11 place-items-center rounded-full text-fg disabled:opacity-40 sm:grid",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": playing ? "Pause" : "Play",
						disabled: !current && queueLength === 0,
						onClick: onToggle,
						className: "grid size-12 place-items-center rounded-full bg-accent text-accent-fg disabled:opacity-40",
						children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin motion-reduce:animate-none" }) : playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-5" })
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": muted || volume === 0 ? "Unmute" : "Mute",
						onClick: mute,
						className: "grid size-11 place-items-center text-muted",
						children: muted || volume === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: 0,
						max: 1,
						step: .01,
						value: muted ? 0 : volume,
						"aria-label": "Volume",
						onChange: (event) => setVolume(Number(event.target.value)),
						className: "w-full sm:max-w-48"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Next station",
						disabled: queueLength < 2,
						onClick: onSkip,
						className: "grid size-11 place-items-center text-fg disabled:opacity-40 sm:hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, { className: "size-5" })
					})
				]
			})]
		})
	});
}
function Mark({ station }) {
	const src = station?.favicon.startsWith("https://") ? station.favicon : "";
	const letter = (station?.name ?? "A").replace(/[^A-Za-z0-9]/g, "").slice(0, 1).toUpperCase() || "A";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "grid size-12 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-2 text-sm font-medium text-fg",
		children: src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
			src,
			letter
		}) : letter
	});
}
function Cover({ src, letter }) {
	const [failed, setFailed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setFailed(false), [src]);
	if (failed) return letter;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src,
		alt: "",
		className: "size-full object-cover",
		onError: () => setFailed(true)
	});
}
function Eq() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "flex h-3 items-end gap-0.5",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "eq-bar block h-3 w-0.5 bg-live" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "eq-bar block h-3 w-0.5 bg-live" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "eq-bar block h-3 w-0.5 bg-live" })
		]
	});
}
var fieldClass = "h-11 rounded-md border border-border bg-bg px-3 text-sm text-fg outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
function AirwaveApp() {
	const [view, setView] = (0, import_react.useState)("discover");
	const [query, setQuery] = (0, import_react.useState)("");
	const [genre, setGenre] = (0, import_react.useState)("");
	const [country, setCountry] = (0, import_react.useState)("US");
	const [stateName, setStateName] = (0, import_react.useState)("");
	const [mounted, setMounted] = (0, import_react.useState)(false);
	const debounced = useDebounced(query.trim(), 280);
	const favorites = usePlayer((s) => s.favorites);
	const recents = usePlayer((s) => s.recents);
	(0, import_react.useEffect)(() => {
		usePlayer.persist.rehydrate();
		setMounted(true);
	}, []);
	const directory = useInfiniteQuery({
		queryKey: [
			"stations",
			debounced,
			genre,
			country,
			stateName
		],
		initialPageParam: 0,
		queryFn: ({ pageParam }) => searchStations({
			name: debounced,
			tag: genre,
			countrycode: country,
			state: country === "US" ? stateName : "",
			offset: pageParam,
			limit: 40
		}),
		getNextPageParam: (last, _pages, lastOffset) => last.rawCount < 40 ? void 0 : lastOffset + 40,
		enabled: mounted
	});
	const discovered = directory.data?.pages.flatMap((page) => page.stations) ?? [];
	const list = view === "saved" ? favorites : view === "recent" ? recents : discovered;
	const genreLabel = GENRES.find((item) => item.id === genre)?.label ?? "Top";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaybackProvider, {
		queue: list,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-h-dvh overflow-x-hidden bg-bg text-fg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex min-h-dvh max-w-6xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-6 border-r border-border p-6 lg:flex",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-3xl leading-none text-fg",
							children: "Airwave"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "Live radio from the open web."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Nav, {
							view,
							saved: favorites.length,
							recent: recents.length,
							onChange: setView
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-auto text-xs leading-relaxed text-subtle",
							children: [
								"Stations come from the",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "https://www.radio-browser.info/",
									target: "_blank",
									rel: "noreferrer",
									className: "text-muted underline decoration-border underline-offset-2",
									children: "Radio Browser"
								}),
								" ",
								"directory. Saved stations stay on this device."
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "px-4 pt-6 pb-4 sm:px-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-4xl leading-none text-fg",
								children: "Airwave"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: "Find a station. Press play."
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 lg:mt-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Nav, {
									view,
									saved: favorites.length,
									recent: recents.length,
									onChange: setView,
									className: "mb-4 lg:hidden"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-3 sm:flex-row",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "relative min-w-0 flex-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "sr-only",
													children: "Search stations"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													value: query,
													onChange: (event) => {
														setQuery(event.target.value);
														setView("discover");
													},
													placeholder: "Search stations, cities, shows",
													className: `${fieldClass} w-full pr-11 pl-10`
												}),
												query ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													"aria-label": "Clear search",
													onClick: () => setQuery(""),
													className: "absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
												}) : null
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											"aria-label": "Country",
											value: country,
											onChange: (event) => {
												setCountry(event.target.value);
												setView("discover");
											},
											className: `${fieldClass} sm:w-48`,
											children: COUNTRIES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: item.code,
												children: item.label
											}, item.code || "world"))
										}),
										country === "US" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											"aria-label": "State",
											value: stateName,
											onChange: (event) => {
												setStateName(event.target.value);
												setView("discover");
											},
											className: `${fieldClass} sm:w-48`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "All states"
											}), US_STATES.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: name,
												children: name
											}, name))]
										}) : null
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "no-scrollbar mt-3 flex gap-2 overflow-x-auto",
									children: GENRES.map((item) => {
										const active = genre === item.id;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": active,
											onClick: () => {
												setGenre(item.id);
												setView("discover");
											},
											className: `h-11 shrink-0 rounded-full border px-4 text-sm font-medium ${active ? "border-accent bg-accent text-accent-fg" : "border-border bg-transparent text-muted"}`,
											children: item.label
										}, item.id || "top");
									})
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						className: "px-4 pb-44 sm:px-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-3 flex items-end justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-2xl leading-tight text-fg",
									children: view === "saved" ? "Saved" : view === "recent" ? "Recent" : debounced ? `“${debounced}”` : genre ? genreLabel : "Popular now"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "shrink-0 text-sm text-muted tabular-nums",
									children: view === "discover" && directory.isPending ? "…" : `${list.length}`
								})]
							}),
							view === "discover" && directory.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border bg-surface px-4 py-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-fg",
									children: "Couldn’t reach the station directory."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void directory.refetch(),
									className: "mt-4 h-11 rounded-full border border-border px-4 text-sm font-medium text-fg",
									children: "Try again"
								})]
							}) : view === "discover" && directory.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonList, {}) : list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { view }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: list.map((station) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StationRow, { station }, station.stationuuid)) }),
							view === "discover" && directory.hasNextPage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: directory.isFetchingNextPage,
								onClick: () => void directory.fetchNextPage(),
								className: "mt-4 h-11 rounded-full border border-border px-5 text-sm font-medium text-fg disabled:opacity-40",
								children: directory.isFetchingNextPage ? "Loading" : "More stations"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-8 text-xs text-subtle lg:hidden",
								children: [
									"Directory by",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: "https://www.radio-browser.info/",
										className: "text-muted underline decoration-border underline-offset-2",
										target: "_blank",
										rel: "noreferrer",
										children: "Radio Browser"
									}),
									". Saved stations stay on this device."
								]
							})
						]
					})]
				})]
			})
		})
	});
}
function Nav({ view, saved, recent, onChange, className = "" }) {
	const items = [
		{
			id: "discover",
			label: "Discover"
		},
		{
			id: "saved",
			label: "Saved",
			count: saved
		},
		{
			id: "recent",
			label: "Recent",
			count: recent
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: `flex gap-2 lg:flex-col ${className}`,
		children: items.map((item) => {
			const active = view === item.id;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				"aria-current": active ? "page" : void 0,
				onClick: () => onChange(item.id),
				className: `flex h-11 flex-1 items-center justify-between rounded-md px-3 text-sm font-medium lg:flex-none ${active ? "bg-surface-2 text-fg" : "text-muted"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label }), item.count ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tabular-nums text-subtle",
					children: item.count
				}) : null]
			}, item.id);
		})
	});
}
function StationRow({ station }) {
	const { play, toggle } = usePlayback();
	const current = usePlayer((s) => s.current);
	const status = usePlayer((s) => s.status);
	const favorites = usePlayer((s) => s.favorites);
	const toggleFavorite = usePlayer((s) => s.toggleFavorite);
	const active = current?.stationuuid === station.stationuuid;
	const live = active && (status === "playing" || status === "connecting");
	const saved = favorites.some((item) => item.stationuuid === station.stationuuid);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
		className: "border-b border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `flex items-center gap-3 py-2 ${active ? "-mx-2 rounded-lg bg-surface px-2" : ""}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => active ? toggle() : play(station),
				className: "flex min-w-0 flex-1 items-center gap-3 py-1 text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { station }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block truncate font-medium text-fg",
						children: station.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block truncate text-sm text-muted",
						children: live ? status === "connecting" ? "Connecting" : "Playing" : stationMeta(station)
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": saved ? `Remove ${station.name} from saved` : `Save ${station.name}`,
				"aria-pressed": saved,
				onClick: () => toggleFavorite(station),
				className: "grid size-11 shrink-0 place-items-center rounded-full text-fg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: `size-5 ${saved ? "fill-current" : "text-muted"}` })
			})]
		})
	});
}
function Empty({ view }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-lg border border-border px-4 py-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-sm text-sm text-muted",
			children: view === "saved" ? "No saved stations yet. Tap the heart on one you want to keep." : view === "recent" ? "Stations you play will show up here." : "No stations match that search. Try another name or genre."
		})
	});
}
function SkeletonList() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		"aria-hidden": "true",
		children: Array.from({ length: 8 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex items-center gap-3 border-b border-border py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-12 animate-pulse rounded-md bg-surface-2 motion-reduce:animate-none" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "block h-4 w-2/3 animate-pulse rounded-sm bg-surface-2 motion-reduce:animate-none" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-2 block h-3 w-1/3 animate-pulse rounded-sm bg-surface-2 motion-reduce:animate-none" })]
			})]
		}, index))
	});
}
function useDebounced(value, delay) {
	const [debounced, setDebounced] = (0, import_react.useState)(value);
	(0, import_react.useEffect)(() => {
		const timer = window.setTimeout(() => setDebounced(value), delay);
		return () => window.clearTimeout(timer);
	}, [delay, value]);
	return debounced;
}
var SplitComponent = AirwaveApp;
//#endregion
export { SplitComponent as component };
