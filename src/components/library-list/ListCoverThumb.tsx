import React, { useEffect, useMemo, useState } from 'react';
import { getSizedCoverUrl } from '../../utils/coverUrl';
import { createCoverPlaceholder } from '../../utils/coverPlaceholders';

// src/components/library-list/ListCoverThumb.tsx
// Cover thumbnail shared by the library list rows.
//
// The rows used to render a bare `<img loading="lazy">`. Inside a virtualized list that has two
// failure modes: the browser's lazy heuristics can skip an image that mounts after the scroll
// container has settled, and local covers come from the OPFS service worker, which throttles
// thumbnail generation — so a single failed response left the row with a permanent grey square.
// This keeps the row presentable instead: virtualized rows are cheap enough to load eagerly, a
// transient worker failure gets one retry, and a cover that still fails falls back to the generated
// placeholder tile rather than an empty box.

export interface ListCoverThumbProps {
    /** Original cover reference; the CDN / thumbnail variant is derived from it. */
    src?: string;
    /** Requested cover size in pixels. */
    size: number;
    alt: string;
    /** Label used to generate the fallback tile when the cover cannot be loaded. */
    label: string;
    /** Sizing and rounding classes for the thumbnail box. */
    className?: string;
    /** Overlay rendered above the cover, for example the hover play affordance. */
    children?: React.ReactNode;
}

const MAX_COVER_RETRIES = 1;

export const ListCoverThumb: React.FC<ListCoverThumbProps> = ({
    src,
    size,
    alt,
    label,
    className = '',
    children,
}) => {
    const [attempt, setAttempt] = useState(0);
    const [failed, setFailed] = useState(false);

    const sizedUrl = useMemo(() => (src ? getSizedCoverUrl(src, size) : ''), [src, size]);
    const fallbackUrl = useMemo(() => createCoverPlaceholder(label, 'playlist'), [label]);

    // A recycled row can be handed a different track; the previous failure must not carry over.
    // React bails out when the value is already the default, so mounting stays a single render.
    useEffect(() => {
        setAttempt(0);
        setFailed(false);
    }, [sizedUrl]);

    const handleError = () => {
        if (attempt < MAX_COVER_RETRIES) {
            setAttempt(current => current + 1);
            return;
        }
        setFailed(true);
    };

    return (
        <div className={`relative shrink-0 overflow-hidden bg-zinc-200 dark:bg-zinc-800 ${className}`}>
            {sizedUrl && !failed ? (
                <img
                    // Remounting on retry is what actually re-issues the request.
                    key={attempt}
                    src={sizedUrl}
                    alt={alt}
                    decoding="async"
                    onError={handleError}
                    className="w-full h-full object-cover"
                />
            ) : (
                <img
                    src={fallbackUrl}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover"
                />
            )}
            {children}
        </div>
    );
};

export default ListCoverThumb;
