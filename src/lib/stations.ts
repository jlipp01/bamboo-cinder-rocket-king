export type Station = {
  stationuuid: string;
  name: string;
  url: string;
  urlResolved: string;
  favicon: string;
  tags: string[];
  country: string;
  countrycode: string;
  state: string;
  language: string;
  bitrate: number;
  codec: string;
  homepage: string;
};

export type SearchArgs = {
  name?: string;
  tag?: string;
  countrycode?: string;
  state?: string;
  offset: number;
  limit: number;
};

export type SearchPage = {
  stations: Station[];
  rawCount: number;
};

const MIRRORS = [
  "https://de1.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
];

const PLAYABLE = new Set(["MP3", "AAC", "AAC+", "OGG", "OPUS"]);

export const GENRES: { id: string; label: string }[] = [
  { id: "", label: "Top" },
  { id: "news", label: "News" },
  { id: "jazz", label: "Jazz" },
  { id: "classical", label: "Classical" },
  { id: "rock", label: "Rock" },
  { id: "pop", label: "Pop" },
  { id: "country", label: "Country" },
  { id: "hiphop", label: "Hip-hop" },
  { id: "electronic", label: "Electronic" },
  { id: "dance", label: "Dance" },
  { id: "talk", label: "Talk" },
  { id: "oldies", label: "Oldies" },
  { id: "blues", label: "Blues" },
  { id: "soul", label: "Soul" },
  { id: "ambient", label: "Ambient" },
  { id: "reggae", label: "Reggae" },
];

export const COUNTRIES: { code: string; label: string }[] = [
  { code: "", label: "Worldwide" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "MX", label: "Mexico" },
  { code: "BR", label: "Brazil" },
  { code: "JP", label: "Japan" },
  { code: "IN", label: "India" },
  { code: "NG", label: "Nigeria" },
  { code: "NL", label: "Netherlands" },
  { code: "IT", label: "Italy" },
  { code: "ES", label: "Spain" },
  { code: "SE", label: "Sweden" },
  { code: "KR", label: "South Korea" },
  { code: "ZA", label: "South Africa" },
];

export const US_STATES = [
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
  "Wyoming",
];

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toStation(raw: unknown): Station | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const stationuuid = asString(row.stationuuid);
  const name = asString(row.name);
  const url = asString(row.url);
  const urlResolved = asString(row.url_resolved) || url;
  if (!stationuuid || !name || !/^https?:\/\//i.test(urlResolved)) return null;
  const codec = asString(row.codec).toUpperCase();
  if (codec && !PLAYABLE.has(codec)) return null;
  const tags = asString(row.tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4);
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
    homepage: asString(row.homepage),
  };
}

function dedupe(stations: Station[]): Station[] {
  const seen = new Set<string>();
  const out: Station[] = [];
  for (const station of stations) {
    const key = station.name.toLowerCase();
    if (seen.has(station.stationuuid) || seen.has(key)) continue;
    seen.add(station.stationuuid);
    seen.add(key);
    out.push(station);
  }
  return out;
}

async function radioGet(path: string): Promise<unknown> {
  let lastError: unknown;
  for (const mirror of MIRRORS) {
    try {
      const response = await fetch(`${mirror}${path}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        lastError = new Error(`Directory responded ${response.status}`);
        continue;
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Directory unavailable");
}

export async function searchStations(args: SearchArgs): Promise<SearchPage> {
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
  if (!Array.isArray(payload)) {
    throw new Error("Unexpected directory response");
  }
  const stations = dedupe(
    payload.map(toStation).filter((station): station is Station => station !== null),
  );
  return { stations, rawCount: payload.length };
}

/** Counts a listen with Radio Browser and returns a fresh stream URL when possible. */
export async function resolvePlayUrl(stationuuid: string): Promise<string | null> {
  try {
    const payload = await radioGet(`/json/url/${encodeURIComponent(stationuuid)}`);
    if (!payload || typeof payload !== "object") return null;
    const url = asString((payload as { url?: unknown }).url);
    return /^https?:\/\//i.test(url) ? url : null;
  } catch {
    return null;
  }
}

export function proxySrc(url: string): string {
  return `/api/stream?src=${encodeURIComponent(url)}`;
}

export function stationMeta(station: Station): string {
  const country =
    station.countrycode === "US"
      ? "United States"
      : station.country.replace(/^The /, "").replace(/ Of America$/, "");
  const place = station.state || country;
  const bits = [place, station.tags[0], station.bitrate > 0 ? `${station.bitrate} kbps` : ""].filter(Boolean);
  return bits.slice(0, 3).join(" · ");
}

export function safeHomepage(homepage: string): string | null {
  if (!homepage.startsWith("https://")) return null;
  try {
    const url = new URL(homepage);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
