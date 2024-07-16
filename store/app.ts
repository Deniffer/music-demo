import { Song } from "@/types/song";
import { create } from "zustand";

export interface AppState {
  isSiderOpen: boolean;
  currentSong: Song | null;
  playlist: Song[];
  currentSongIndex: number;
  theme: string;
}

export interface AppStore extends AppState {
  setIsSiderOpen: (isSiderOpen: boolean) => void;
  setCurrentSong: (currentSong: Song | null) => void;
  setPlaylist: (playlist: Song[]) => void;
  setCurrentSongIndex: (currentSongIndex: number) => void;
  setTheme: (theme: string) => void;
  appendPlaylist: (song: Song) => void;
  //   setState: (state: Partial<AppState>) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  isSiderOpen: false,
  currentSong: null,
  playlist: [],
  currentSongIndex: 0,
  theme: "light",

  setIsSiderOpen: (isSiderOpen) => set({ isSiderOpen }),
  setCurrentSong: (currentSong) => set({ currentSong }),
  setPlaylist: (playlist) => set({ playlist }),
  setCurrentSongIndex: (currentSongIndex) => set({ currentSongIndex }),
  setTheme: (theme) => set({ theme }),
  appendPlaylist: (song) => set({ playlist: [...get().playlist, song] }),
}));
