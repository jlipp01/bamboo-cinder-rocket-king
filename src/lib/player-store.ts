import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Station } from "@/lib/stations";

export type PlayStatus = "idle" | "connecting" | "playing" | "paused" | "error";

type PlayerState = {
  current: Station | null;
  status: PlayStatus;
  error: string | null;
  volume: number;
  muted: boolean;
  favorites: Station[];
  recents: Station[];
  setCurrent: (station: Station | null) => void;
  setStatus: (status: PlayStatus, error?: string | null) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleFavorite: (station: Station) => void;
  remember: (station: Station) => void;
  isFavorite: (uuid: string) => boolean;
};

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      current: null,
      status: "idle",
      error: null,
      volume: 0.85,
      muted: false,
      favorites: [],
      recents: [],
      setCurrent: (station) => set({ current: station, error: null }),
      setStatus: (status, error = null) => set({ status, error }),
      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)), muted: volume === 0 }),
      setMuted: (muted) => set({ muted }),
      toggleFavorite: (station) => {
        const exists = get().favorites.some((item) => item.stationuuid === station.stationuuid);
        set({
          favorites: exists
            ? get().favorites.filter((item) => item.stationuuid !== station.stationuuid)
            : [station, ...get().favorites].slice(0, 200),
        });
      },
      remember: (station) => {
        const rest = get().recents.filter((item) => item.stationuuid !== station.stationuuid);
        set({ recents: [station, ...rest].slice(0, 24) });
      },
      isFavorite: (uuid) => get().favorites.some((item) => item.stationuuid === uuid),
    }),
    {
      name: "airwave",
      skipHydration: true,
      partialize: (state) => ({
        current: state.current,
        volume: state.volume,
        muted: state.muted,
        favorites: state.favorites,
        recents: state.recents,
      }),
    },
  ),
);
