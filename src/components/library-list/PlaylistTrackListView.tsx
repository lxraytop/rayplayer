import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SongResult } from '../../types';
import { isSongUnavailable } from '../../services/onlineMusic/songAvailability';
import { LibraryListSurface } from './LibraryListSurface';
import { TRACK_LIST_ROW_HEIGHT, TrackListRow } from './TrackListRow';

// src/components/library-list/PlaylistTrackListView.tsx
// Regular-player style playlist layout: a column header plus a virtualized track list, driven by
// the same track array and queue the honeycomb canvas uses so playback behaviour stays identical.

export interface PlaylistTrackListViewProps {
    tracks: SongResult[];
    /** Queue handed to the player when a row is activated; usually the playable subset. */
    queueTracks: SongResult[];
    focusedIndex: number;
    onFocusedIndexChange?: (index: number) => void;
    onSelectTrack?: (track: SongResult, queue: SongResult[]) => void;
    onAddToQueue?: (track: SongResult) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    toolbar?: React.ReactNode;
}

const ListColumnHeader = React.memo(() => {
    const { t } = useTranslation();

    return (
        <div
            className="flex shrink-0 items-center gap-3 px-7 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider opacity-45 sm:px-11"
            style={{ color: 'var(--text-secondary)' }}
        >
            <span className="w-7 shrink-0 text-right">#</span>
            <span className="w-9 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-[2]">{t('playlist.headerTitle')}</span>
            <span className="hidden min-w-0 flex-1 md:block">{t('localMusic.albumLabel')}</span>
            <span className="w-12 shrink-0 text-right">{t('playlist.headerTime')}</span>
            {/* Mirrors the hover action button so the columns line up with the rows below. */}
            <span className="w-[31px] shrink-0" aria-hidden="true" />
        </div>
    );
});

ListColumnHeader.displayName = 'ListColumnHeader';

export const PlaylistTrackListView: React.FC<PlaylistTrackListViewProps> = ({
    tracks,
    queueTracks,
    focusedIndex,
    onFocusedIndexChange,
    onSelectTrack,
    onAddToQueue,
    isLoading = false,
    emptyMessage,
    toolbar,
}) => {
    const rows = useMemo(
        () => tracks.map(track => ({ track, isUnavailable: isSongUnavailable(track) })),
        [tracks],
    );

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!onFocusedIndexChange) return;
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        const next = Math.min(Math.max(focusedIndex + delta, 0), Math.max(tracks.length - 1, 0));
        if (next !== focusedIndex) onFocusedIndexChange(next);
    }, [focusedIndex, onFocusedIndexChange, tracks.length]);

    return (
        <div className="w-full h-full min-h-0" onKeyDown={handleKeyDown}>
            <LibraryListSurface<{ track: SongResult; isUnavailable: boolean }>
                items={rows}
                rowHeight={TRACK_LIST_ROW_HEIGHT}
                isLoading={isLoading}
                emptyMessage={emptyMessage}
                focusedIndex={focusedIndex}
                header={(
                    <>
                        {toolbar ? (
                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 px-4 pb-2 sm:px-8">
                                {toolbar}
                            </div>
                        ) : null}
                        <ListColumnHeader />
                    </>
                )}
                renderRow={(row, index, style) => (
                    <TrackListRow
                        key={`${row.track.id}-${index}`}
                        track={row.track}
                        index={index}
                        style={style}
                        isFocused={index === focusedIndex}
                        isUnavailable={row.isUnavailable}
                        onPlay={() => {
                            onFocusedIndexChange?.(index);
                            onSelectTrack?.(row.track, queueTracks);
                        }}
                        onAddToQueue={onAddToQueue ? () => onAddToQueue(row.track) : undefined}
                    />
                )}
            />
        </div>
    );
};

export default PlaylistTrackListView;
