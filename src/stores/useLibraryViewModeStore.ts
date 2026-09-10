import { create } from 'zustand';

// src/stores/useLibraryViewModeStore.ts
// Holds the card / list presentation preference for the two library surfaces that can be shown
// either as 3D cards or as a regular player style list: the home collection grid and the
// playlist detail view. Both surfaces are stored independently so switching one keeps the other.

export type LibraryViewMode = 'card' | 'list';

const HOME_STORAGE_KEY = 'ray.libraryViewMode.home';
const PLAYLIST_DETAIL_STORAGE_KEY = 'ray.libraryViewMode.playlistDetail';

/**
 * Coerces any persisted value into a supported view mode, defaulting to the card layout so an
 * unknown or corrupted entry never leaves a surface in an unreachable state.
 */
export const normalizeLibraryViewMode = (value: unknown): LibraryViewMode => (
    value === 'list' ? 'list' : 'card'
);

export const toggleLibraryViewMode = (mode: LibraryViewMode): LibraryViewMode => (
    mode === 'list' ? 'card' : 'list'
);

const readStoredViewMode = (key: string): LibraryViewMode => {
    if (typeof window === 'undefined') return 'card';
    try {
        return normalizeLibraryViewMode(window.localStorage.getItem(key));
    } catch {
        return 'card';
    }
};

const writeStoredViewMode = (key: string, mode: LibraryViewMode) => {
    try {
        window.localStorage.setItem(key, mode);
    } catch {
        // Keep the in-memory preference for this session when storage is unavailable.
    }
};

type LibraryViewModeState = {
    homeViewMode: LibraryViewMode;
    playlistDetailViewMode: LibraryViewMode;
    setHomeViewMode: (mode: LibraryViewMode) => void;
    setPlaylistDetailViewMode: (mode: LibraryViewMode) => void;
    toggleHomeViewMode: () => LibraryViewMode;
    togglePlaylistDetailViewMode: () => LibraryViewMode;
};

export const useLibraryViewModeStore = create<LibraryViewModeState>((set, get) => ({
    homeViewMode: readStoredViewMode(HOME_STORAGE_KEY),
    playlistDetailViewMode: readStoredViewMode(PLAYLIST_DETAIL_STORAGE_KEY),
    setHomeViewMode: (mode) => {
        const normalized = normalizeLibraryViewMode(mode);
        set({ homeViewMode: normalized });
        writeStoredViewMode(HOME_STORAGE_KEY, normalized);
    },
    setPlaylistDetailViewMode: (mode) => {
        const normalized = normalizeLibraryViewMode(mode);
        set({ playlistDetailViewMode: normalized });
        writeStoredViewMode(PLAYLIST_DETAIL_STORAGE_KEY, normalized);
    },
    toggleHomeViewMode: () => {
        const next = toggleLibraryViewMode(get().homeViewMode);
        get().setHomeViewMode(next);
        return next;
    },
    togglePlaylistDetailViewMode: () => {
        const next = toggleLibraryViewMode(get().playlistDetailViewMode);
        get().setPlaylistDetailViewMode(next);
        return next;
    },
}));
