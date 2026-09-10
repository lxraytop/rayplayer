import React from 'react';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSizedCoverUrl } from '../../utils/coverUrl';

// src/components/library-list/CollectionListRow.tsx
// Regular-player style row for a home collection (playlist / album / radio) shown when the home
// surface is switched from the 3D card grid to the list layout.

export const COLLECTION_LIST_ROW_HEIGHT = 64;

export interface CollectionListRowItem {
    id: string | number;
    name: string;
    coverUrl?: string;
    meta?: string;
    trackCount?: number;
}

export interface CollectionListRowProps {
    item: CollectionListRowItem;
    index: number;
    style: React.CSSProperties;
    isFocused?: boolean;
    onClick?: () => void;
}

export const CollectionListRow = React.memo<CollectionListRowProps>(({
    item,
    index,
    style,
    isFocused = false,
    onClick,
}) => {
    const { t } = useTranslation();
    const coverUrl = item.coverUrl ? getSizedCoverUrl(item.coverUrl, 128) : '';

    return (
        <div style={style} className="px-4 sm:px-8">
            <div
                onClick={onClick}
                className={`group flex h-full items-center gap-4 rounded-xl px-3 transition-colors cursor-pointer ${
                    isFocused
                        ? 'bg-black/10 dark:bg-white/10'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
            >
                <span
                    className="w-7 shrink-0 text-right text-xs tabular-nums opacity-40"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {index + 1}
                </span>

                <div className="relative w-11 h-11 shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Play size={16} className="fill-white text-white ml-0.5" />
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <div className="truncate text-sm font-semibold leading-tight">{item.name}</div>
                    {item.meta ? (
                        <div
                            className="mt-0.5 truncate text-[11px] leading-tight opacity-60"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {item.meta}
                        </div>
                    ) : null}
                </div>

                {typeof item.trackCount === 'number' && (
                    <span
                        className="shrink-0 text-[11px] opacity-50 tabular-nums"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {`${item.trackCount} ${t('playlist.tracks')}`}
                    </span>
                )}
            </div>
        </div>
    );
});

CollectionListRow.displayName = 'CollectionListRow';

export default CollectionListRow;
