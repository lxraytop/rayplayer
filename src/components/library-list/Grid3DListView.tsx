import React, { useCallback, useMemo } from 'react';
import type { Grid3DSliderItem } from '../ray-grid/Grid3DSlider';
import { useLocalCoverPreloader } from '../../hooks/useLocalCoverPreloader';
import { COLLECTION_LIST_ROW_HEIGHT, CollectionListRow, type CollectionListRowItem } from './CollectionListRow';
import { LibraryListSurface } from './LibraryListSurface';
import {
    LIBRARY_LIST_BOTTOM_INSET_CLASS,
    LIBRARY_LIST_TOP_INSET_CLASS,
} from './listMetrics';
import { resolveListItemLabel } from './trackListFormat';

// src/components/library-list/Grid3DListView.tsx
// List layout for the home collection surfaces. It adapts the very same Grid3DSliderItem array the
// 3D card grid renders, so switching layouts never changes which collections are visible, and the
// focused index keeps mapping back to the caller's source array.

export interface Grid3DListViewProps {
    items: Grid3DSliderItem[];
    focusedIndex: number;
    onFocusedIndexChange: (index: number) => void;
    onSelect: (item: Grid3DSliderItem, index: number) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    /** Reserves the bottom band when the host renders the floating player. */
    hasFloatingPlayer?: boolean;
    ariaLabel?: string;
}

export const Grid3DListView: React.FC<Grid3DListViewProps> = ({
    items,
    focusedIndex,
    onFocusedIndexChange,
    onSelect,
    isLoading = false,
    emptyMessage,
    hasFloatingPlayer = false,
    ariaLabel,
}) => {
    const rows = useMemo<CollectionListRowItem[]>(() => items.map((item) => ({
        id: item.id,
        name: resolveListItemLabel(item.name),
        coverUrl: item.coverUrl,
        meta: item.summary || item.description || undefined,
        trackCount: typeof item.trackCount === 'number' ? item.trackCount : undefined,
    })), [items]);

    const coverUrls = useMemo(() => items.map(item => item.coverUrl), [items]);
    const preloadIndexes = useMemo(() => [focusedIndex], [focusedIndex]);
    useLocalCoverPreloader(coverUrls, preloadIndexes);

    // The home surface pins its control pills to the top with `absolute top-2`; the list has to
    // start below them instead of rendering its first row underneath.
    const viewportClassName = hasFloatingPlayer
        ? `${LIBRARY_LIST_TOP_INSET_CLASS} ${LIBRARY_LIST_BOTTOM_INSET_CLASS}`
        : LIBRARY_LIST_TOP_INSET_CLASS;

    // Keyboard navigation is handled by the list itself; the caller only needs the resolved index.
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        const next = Math.min(Math.max(focusedIndex + delta, 0), Math.max(items.length - 1, 0));
        if (next !== focusedIndex) onFocusedIndexChange(next);
    }, [focusedIndex, items.length, onFocusedIndexChange]);

    return (
        <div className="w-full h-full min-h-0" onKeyDown={handleKeyDown}>
            <LibraryListSurface<CollectionListRowItem>
                items={rows}
                rowHeight={COLLECTION_LIST_ROW_HEIGHT}
                isLoading={isLoading}
                emptyMessage={emptyMessage}
                focusedIndex={focusedIndex}
                viewportClassName={viewportClassName}
                ariaLabel={ariaLabel}
                renderRow={(row, index, style) => (
                    <CollectionListRow
                        key={`${row.id}-${index}`}
                        item={row}
                        index={index}
                        style={style}
                        isFocused={index === focusedIndex}
                        onClick={() => {
                            onFocusedIndexChange(index);
                            onSelect(items[index], index);
                        }}
                    />
                )}
            />
        </div>
    );
};

export default Grid3DListView;
