import { describe, expect, it } from 'vitest';
import {
    formatTrackDurationMs,
    resolveListItemLabel,
} from '@/components/library-list/trackListFormat';

// test/unit/library/trackListFormat.test.ts
// The list rows render durations and grid-derived labels, so the formatting has to survive the
// placeholder values the grid passes through (missing duration, non-string node labels).

describe('formatTrackDurationMs', () => {
    it('formats sub-hour durations as m:ss', () => {
        expect(formatTrackDurationMs(1000)).toBe('0:01');
        expect(formatTrackDurationMs(61000)).toBe('1:01');
        expect(formatTrackDurationMs(599000)).toBe('9:59');
    });

    it('formats hour-long durations as h:mm:ss', () => {
        expect(formatTrackDurationMs(3600000)).toBe('1:00:00');
        expect(formatTrackDurationMs(3661000)).toBe('1:01:01');
        expect(formatTrackDurationMs(7325000)).toBe('2:02:05');
    });

    it('rounds to the nearest second', () => {
        expect(formatTrackDurationMs(1499)).toBe('0:01');
        expect(formatTrackDurationMs(1500)).toBe('0:02');
    });

    it('falls back to a placeholder for unusable durations', () => {
        expect(formatTrackDurationMs(undefined)).toBe('--:--');
        expect(formatTrackDurationMs(0)).toBe('--:--');
        expect(formatTrackDurationMs(-1000)).toBe('--:--');
        expect(formatTrackDurationMs(Number.NaN)).toBe('--:--');
        expect(formatTrackDurationMs(Number.POSITIVE_INFINITY)).toBe('--:--');
    });
});

describe('resolveListItemLabel', () => {
    it('passes through plain string labels', () => {
        expect(resolveListItemLabel('Daily Mix')).toBe('Daily Mix');
    });

    it('stringifies numeric labels', () => {
        expect(resolveListItemLabel(42)).toBe('42');
    });

    it('returns an empty string for rich or missing labels', () => {
        expect(resolveListItemLabel(undefined)).toBe('');
        expect(resolveListItemLabel(null)).toBe('');
        expect(resolveListItemLabel({ type: 'element' })).toBe('');
        expect(resolveListItemLabel(['a', 'b'])).toBe('');
    });
});
