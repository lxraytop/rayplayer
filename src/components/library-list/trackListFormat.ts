// src/components/library-list/trackListFormat.ts
// Pure presentation helpers for the regular-player style list rows. Kept dependency free so the
// list rows stay cheap to render and trivial to unit test.

/**
 * Formats a track length in milliseconds as `m:ss`, or `h:mm:ss` once the track passes an hour.
 * Returns a placeholder for missing or non-finite durations so the column never collapses.
 */
export const formatTrackDurationMs = (durationMs?: number): string => {
    if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs <= 0) {
        return '--:--';
    }

    const totalSeconds = Math.round(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Resolves a possibly non-string grid item label (route elements, translated nodes) into the
 * plain text a list row can render, falling back to an empty string for rich nodes.
 */
export const resolveListItemLabel = (value: unknown): string => (
    typeof value === 'string' || typeof value === 'number' ? String(value) : ''
);
