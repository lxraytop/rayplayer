import { LayoutGrid, List } from 'lucide-react';
import { defineCommand } from '../commandFactories';
import type { CommandPaletteCommand } from '../types';
import { useLibraryViewModeStore } from '../../../stores/useLibraryViewModeStore';

// src/components/command-palette/commands/libraryViewCommands.ts
// Commands in the `settings` group that switch a library surface between the card layout and the
// regular player style list. They act on the shared view-mode store so the palette, the home
// toggle and the playlist toggle always stay in sync.

export const libraryViewCommands: CommandPaletteCommand[] = [
    defineCommand({
        id: 'view-home-toggle-layout',
        group: 'settings',
        title: 'Home: Switch Cards / List',
        description: 'Toggle the home library between the card grid and the list layout',
        keywords: ['home layout', 'home list view', 'card view', 'list view', '首页列表视图', '首页卡片视图', '歌单列表', 'shouye liebiao', 'shouye kapian', 'gedan liebiao', 'sylb', 'gdlb'],
        icon: List,
        execute: () => {
            useLibraryViewModeStore.getState().toggleHomeViewMode();
            return true;
        },
    }),
    defineCommand({
        id: 'view-playlist-toggle-layout',
        group: 'settings',
        title: 'Playlist: Switch Cards / List',
        description: 'Toggle the playlist detail between the card canvas and the track list',
        keywords: ['playlist layout', 'playlist list view', 'track list', 'song list', '歌单列表视图', '歌曲列表', 'gedan liebiao shitu', 'gequ liebiao', 'gdlbst', 'gqlb'],
        icon: LayoutGrid,
        execute: () => {
            useLibraryViewModeStore.getState().togglePlaylistDetailViewMode();
            return true;
        },
    }),
];
