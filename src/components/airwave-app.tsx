import { useInfiniteQuery } from "@tanstack/react-query";
import { Heart, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Mark, PlaybackProvider, usePlayback } from "@/components/playback";
import { usePlayer } from "@/lib/player-store";
import {
  COUNTRIES,
  GENRES,
  US_STATES,
  searchStations,
  stationMeta,
  type Station,
} from "@/lib/stations";

type View = "discover" | "saved" | "recent";

const fieldClass =
  "h-11 rounded-md border border-border bg-bg px-3 text-sm text-fg outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function AirwaveApp() {
  const [view, setView] = useState<View>("discover");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [country, setCountry] = useState("US");
  const [stateName, setStateName] = useState("");
  const [mounted, setMounted] = useState(false);
  const debounced = useDebounced(query.trim(), 280);
  const favorites = usePlayer((s) => s.favorites);
  const recents = usePlayer((s) => s.recents);

  useEffect(() => {
    void usePlayer.persist.rehydrate();
    setMounted(true);
  }, []);

  const directory = useInfiniteQuery({
    queryKey: ["stations", debounced, genre, country, stateName],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      searchStations({
        name: debounced,
        tag: genre,
        countrycode: country,
        state: country === "US" ? stateName : "",
        offset: pageParam,
        limit: 40,
      }),
    getNextPageParam: (last, _pages, lastOffset) => (last.rawCount < 40 ? undefined : lastOffset + 40),
    enabled: mounted,
  });

  const discovered = directory.data?.pages.flatMap((page) => page.stations) ?? [];
  const list = view === "saved" ? favorites : view === "recent" ? recents : discovered;
  const genreLabel = GENRES.find((item) => item.id === genre)?.label ?? "Top";

  return (
    <PlaybackProvider queue={list}>
      <div className="min-h-dvh overflow-x-hidden bg-bg text-fg">
        <div className="mx-auto flex min-h-dvh max-w-6xl">
          <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-6 border-r border-border p-6 lg:flex">
            <div>
              <p className="font-display text-3xl leading-none text-fg">Airwave</p>
              <p className="mt-2 text-sm text-muted">Live radio from the open web.</p>
            </div>
            <Nav view={view} saved={favorites.length} recent={recents.length} onChange={setView} />
            <p className="mt-auto text-xs leading-relaxed text-subtle">
              Stations come from the{" "}
              <a
                href="https://www.radio-browser.info/"
                target="_blank"
                rel="noreferrer"
                className="text-muted underline decoration-border underline-offset-2"
              >
                Radio Browser
              </a>{" "}
              directory. Saved stations stay on this device.
            </p>
          </aside>
          <div className="min-w-0 flex-1">
            <header className="px-4 pt-6 pb-4 sm:px-6">
              <div className="lg:hidden">
                <h1 className="font-display text-4xl leading-none text-fg">Airwave</h1>
                <p className="mt-2 text-sm text-muted">Find a station. Press play.</p>
              </div>
              <div className="mt-5 lg:mt-0">
                <Nav
                  view={view}
                  saved={favorites.length}
                  recent={recents.length}
                  onChange={setView}
                  className="mb-4 lg:hidden"
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="relative min-w-0 flex-1">
                    <span className="sr-only">Search stations</span>
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
                    <input
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setView("discover");
                      }}
                      placeholder="Search stations, cities, shows"
                      className={`${fieldClass} w-full pr-11 pl-10`}
                    />
                    {query ? (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setQuery("")}
                        className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted"
                      >
                        <X className="size-4" />
                      </button>
                    ) : null}
                  </label>
                  <select
                    aria-label="Country"
                    value={country}
                    onChange={(event) => {
                      setCountry(event.target.value);
                      setView("discover");
                    }}
                    className={`${fieldClass} sm:w-48`}
                  >
                    {COUNTRIES.map((item) => (
                      <option key={item.code || "world"} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  {country === "US" ? (
                    <select
                      aria-label="State"
                      value={stateName}
                      onChange={(event) => {
                        setStateName(event.target.value);
                        setView("discover");
                      }}
                      className={`${fieldClass} sm:w-48`}
                    >
                      <option value="">All states</option>
                      {US_STATES.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
                <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                  {GENRES.map((item) => {
                    const active = genre === item.id;
                    return (
                      <button
                        key={item.id || "top"}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setGenre(item.id);
                          setView("discover");
                        }}
                        className={`h-11 shrink-0 rounded-full border px-4 text-sm font-medium ${
                          active
                            ? "border-accent bg-accent text-accent-fg"
                            : "border-border bg-transparent text-muted"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </header>
            <main className="px-4 pb-44 sm:px-6">
              <div className="mb-3 flex items-end justify-between gap-3">
                <h2 className="font-display text-2xl leading-tight text-fg">
                  {view === "saved"
                    ? "Saved"
                    : view === "recent"
                      ? "Recent"
                      : debounced
                        ? `“${debounced}”`
                        : genre
                          ? genreLabel
                          : "Popular now"}
                </h2>
                <p className="shrink-0 text-sm text-muted tabular-nums">
                  {view === "discover" && directory.isPending ? "…" : `${list.length}`}
                </p>
              </div>
              {view === "discover" && directory.isError ? (
                <div className="rounded-lg border border-border bg-surface px-4 py-6">
                  <p className="text-sm text-fg">Couldn’t reach the station directory.</p>
                  <button
                    type="button"
                    onClick={() => void directory.refetch()}
                    className="mt-4 h-11 rounded-full border border-border px-4 text-sm font-medium text-fg"
                  >
                    Try again
                  </button>
                </div>
              ) : view === "discover" && directory.isPending ? (
                <SkeletonList />
              ) : list.length === 0 ? (
                <Empty view={view} />
              ) : (
                <ul>
                  {list.map((station) => (
                    <StationRow key={station.stationuuid} station={station} />
                  ))}
                </ul>
              )}
              {view === "discover" && directory.hasNextPage ? (
                <button
                  type="button"
                  disabled={directory.isFetchingNextPage}
                  onClick={() => void directory.fetchNextPage()}
                  className="mt-4 h-11 rounded-full border border-border px-5 text-sm font-medium text-fg disabled:opacity-40"
                >
                  {directory.isFetchingNextPage ? "Loading" : "More stations"}
                </button>
              ) : null}
              <p className="mt-8 text-xs text-subtle lg:hidden">
                Directory by{" "}
                <a
                  href="https://www.radio-browser.info/"
                  className="text-muted underline decoration-border underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  Radio Browser
                </a>
                . Saved stations stay on this device.
              </p>
            </main>
          </div>
        </div>
      </div>
    </PlaybackProvider>
  );
}

function Nav({
  view,
  saved,
  recent,
  onChange,
  className = "",
}: {
  view: View;
  saved: number;
  recent: number;
  onChange: (view: View) => void;
  className?: string;
}) {
  const items: { id: View; label: string; count?: number }[] = [
    { id: "discover", label: "Discover" },
    { id: "saved", label: "Saved", count: saved },
    { id: "recent", label: "Recent", count: recent },
  ];
  return (
    <nav className={`flex gap-2 lg:flex-col ${className}`}>
      {items.map((item) => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.id)}
            className={`flex h-11 flex-1 items-center justify-between rounded-md px-3 text-sm font-medium lg:flex-none ${
              active ? "bg-surface-2 text-fg" : "text-muted"
            }`}
          >
            <span>{item.label}</span>
            {item.count ? <span className="tabular-nums text-subtle">{item.count}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}

function StationRow({ station }: { station: Station }) {
  const { play, toggle } = usePlayback();
  const current = usePlayer((s) => s.current);
  const status = usePlayer((s) => s.status);
  const favorites = usePlayer((s) => s.favorites);
  const toggleFavorite = usePlayer((s) => s.toggleFavorite);
  const active = current?.stationuuid === station.stationuuid;
  const live = active && (status === "playing" || status === "connecting");
  const saved = favorites.some((item) => item.stationuuid === station.stationuuid);

  return (
    <li className="border-b border-border">
      <div className={`flex items-center gap-3 py-2 ${active ? "-mx-2 rounded-lg bg-surface px-2" : ""}`}>
        <button
          type="button"
          onClick={() => (active ? toggle() : play(station))}
          className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
        >
          <Mark station={station} />
          <span className="min-w-0">
            <span className="block truncate font-medium text-fg">{station.name}</span>
            <span className="block truncate text-sm text-muted">
              {live ? (status === "connecting" ? "Connecting" : "Playing") : stationMeta(station)}
            </span>
          </span>
        </button>
        <button
          type="button"
          aria-label={saved ? `Remove ${station.name} from saved` : `Save ${station.name}`}
          aria-pressed={saved}
          onClick={() => toggleFavorite(station)}
          className="grid size-11 shrink-0 place-items-center rounded-full text-fg"
        >
          <Heart className={`size-5 ${saved ? "fill-current" : "text-muted"}`} />
        </button>
      </div>
    </li>
  );
}

function Empty({ view }: { view: View }) {
  const copy =
    view === "saved"
      ? "No saved stations yet. Tap the heart on one you want to keep."
      : view === "recent"
        ? "Stations you play will show up here."
        : "No stations match that search. Try another name or genre.";
  return (
    <div className="rounded-lg border border-border px-4 py-8">
      <p className="max-w-sm text-sm text-muted">{copy}</p>
    </div>
  );
}

function SkeletonList() {
  return (
    <ul aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <li key={index} className="flex items-center gap-3 border-b border-border py-3">
          <span className="size-12 animate-pulse rounded-md bg-surface-2 motion-reduce:animate-none" />
          <span className="min-w-0 flex-1">
            <span className="block h-4 w-2/3 animate-pulse rounded-sm bg-surface-2 motion-reduce:animate-none" />
            <span className="mt-2 block h-3 w-1/3 animate-pulse rounded-sm bg-surface-2 motion-reduce:animate-none" />
          </span>
        </li>
      ))}
    </ul>
  );
}

function useDebounced(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}
