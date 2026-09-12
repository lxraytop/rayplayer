import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SongResult } from '@/types';
import CollectionListRow from '@/components/library-list/CollectionListRow';
import Grid3DListView from '@/components/library-list/Grid3DListView';
import ListCoverThumb from '@/components/library-list/ListCoverThumb';
import PlaylistTrackListView from '@/components/library-list/PlaylistTrackListView';
import TrackListRow from '@/components/library-list/TrackListRow';
import {
    LIBRARY_LIST_BOTTOM_INSET_CLASS,
    LIBRARY_LIST_CONTENT_CLASS,
    LIBRARY_LIST_PLAYLIST_TOP_INSET_CLASS,
    LIBRARY_LIST_SIDE_PANEL_INSET_CLASS,
    LIBRARY_LIST_TOP_INSET_CLASS,
} from '@/components/library-list/listMetrics';

// test/unit/library/libraryListLayout.test.ts
// The card / list switch is a layout feature, so its regressions are layout regressions: rows that
// stop lining up with the column header, a list that renders its first row under the surface
// chrome (control pills on the home surface, the back button and title block on the playlist
// detail), a last row hidden by the floating player, and covers that never appear because the row
// asked the browser to defer them. Only the row and header markup can be asserted without a
// browser, which is exactly where those mistakes happen.

const QQ_COVER_URL = 'https://y.gtimg.cn/music/photo_new/T002R300x300M000abc.jpg';
const LOCAL_COVER_URL = '/__ray_cover/sha256%3Aabc';

const createTrack = (overrides: Partial<SongResult> = {}): SongResult => ({
    id: 'track-1',
    name: 'Waterfall',
    artists: [{ id: 1, name: 'Aurora' }],
    album: { id: 10, name: 'All My Demons' },
    durationMs: 215000,
    ...overrides,
} as unknown as SongResult);

describe('ListCoverThumb', () => {
    it('requests the sized variant of the cover', () => {
        const markup = renderToStaticMarkup(React.createElement(ListCoverThumb, {
            src: QQ_COVER_URL,
            size: 50,
            alt: 'Waterfall',
            label: 'Waterfall',
            className: 'w-9 h-9',
        }));

        // 50px maps onto the 300px QQ variant; passing the raw URL would pull a full-size asset.
        expect(markup).toContain('T002R300x300M000');
    });

    it('asks the cover service worker for a thumbnail size it can actually serve', () => {
        const markup = renderToStaticMarkup(React.createElement(ListCoverThumb, {
            src: LOCAL_COVER_URL,
            size: 50,
            alt: 'Waterfall',
            label: 'Waterfall',
            className: 'w-9 h-9',
        }));

        // The OPFS service worker only generates the sizes it was written for; anything else makes
        // it fall back to streaming the full-resolution original into a 36px box.
        expect(markup).toContain('size=512');
    });

    it('decodes asynchronously instead of deferring the request', () => {
        const markup = renderToStaticMarkup(React.createElement(ListCoverThumb, {
            src: QQ_COVER_URL,
            size: 50,
            alt: 'Waterfall',
            label: 'Waterfall',
            className: 'w-9 h-9',
        }));

        expect(markup).toContain('decoding="async"');
        // Regression guard: rows are virtualized, so only a screenful is ever mounted and there is
        // nothing to gain from lazy loading — while the browser's lazy heuristics can silently skip
        // an image that mounts after the scroll container has settled.
        expect(markup).not.toContain('loading="lazy"');
    });

    it('falls back to a generated tile when there is no cover at all', () => {
        const markup = renderToStaticMarkup(React.createElement(ListCoverThumb, {
            size: 50,
            alt: 'Waterfall',
            label: 'Waterfall',
            className: 'w-9 h-9',
        }));

        expect(markup).toContain('data:image/svg+xml');
    });
});

describe('TrackListRow', () => {
    it('centres the row content in the shared column', () => {
        const markup = renderToStaticMarkup(React.createElement(TrackListRow, {
            track: createTrack(),
            index: 0,
            style: {},
        }));

        expect(markup).toContain(LIBRARY_LIST_CONTENT_CLASS);
    });

    it('renders a sized cover without deferring it', () => {
        const markup = renderToStaticMarkup(React.createElement(TrackListRow, {
            track: createTrack({ album: { id: 10, name: 'All My Demons', coverUrl: QQ_COVER_URL } } as never),
            index: 0,
            style: {},
        }));

        expect(markup).toContain('T002R300x300M000');
        expect(markup).not.toContain('loading="lazy"');
    });
});

describe('CollectionListRow', () => {
    it('centres the row content in the shared column', () => {
        const markup = renderToStaticMarkup(React.createElement(CollectionListRow, {
            item: { id: 'c1', name: 'Late Night', coverUrl: QQ_COVER_URL, trackCount: 12 },
            index: 0,
            style: {},
        }));

        expect(markup).toContain(LIBRARY_LIST_CONTENT_CLASS);
        expect(markup).not.toContain('loading="lazy"');
    });
});

describe('LibraryListSurface insets', () => {
    const renderPlaylist = (infoPanelOpen = false) => renderToStaticMarkup(
        React.createElement(PlaylistTrackListView, {
            tracks: [createTrack()],
            queueTracks: [createTrack()],
            focusedIndex: 0,
            infoPanelOpen,
        }),
    );

    it('pushes the playlist list clear of the header chrome and the floating player', () => {
        const markup = renderPlaylist();

        // The playlist host pins a back button, a layout toggle and a centred title block to the
        // top of the viewport. The sort toolbar and the first rows used to render underneath them.
        expect(markup).toContain(LIBRARY_LIST_PLAYLIST_TOP_INSET_CLASS);
        // The floating player outranks this surface in the stacking order, so the last rows would
        // sit behind it without a reserved band.
        expect(markup).toContain(LIBRARY_LIST_BOTTOM_INSET_CLASS);
        // The column header has to sit in the same column as the rows it labels.
        expect(markup).toContain(LIBRARY_LIST_CONTENT_CLASS);
    });

    it('insets the playlist list beside the info panel, and only while it is open', () => {
        expect(renderPlaylist(false)).not.toContain(LIBRARY_LIST_SIDE_PANEL_INSET_CLASS);
        // The panel is pinned over the left of the surface, so the rows have to move rather than
        // scroll underneath it.
        expect(renderPlaylist(true)).toContain(LIBRARY_LIST_SIDE_PANEL_INSET_CLASS);
    });

    it('pushes the home list clear of the control pills, and the player when it is present', () => {
        const createHomeList = (hasFloatingPlayer: boolean) => renderToStaticMarkup(
            React.createElement(Grid3DListView, {
                items: [{ id: 'c1', name: 'Late Night' }],
                focusedIndex: 0,
                onFocusedIndexChange: () => undefined,
                onSelect: () => undefined,
                hasFloatingPlayer,
            }),
        );

        expect(createHomeList(false)).toContain(LIBRARY_LIST_TOP_INSET_CLASS);
        expect(createHomeList(false)).not.toContain(LIBRARY_LIST_BOTTOM_INSET_CLASS);

        const withPlayer = createHomeList(true);
        expect(withPlayer).toContain(LIBRARY_LIST_TOP_INSET_CLASS);
        expect(withPlayer).toContain(LIBRARY_LIST_BOTTOM_INSET_CLASS);
    });
});
