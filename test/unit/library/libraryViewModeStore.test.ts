import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    normalizeLibraryViewMode,
    toggleLibraryViewMode,
} from '@/stores/useLibraryViewModeStore';

// test/unit/library/libraryViewModeStore.test.ts
// The card / list preference is read from localStorage the moment the module is evaluated, so a
// corrupt or throwing storage must never leave a surface unreachable. Covers the pure helpers, the
// per-surface isolation and the storage recovery paths.

const HOME_STORAGE_KEY = 'ray.libraryViewMode.home';
const PLAYLIST_STORAGE_KEY = 'ray.libraryViewMode.playlistDetail';

const createStorage = (initial: Record<string, string> = {}) => {
    const values = new Map(Object.entries(initial));
    return {
        getItem: vi.fn((key: string) => values.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
            values.set(key, value);
        }),
    };
};

describe('library view mode helpers', () => {
    it('only accepts the list sentinel and falls back to card for anything else', () => {
        expect(normalizeLibraryViewMode('list')).toBe('list');
        expect(normalizeLibraryViewMode('card')).toBe('card');
        expect(normalizeLibraryViewMode(undefined)).toBe('card');
        expect(normalizeLibraryViewMode(null)).toBe('card');
        expect(normalizeLibraryViewMode('grid')).toBe('card');
        expect(normalizeLibraryViewMode(0)).toBe('card');
    });

    it('toggles between the two layouts', () => {
        expect(toggleLibraryViewMode('card')).toBe('list');
        expect(toggleLibraryViewMode('list')).toBe('card');
    });
});

describe('library view mode store', () => {
    beforeEach(() => vi.resetModules());
    afterEach(() => vi.unstubAllGlobals());

    it('defaults both surfaces to the card layout when nothing is stored', async () => {
        vi.stubGlobal('window', { localStorage: createStorage() });
        const { useLibraryViewModeStore } = await import('@/stores/useLibraryViewModeStore');

        expect(useLibraryViewModeStore.getState().homeViewMode).toBe('card');
        expect(useLibraryViewModeStore.getState().playlistDetailViewMode).toBe('card');
    });

    it('restores each surface preference independently from storage', async () => {
        vi.stubGlobal('window', {
            localStorage: createStorage({
                [HOME_STORAGE_KEY]: 'list',
                [PLAYLIST_STORAGE_KEY]: 'card',
            }),
        });
        const { useLibraryViewModeStore } = await import('@/stores/useLibraryViewModeStore');

        expect(useLibraryViewModeStore.getState().homeViewMode).toBe('list');
        expect(useLibraryViewModeStore.getState().playlistDetailViewMode).toBe('card');
    });

    it('persists a surface change without touching the other surface', async () => {
        const storage = createStorage();
        vi.stubGlobal('window', { localStorage: storage });
        const { useLibraryViewModeStore } = await import('@/stores/useLibraryViewModeStore');

        useLibraryViewModeStore.getState().setHomeViewMode('list');

        expect(useLibraryViewModeStore.getState().homeViewMode).toBe('list');
        expect(useLibraryViewModeStore.getState().playlistDetailViewMode).toBe('card');
        expect(storage.setItem).toHaveBeenCalledWith(HOME_STORAGE_KEY, 'list');
        expect(storage.setItem).not.toHaveBeenCalledWith(PLAYLIST_STORAGE_KEY, expect.anything());
    });

    it('normalizes an unsupported value passed to the setter', async () => {
        vi.stubGlobal('window', { localStorage: createStorage() });
        const { useLibraryViewModeStore } = await import('@/stores/useLibraryViewModeStore');

        useLibraryViewModeStore.getState().setHomeViewMode('nonsense' as never);

        expect(useLibraryViewModeStore.getState().homeViewMode).toBe('card');
    });

    it('toggles and returns the next mode so callers can react without re-reading state', async () => {
        vi.stubGlobal('window', { localStorage: createStorage() });
        const { useLibraryViewModeStore } = await import('@/stores/useLibraryViewModeStore');
        const store = useLibraryViewModeStore.getState();

        expect(store.toggleHomeViewMode()).toBe('list');
        expect(useLibraryViewModeStore.getState().homeViewMode).toBe('list');
        expect(useLibraryViewModeStore.getState().toggleHomeViewMode()).toBe('card');
        expect(useLibraryViewModeStore.getState().playlistDetailViewMode).toBe('card');
    });

    it('recovers to the card layout when the persisted value is unusable', async () => {
        vi.stubGlobal('window', {
            localStorage: createStorage({
                [HOME_STORAGE_KEY]: 'carousel',
                [PLAYLIST_STORAGE_KEY]: '',
            }),
        });
        const { useLibraryViewModeStore } = await import('@/stores/useLibraryViewModeStore');

        expect(useLibraryViewModeStore.getState().homeViewMode).toBe('card');
        expect(useLibraryViewModeStore.getState().playlistDetailViewMode).toBe('card');
    });

    it('keeps working in memory when storage is unavailable', async () => {
        vi.stubGlobal('window', {
            localStorage: {
                getItem: vi.fn(() => {
                    throw new Error('storage disabled');
                }),
                setItem: vi.fn(() => {
                    throw new Error('storage disabled');
                }),
            },
        });
        const { useLibraryViewModeStore } = await import('@/stores/useLibraryViewModeStore');

        expect(useLibraryViewModeStore.getState().homeViewMode).toBe('card');
        expect(() => useLibraryViewModeStore.getState().setHomeViewMode('list')).not.toThrow();
        expect(useLibraryViewModeStore.getState().homeViewMode).toBe('list');
    });

    it('does not touch storage when running without a window', async () => {
        vi.stubGlobal('window', undefined);
        const { useLibraryViewModeStore } = await import('@/stores/useLibraryViewModeStore');

        expect(useLibraryViewModeStore.getState().homeViewMode).toBe('card');
        expect(() => useLibraryViewModeStore.getState().togglePlaylistDetailViewMode()).not.toThrow();
        expect(useLibraryViewModeStore.getState().playlistDetailViewMode).toBe('list');
    });
});
