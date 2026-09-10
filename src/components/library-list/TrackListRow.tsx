import React from 'react';
import { Play, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SongResult } from '../../types';
import { getSizedCoverUrl } from '../../utils/coverUrl';
import { getSongArtistLabel, getSongCoverUrl } from '../../services/onlineMusic/songMetadata';
import { formatTrackDurationMs } from './trackListFormat';

// src/components/library-list/TrackListRow.tsx
// Regular-player style playlist row — index, cover, title, artist, album and duration — used when
// the playlist detail view is switched from the honeycomb card canvas to the list layout.

export const TRACK_LIST_ROW_HEIGHT = 56;

export interface TrackListRowProps {
    track: SongResult;
    index: number;
    style: React.CSSProperties;
    isFocused?: boolean;
    isUnavailable?: boolean;
    onPlay?: () => void;
    onAddToQueue?: () => void;
}

export const TrackListRow = React.memo<TrackListRowProps>(({
    track,
    index,
    style,
    isFocused = false,
    isUnavailable = false,
    onPlay,
    onAddToQueue,
}) => {
    const { t } = useTranslation();
    const coverUrl = getSongCoverUrl(track) || '';
    const artistName = getSongArtistLabel(track).split(',')[0]?.trim() || 'Unknown Artist';
    const albumName = track?.album?.name || '';

    return (
        <div style={style} className="px-4 sm:px-8">
            <div
                onClick={isUnavailable ? undefined : onPlay}
                className={`group flex h-full items-center gap-3 rounded-xl px-3 transition-colors ${
                    isUnavailable
                        ? 'opacity-40 cursor-not-allowed'
                        : isFocused
                            ? 'bg-black/10 dark:bg-white/10 cursor-pointer'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer'
                }`}
            >
                <span
                    className="w-7 shrink-0 text-right text-xs tabular-nums opacity-40"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {index + 1}
                </span>

                <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-800">
                    {coverUrl ? (
                        <img
                            src={getSizedCoverUrl(coverUrl, 50)}
                            alt={track.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : null}
                    {!isUnavailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <Play size={14} className="fill-white text-white ml-0.5" />
                        </div>
                    )}
                </div>

                <div className="flex min-w-0 flex-[2] flex-col justify-center">
                    <div className="truncate text-sm font-semibold leading-tight">{track.name}</div>
                    <div
                        className="mt-0.5 truncate text-[11px] leading-tight opacity-60"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {artistName}
                    </div>
                </div>

                <div
                    className="hidden min-w-0 flex-1 truncate text-[11px] opacity-55 md:block"
                    style={{ color: 'var(--text-secondary)' }}
                    title={albumName}
                >
                    {albumName}
                </div>

                <span
                    className="w-12 shrink-0 text-right text-[11px] tabular-nums opacity-55"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {formatTrackDurationMs(track.durationMs)}
                </span>

                {!isUnavailable && onAddToQueue && (
                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            onAddToQueue();
                        }}
                        className="shrink-0 rounded-full p-2 opacity-0 transition-all hover:bg-black/10 group-hover:opacity-100 dark:hover:bg-white/10"
                        title={t('navidrome.addToQueue')}
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <Plus size={15} />
                    </button>
                )}
            </div>
        </div>
    );
});

TrackListRow.displayName = 'TrackListRow';

export default TrackListRow;
