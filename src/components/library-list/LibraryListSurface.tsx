import React, { useEffect, useMemo, useRef, useState } from 'react';
import { List as VirtualList } from 'react-window';

// src/components/library-list/LibraryListSurface.tsx
// Main-area virtualized list shared by the card / list toggles. It measures its own height and
// delegates every row to the caller, so the home collection list and the playlist track list use
// a single scrolling implementation instead of re-implementing react-window wiring per surface.

export interface LibraryListSurfaceProps<T> {
    items: T[];
    rowHeight: number;
    renderRow: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
    focusedIndex?: number;
    isLoading?: boolean;
    emptyMessage?: string;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    ariaLabel?: string;
}

const RowComponent = ({ index, style, items, renderRow }: any): React.ReactElement => (
    <>{renderRow(items[index], index, style)}</>
);

export function LibraryListSurface<T>({
    items,
    rowHeight,
    renderRow,
    focusedIndex,
    isLoading = false,
    emptyMessage,
    header,
    footer,
    className = '',
    ariaLabel,
}: LibraryListSurfaceProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const virtualListRef = useRef<any>(null);
    const [listHeight, setListHeight] = useState(0);

    // Track the available height so react-window can virtualize against the real viewport.
    // The state only moves when the measured height actually changes, so resizing never
    // triggers a render per animation frame.
    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const syncHeight = () => {
            setListHeight(previous => (previous === element.clientHeight ? previous : element.clientHeight));
        };

        syncHeight();
        const observer = new ResizeObserver(syncHeight);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    // Keep the focused row visible when the focused index changes from outside the list
    // (keyboard navigation, grid selection carried over from the card layout).
    useEffect(() => {
        if (focusedIndex === undefined || listHeight <= 0) return;
        const list = virtualListRef.current;
        if (typeof list?.scrollToRow !== 'function') return;

        const timer = setTimeout(() => {
            try {
                list.scrollToRow({ index: focusedIndex, align: 'smart', behavior: 'smooth' });
            } catch {
                // Ignore scroll failures for out-of-range indices while the list is settling.
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [focusedIndex, listHeight]);

    const rowProps = useMemo(() => ({ items, renderRow }), [items, renderRow]);

    const content = isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm opacity-50">
            {emptyMessage || ''}
        </div>
    ) : items.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm opacity-50">
            {emptyMessage || ''}
        </div>
    ) : (
        listHeight > 0 && (
            <VirtualList
                listRef={virtualListRef}
                style={{ height: listHeight, width: '100%' }}
                rowCount={items.length}
                rowHeight={rowHeight}
                rowProps={rowProps}
                rowComponent={RowComponent}
                className="overflow-x-hidden custom-scrollbar"
            />
        )
    );

    return (
        <div className={`w-full h-full min-h-0 flex flex-col ${className}`} aria-label={ariaLabel}>
            {header}
            <div ref={containerRef} className="flex-1 min-h-0 relative">
                {content}
            </div>
            {footer}
        </div>
    );
}

export default LibraryListSurface;
