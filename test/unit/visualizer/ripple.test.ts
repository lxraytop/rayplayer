import React from 'react';
import { motionValue } from 'framer-motion';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_THEME } from '@/services/baseThemes';
import VisualizerRipple from '@/components/visualizer/ripple/VisualizerRipple';
import VisualizerRenderer from '@/components/visualizer/VisualizerRenderer';
import {
    buildRippleWords,
    resolveRippleActiveWordIndex,
    resolveRippleWordState,
} from '@/components/visualizer/ripple/rippleModel';
import type { Line } from '@/types';

// test/unit/visualizer/ripple.test.ts
// Locks the Ripple mode: words drop one at a time in timing order, the reflection never reveals
// words that have not dropped yet, and the mode is discoverable through the shared registry.
vi.mock('@/components/visualizer/backgrounds/VisualizerBackgroundRenderer', () => ({
    default: () => React.createElement('div', { 'data-testid': 'background-renderer' }),
}));
vi.mock('@/components/visualizer/VisualizerHarmonyOverlay', () => ({
    default: () => React.createElement('div', { 'data-testid': 'harmony-overlay' }),
}));

const createAudioBands = () => ({
    bass: motionValue(0),
    lowMid: motionValue(0),
    mid: motionValue(0),
    vocal: motionValue(0),
    treble: motionValue(0),
});

const createLine = (): Line => ({
    fullText: 'hello world',
    startTime: 0,
    endTime: 2,
    words: [
        { text: 'hello', startTime: 0, endTime: 1 },
        { text: 'world', startTime: 1, endTime: 2 },
    ],
});

describe('buildRippleWords', () => {
    it('returns no words without a line', () => {
        expect(buildRippleWords(null)).toEqual([]);
        expect(buildRippleWords(undefined)).toEqual([]);
    });

    it('keeps the shared word order and timing', () => {
        const words = buildRippleWords(createLine());

        expect(words.map(word => word.text).join('')).toBe('helloworld');
        expect(words.map(word => word.startTime)).toEqual([0, 1]);
        expect(words.map(word => word.endTime)).toEqual([1, 2]);
        expect(words[0].index).toBe(0);
        expect(words[1].index).toBe(1);
    });
});

describe('resolveRippleActiveWordIndex', () => {
    const words = buildRippleWords(createLine());

    it('is -1 before the first word drops', () => {
        expect(resolveRippleActiveWordIndex(words, -1)).toBe(-1);
    });

    it('tracks the word whose start time has been reached', () => {
        expect(resolveRippleActiveWordIndex(words, 0)).toBe(0);
        expect(resolveRippleActiveWordIndex(words, 0.5)).toBe(0);
        expect(resolveRippleActiveWordIndex(words, 1)).toBe(1);
        expect(resolveRippleActiveWordIndex(words, 5)).toBe(1);
    });

    it('handles an empty word list', () => {
        expect(resolveRippleActiveWordIndex([], 3)).toBe(-1);
    });
});

describe('resolveRippleWordState', () => {
    const words = buildRippleWords(createLine());

    it('marks dropped, current and pending words distinctly', () => {
        expect(resolveRippleWordState(words[0], -1)).toBe('waiting');
        expect(resolveRippleWordState(words[0], 0)).toBe('active');
        expect(resolveRippleWordState(words[1], 0)).toBe('waiting');
        expect(resolveRippleWordState(words[0], 1)).toBe('passed');
        expect(resolveRippleWordState(words[1], 1)).toBe('active');
    });
});

describe('VisualizerRipple', () => {
    it('renders the shell and marks each revealed word state', () => {
        const markup = renderToStaticMarkup(React.createElement(VisualizerRipple, {
            currentTime: motionValue(0),
            currentLineIndex: 0,
            lines: [createLine()],
            theme: DEFAULT_THEME,
            audioPower: motionValue(0),
            audioBands: createAudioBands(),
        }));

        expect(markup).toContain('visualizer-ripple');
        // The first word has dropped, the second is still pending.
        expect(markup).toContain('data-ripple-state="active"');
        expect(markup).toContain('data-ripple-state="waiting"');
        // The reflection mirrors the same words without revealing the pending ones.
        expect(markup).toContain('data-ripple-state="reflection"');
    });

    it('is discoverable through the shared registry', () => {
        const markup = renderToStaticMarkup(React.createElement(VisualizerRenderer, {
            mode: 'ripple',
            currentTime: motionValue(0),
            currentLineIndex: 0,
            lines: [createLine()],
            theme: DEFAULT_THEME,
            audioPower: motionValue(0),
            audioBands: createAudioBands(),
        }));

        expect(markup).toContain('visualizer-ripple');
        expect(markup).toContain('harmony-overlay');
    });
});
