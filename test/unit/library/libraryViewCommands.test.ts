import { beforeEach, describe, expect, it } from 'vitest';
import { ALL_COMMAND_PALETTE_COMMANDS } from '@/components/command-palette/commands';
import { libraryViewCommands } from '@/components/command-palette/commands/libraryViewCommands';
import { useLibraryViewModeStore } from '@/stores/useLibraryViewModeStore';

// test/unit/library/libraryViewCommands.test.ts
// The palette is the only place that can reach both surfaces from a single entry point, so the two
// layout commands must stay registered and must drive the shared store rather than local state.

const HOME_COMMAND_ID = 'view-home-toggle-layout';
const PLAYLIST_COMMAND_ID = 'view-playlist-toggle-layout';

describe('library view commands', () => {
    beforeEach(() => {
        useLibraryViewModeStore.setState({ homeViewMode: 'card', playlistDetailViewMode: 'card' });
    });

    it('exposes one command per surface in the settings group', () => {
        expect(libraryViewCommands.map(command => command.id)).toEqual([
            HOME_COMMAND_ID,
            PLAYLIST_COMMAND_ID,
        ]);
        libraryViewCommands.forEach(command => {
            expect(command.group).toBe('settings');
            expect(command.title.length).toBeGreaterThan(0);
            expect(command.description.length).toBeGreaterThan(0);
            expect(command.keywords.length).toBeGreaterThan(0);
        });
    });

    it('is reachable through the aggregated registry', () => {
        const ids = new Set(ALL_COMMAND_PALETTE_COMMANDS.map(command => command.id));

        expect(ids.has(HOME_COMMAND_ID)).toBe(true);
        expect(ids.has(PLAYLIST_COMMAND_ID)).toBe(true);
    });

    it('toggles the home surface and reports success', () => {
        const command = libraryViewCommands.find(item => item.id === HOME_COMMAND_ID)!;

        expect(command.execute('', {} as never)).toBe(true);
        expect(useLibraryViewModeStore.getState().homeViewMode).toBe('list');
        expect(useLibraryViewModeStore.getState().playlistDetailViewMode).toBe('card');

        expect(command.execute('', {} as never)).toBe(true);
        expect(useLibraryViewModeStore.getState().homeViewMode).toBe('card');
    });

    it('toggles the playlist surface independently', () => {
        const command = libraryViewCommands.find(item => item.id === PLAYLIST_COMMAND_ID)!;

        expect(command.execute('', {} as never)).toBe(true);
        expect(useLibraryViewModeStore.getState().playlistDetailViewMode).toBe('list');
        expect(useLibraryViewModeStore.getState().homeViewMode).toBe('card');
    });
});
