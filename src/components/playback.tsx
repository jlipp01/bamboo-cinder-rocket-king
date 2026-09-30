import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Heart, LoaderCircle, Pause, Play, SkipForward, Volume2, VolumeX } from "lucide-react";
import { proxySrc, resolvePlayUrl, safeHomepage, stationMeta, type Station } from "@/lib/stations";
import { usePlayer } from "@/lib/player-store";

type PlaybackApi = {
  play: (station: Station) => void;
  toggle: () => void;
};

const PlaybackContext = createContext<PlaybackApi | null>(null);

export function usePlayback(): PlaybackApi {
  const api = useContext(PlaybackContext);
  if (!api) throw new Error("Playback is unavailable");
  return api;
}

const FAIL = "This station isn't responding. Try another.";

function benign(error: unknown): "ignore" | "blocked" | "fail" {
  if (error instanceof DOMException && error.name === "AbortError") return "ignore";
  if (error instanceof DOMException && error.name === "NotAllowedError") return "blocked";
  return "fail";
}

function streamSrc(url: string, forceProxy: boolean): string {
  if (forceProxy || url.startsWith("http://")) return proxySrc(url);
  return url;
}

export function PlaybackProvider({ children, queue }: { children: ReactNode; queue: Station[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const gen = useRef(0);
  const failing = useRef(false);
  const phase = useRef(0);
  const loaded = useRef<string | null>(null);
  const counted = useRef<string | null>(null);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [muted, volume]);

  const failover = useCallback(async (station: Station, token: number) => {
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

  const play = useCallback(
    (station: Station) => {
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
      const url = station.urlResolved || station.url;
      audio.src = streamSrc(url, false);
      void audio.play().catch((error: unknown) => {
        if (gen.current !== token) return;
        const kind = benign(error);
        if (kind === "ignore") return;
        if (kind === "blocked") {
          usePlayer.getState().setStatus("error", "Tap play once more to start audio.");
          return;
        }
        void failover(station, token);
      });
    },
    [failover],
  );

  const toggle = useCallback(() => {
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
    void audio.play().catch((error: unknown) => {
      const kind = benign(error);
      if (kind === "blocked") {
        usePlayer.getState().setStatus("error", "Tap play once more to start audio.");
        return;
      }
      if (kind === "fail") play(current);
    });
  }, [play]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlaying = () => {
      const station = usePlayer.getState().current;
      usePlayer.getState().setStatus("playing");
      if (station && counted.current !== station.stationuuid) {
        counted.current = station.stationuuid;
        void resolvePlayUrl(station.stationuuid);
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
      void failover(station, gen.current);
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

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.code !== "Space" || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      event.preventDefault();
      toggle();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const skip = useCallback(() => {
    if (queue.length < 2) return;
    const current = usePlayer.getState().current;
    const index = queue.findIndex((station) => station.stationuuid === current?.stationuuid);
    const next = queue[(index + 1) % queue.length];
    if (next && next.stationuuid !== current?.stationuuid) play(next);
  }, [play, queue]);

  const playFirst = useCallback(() => {
    const current = usePlayer.getState().current;
    if (current) toggle();
    else if (queue[0]) play(queue[0]);
  }, [play, queue, toggle]);

  return (
    <PlaybackContext.Provider value={{ play, toggle }}>
      {children}
      <audio ref={audioRef} preload="none" playsInline />
      <PlayerDock queueLength={queue.length} onToggle={playFirst} onSkip={skip} />
    </PlaybackContext.Provider>
  );
}

function PlayerDock({
  queueLength,
  onToggle,
  onSkip,
}: {
  queueLength: number;
  onToggle: () => void;
  onSkip: () => void;
}) {
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
      if (volume === 0) setVolume(0.85);
      return;
    }
    setMuted(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface">
      <div className="dock-safe mx-auto flex max-w-6xl flex-col gap-1 px-4 pt-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Mark station={current} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {status === "playing" ? <Eq /> : null}
              {status === "playing" ? <span className="text-xs font-medium text-live">Live</span> : null}
            </div>
            <p className="truncate font-display text-lg leading-tight text-fg">
              {current ? current.name : "Choose a station"}
            </p>
            <p className={`truncate text-sm ${status === "error" ? "text-live" : "text-muted"}`}>
              {status === "error"
                ? error
                : status === "connecting"
                  ? "Connecting"
                  : current
                    ? stationMeta(current)
                    : "Search, or start with what is popular right now."}
              {site && status !== "error" ? (
                <>
                  {" · "}
                  <a
                    href={site}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-border underline-offset-2 hover:text-fg"
                  >
                    Site
                  </a>
                </>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            aria-label={saved ? "Remove from saved" : "Save station"}
            aria-pressed={saved}
            disabled={!current}
            onClick={() => current && toggleFavorite(current)}
            className="grid size-11 place-items-center rounded-full text-fg disabled:opacity-40"
          >
            <Heart className={`size-5 ${saved ? "fill-current" : "text-muted"}`} />
          </button>
          <button
            type="button"
            aria-label="Next station"
            disabled={queueLength < 2}
            onClick={onSkip}
            className="hidden size-11 place-items-center rounded-full text-fg disabled:opacity-40 sm:grid"
          >
            <SkipForward className="size-5" />
          </button>
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            disabled={!current && queueLength === 0}
            onClick={onToggle}
            className="grid size-12 place-items-center rounded-full bg-accent text-accent-fg disabled:opacity-40"
          >
            {busy ? (
              <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />
            ) : playing ? (
              <Pause className="size-5" />
            ) : (
              <Play className="size-5" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
            onClick={mute}
            className="grid size-11 place-items-center text-muted"
          >
            {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            aria-label="Volume"
            onChange={(event) => setVolume(Number(event.target.value))}
            className="w-full sm:max-w-48"
          />
          <button
            type="button"
            aria-label="Next station"
            disabled={queueLength < 2}
            onClick={onSkip}
            className="grid size-11 place-items-center text-fg disabled:opacity-40 sm:hidden"
          >
            <SkipForward className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Mark({ station }: { station: Station | null }) {
  const src = station?.favicon.startsWith("https://") ? station.favicon : "";
  const letter = (station?.name ?? "A").replace(/[^A-Za-z0-9]/g, "").slice(0, 1).toUpperCase() || "A";
  return (
    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-2 text-sm font-medium text-fg">
      {src ? <Cover src={src} letter={letter} /> : letter}
    </span>
  );
}

function Cover({ src, letter }: { src: string; letter: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (failed) return letter;
  return <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />;
}

function Eq() {
  return (
    <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
      <span className="eq-bar block h-3 w-0.5 bg-live" />
      <span className="eq-bar block h-3 w-0.5 bg-live" />
      <span className="eq-bar block h-3 w-0.5 bg-live" />
    </span>
  );
}
