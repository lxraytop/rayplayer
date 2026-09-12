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
import {
    RIPPLE_AIRBORNE_BLUR_PX,
    RIPPLE_AIRBORNE_POSE,
    RIPPLE_AMBIENT_BASE_OPACITY,
    RIPPLE_AMBIENT_ENERGY_OPACITY,
    RIPPLE_CAUSTIC_POOLS,
    RIPPLE_DROP_DURATION_SEC,
    RIPPLE_IMPACT_BLOOM,
    RIPPLE_IMPACT_RINGS,
    RIPPLE_IMPACT_WELL,
    RIPPLE_KEYFRAMES,
    RIPPLE_SPLASH_DROPLETS,
    RIPPLE_SPLASH_PERSPECTIVE,
    buildRippleAirbornePose,
} from '@/components/visualizer/ripple/rippleVisuals';
import { RIPPLE_IMPACT_ANCHOR_ATTRIBUTE } from '@/components/visualizer/ripple/useRippleImpactAnchor';
import { DEFAULT_RIPPLE_TUNING, type Line } from '@/types';

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

describe('VisualizerRipple typography and water surface', () => {
    const renderRipple = (overrides: Record<string, unknown> = {}) => renderToStaticMarkup(
        React.createElement(VisualizerRipple, {
            currentTime: motionValue(0),
            currentLineIndex: 0,
            lines: [createLine()],
            theme: DEFAULT_THEME,
            audioPower: motionValue(0),
            audioBands: createAudioBands(),
            ...overrides,
        }),
    );

    it('sizes the hero line with a responsive clamp instead of default body text', () => {
        const markup = renderRipple();

        // Regression guard: the mode used to render with no font-size at all, i.e. 16px body text.
        expect(markup).toMatch(/font-size:clamp\(/);
    });

    it('folds lyricsFontScale into the clamp so the lyrics setting still works', () => {
        const markup = renderRipple({ lyricsFontScale: 2 });

        expect(markup).toContain('clamp(5.200rem, 12.800vw, 9.500rem)');
    });

    it('sizes the ripple train in em so it scales with the resolved font size', () => {
        const markup = renderRipple();

        // A px ring would not follow lyricsFontScale, and the landing word has to answer with a ripple.
        expect(markup).toContain('width:1.95em');
        expect(markup).toContain('height:0.39em');
    });

    it('flattens the ripple train into a surface seen at an angle', () => {
        const markup = renderRipple();

        // Round rings read as hoops in the air; a water surface is crossed by flat ellipses.
        expect(RIPPLE_IMPACT_RINGS.every(ring => ring.heightEm < ring.widthEm / 3)).toBe(true);
        expect(markup).toContain('ripple-impact-ring');
        expect(markup).toContain('ripple-impact-crown');
    });

    it('anchors the ripple train on the waterline under the landing word', () => {
        const markup = renderRipple();

        // The ripple is drawn in the water layer, so the component has to publish where to draw it.
        expect(markup).toContain('left:calc(50% + var(--ripple-impact-x, 0px))');
        expect(markup).toContain(`${RIPPLE_IMPACT_ANCHOR_ATTRIBUTE}="0"`);
        // Only the landed word answers; the pending one must stay quiet.
        expect(markup.match(/animation:ripple-impact-crown/g)?.length ?? 0).toBe(1);
    });

    it('starts the landing animation from the same pose pending words hold', () => {
        const markup = renderRipple();

        // Regression guard: if the airborne pose and the first keyframe drift apart, a word visibly
        // snaps the instant it stops waiting.
        expect(RIPPLE_KEYFRAMES).toContain(RIPPLE_AIRBORNE_POSE);
        expect(markup).toContain(RIPPLE_AIRBORNE_POSE);
        expect(markup).toContain(`blur(${RIPPLE_AIRBORNE_BLUR_PX}px)`);
    });

    it('injects the water keyframes, scoped so they cannot leak into other modes', () => {
        const markup = renderRipple();

        expect(markup).toContain('@keyframes ripple-word-drop');
        expect(markup).toContain('@keyframes ripple-impact-ring');
        expect(markup).toContain('@keyframes ripple-ambient-expand');
        expect(markup).toContain('@keyframes ripple-reflection-sway');
        expect(markup).toContain('@keyframes ripple-waterline-wobble');
        // An injected <style> is document-global: an unscoped attribute selector would restyle every
        // other visualizer that happens to use data-ripple-state.
        expect(markup).toContain('.visualizer-ripple [data-ripple-state="active"]');
    });

    it('bends the reflection with a water displacement filter', () => {
        const markup = renderRipple();

        // Regression guard: the reflection has to go through a real turbulence/displacement chain,
        // not just a blur, otherwise the water never distorts the mirrored glyphs.
        expect(markup).toContain('<feTurbulence');
        expect(markup).toContain('<feDisplacementMap');
        expect(markup).toMatch(/filter:url\(#ripple-water-/);
    });

    it('runs the water morph on the reflection only, as an indefinite animation', () => {
        const markup = renderRipple();

        expect(markup).toContain('attributeName="baseFrequency"');
        expect(markup).toContain('repeatCount="indefinite"');
        // Only the reflection opts into the water filter, so the hero line stays crisp.
        expect(markup.match(/url\(#ripple-water-/g)?.length ?? 0).toBe(1);
    });
});

describe('VisualizerRipple splash realism', () => {
    const renderRipple = (overrides: Record<string, unknown> = {}) => renderToStaticMarkup(
        React.createElement(VisualizerRipple, {
            currentTime: motionValue(0),
            currentLineIndex: 0,
            lines: [createLine()],
            theme: DEFAULT_THEME,
            audioPower: motionValue(0),
            audioBands: createAudioBands(),
            ...overrides,
        }),
    );

    it('throws a fan of droplets up out of the crater', () => {
        const markup = renderRipple();

        // Regression guard: an impact that only draws rings reads as a diagram of water, not water.
        expect(RIPPLE_SPLASH_DROPLETS.length).toBeGreaterThanOrEqual(5);
        // Counted on the inline `animation:` shorthand so the injected @keyframes name is not counted.
        expect(markup.match(/animation:ripple-droplet-arc/g)?.length ?? 0).toBe(RIPPLE_SPLASH_DROPLETS.length);
        // The fan has to actually be a fan: every droplet launches upwards, not sideways or down.
        expect(RIPPLE_SPLASH_DROPLETS.every(droplet => Math.abs(droplet.angleDeg) < 90)).toBe(true);
        // A spread of launch angles is what makes it read as a crown rather than a single jet.
        const angles = RIPPLE_SPLASH_DROPLETS.map(droplet => droplet.angleDeg);
        expect(Math.max(...angles) - Math.min(...angles)).toBeGreaterThan(90);
    });

    it('squashes the droplet fan into the tilted surface plane', () => {
        const markup = renderRipple();

        // Round droplets flying in a circle would read as a hoop in the air again.
        expect(RIPPLE_SPLASH_PERSPECTIVE).toBeLessThan(1);
        expect(markup).toContain(`scaleY(${RIPPLE_SPLASH_PERSPECTIVE})`);
    });

    it('opens and springs back a crater under the landing word', () => {
        const markup = renderRipple();

        expect(markup).toContain('ripple-impact-well');
        expect(RIPPLE_KEYFRAMES).toContain('@keyframes ripple-impact-well');
        // The dent deepens before it widens: a uniform scale would read as a growing disc, not a dent.
        expect(RIPPLE_IMPACT_WELL.heightEm).toBeLessThan(RIPPLE_IMPACT_WELL.widthEm / 3);
    });

    it('gives each ring a lit crest with a soft body instead of a bare outline', () => {
        const markup = renderRipple();

        // A 1px border on its own reads as a drawn wire; a real wave front has a glow around it.
        expect(markup).toContain('inset 0 0');
        expect(RIPPLE_IMPACT_RINGS.every(ring => ring.glowPx > 0)).toBe(true);
        // Heavier, slower outer waves rather than merely fainter ones.
        expect(RIPPLE_IMPACT_RINGS[RIPPLE_IMPACT_RINGS.length - 1].glowPx).toBeGreaterThan(RIPPLE_IMPACT_RINGS[0].glowPx);
    });

    it('drops the warped launch and fade into one shared ballistic keyframe', () => {
        // Gravity, not a ping-pong: the rise decelerates and the fall accelerates, so the apex is a
        // real turning point. Both halves live in the same keyframe via per-segment timing functions.
        expect(RIPPLE_KEYFRAMES).toContain('cubic-bezier(0.14, 0.72, 0.42, 1)');
        expect(RIPPLE_KEYFRAMES).toContain('cubic-bezier(0.62, 0.02, 0.9, 0.46)');
        expect(RIPPLE_KEYFRAMES).toMatch(/@keyframes ripple-droplet-arc \{\s*0% \{[^}]*translateY\(0em\)/);
    });

    it('lights the surface with drifting caustics that never line up with themselves', () => {
        const markup = renderRipple();

        // Counted on the inline `animation:` shorthand so the injected @keyframes name is not counted.
        expect(markup.match(/animation:ripple-caustic-drift/g)?.length ?? 0).toBe(RIPPLE_CAUSTIC_POOLS.length);
        // Same drift for every pool; desynchronised by duration and a negative delay so the pattern
        // never visibly repeats.
        const durations = RIPPLE_CAUSTIC_POOLS.map(pool => pool.durationSec);
        expect(new Set(durations).size).toBe(durations.length);
        expect(RIPPLE_CAUSTIC_POOLS.every(pool => pool.delaySec < 0)).toBe(true);
    });

    it('blooms light behind the landing word, behind the glyphs', () => {
        const markup = renderRipple();

        expect(markup).toContain('--ripple-bloom-core:');
        expect(RIPPLE_KEYFRAMES).toContain('@keyframes ripple-word-bloom');
        // Attached through a state-scoped rule, not inline: the word spans are keyed by index and
        // reused across lines, so an inline animation would never restart on the second line.
        expect(RIPPLE_KEYFRAMES).toContain('.visualizer-ripple [data-ripple-state="active"]::before');
        // Behind the glyphs, in front of the water — which only works inside an isolated context.
        expect(markup).toContain('isolation:isolate');
        expect(RIPPLE_KEYFRAMES).toContain('z-index: -1');
        expect(RIPPLE_IMPACT_BLOOM.restingScale).toBeLessThan(1);
    });

    it('keeps the ambient surface breathing gated on audio energy', () => {
        const markup = renderRipple();

        // Caustics and the plane wash both read --ripple-energy, so the surface gets livelier with the
        // music instead of drifting at a fixed strength.
        const energyReads = markup.match(/var\(--ripple-energy, 0\)/g)?.length ?? 0;
        expect(energyReads).toBeGreaterThanOrEqual(3);
    });

    it('keeps every injected selector scoped to this mode', () => {
        // An injected <style> is document-global. The keyframe *names* are namespaced by their own
        // name; the selectors must never start unscoped.
        expect(RIPPLE_KEYFRAMES).not.toMatch(/^\[data-ripple-state/m);
        expect(RIPPLE_KEYFRAMES).toContain('.visualizer-ripple [data-ripple-state]:not([data-ripple-state="reflection"])::before');
    });
});

describe('VisualizerRipple style tuning', () => {
    const renderRipple = (overrides: Record<string, unknown> = {}) => renderToStaticMarkup(
        React.createElement(VisualizerRipple, {
            currentTime: motionValue(0),
            currentLineIndex: 0,
            lines: [createLine()],
            theme: DEFAULT_THEME,
            audioPower: motionValue(0),
            audioBands: createAudioBands(),
            ...overrides,
        }),
    );

    it('reproduces the shipped look at the default 1.00x tuning', () => {
        const markup = renderRipple({ rippleTuning: DEFAULT_RIPPLE_TUNING });

        // Every field is a multiplier, so the default must be a no-op against the geometry constants.
        expect(markup).toContain(`animation: ripple-word-drop ${RIPPLE_DROP_DURATION_SEC}s ease-out both`);
        expect(markup).toContain('width:1.95em');
        expect(markup).toContain('rgba(0,0,0,0.44)');
        expect(markup).toContain('scale="8"');
        expect(markup).toContain('opacity:0.95');
        expect(markup).toContain(RIPPLE_AIRBORNE_POSE);
    });

    it('falls back to the shipped look when no tuning reaches the renderer', () => {
        // The renderer is mounted from the OBS overlay, the wallpaper layer and the playground, and
        // only some of those carry a tuning bundle.
        expect(renderRipple()).toBe(renderRipple({ rippleTuning: DEFAULT_RIPPLE_TUNING }));
    });

    it('multiplies its own font scale on top of the shared lyrics font scale', () => {
        expect(renderRipple({ rippleTuning: { ...DEFAULT_RIPPLE_TUNING, fontScale: 2 } }))
            .toContain('clamp(5.200rem, 12.800vw, 9.500rem)');
        // The two multipliers compose rather than override each other.
        expect(renderRipple({ rippleTuning: { ...DEFAULT_RIPPLE_TUNING, fontScale: 2 }, lyricsFontScale: 2 }))
            .toContain('clamp(10.400rem, 25.600vw, 19.000rem)');
    });

    it('divides every animation duration by the animation-speed multiplier', () => {
        const markup = renderRipple({ rippleTuning: { ...DEFAULT_RIPPLE_TUNING, animationSpeed: 2 } });

        expect(markup).toContain('animation: ripple-word-drop 0.575s ease-out both');
        expect(markup).toContain('ripple-impact-ring 0.675s');
        expect(markup).toContain('ripple-caustic-drift 6.25s');
        expect(markup).toContain('ripple-waterline-wobble 3.4s');
    });

    it('rebuilds the airborne pose so the drop height moves the fall distance', () => {
        const tuning = { ...DEFAULT_RIPPLE_TUNING, dropHeight: 0.5 };
        const markup = renderRipple({ rippleTuning: tuning });
        const pose = buildRippleAirbornePose(0.5);

        // Both the waiting word and the first keyframe read the same rebuilt pose, so they cannot drift.
        expect(pose).toContain('-0.450em');
        expect(markup).toContain(pose);
        expect(markup).not.toContain(RIPPLE_AIRBORNE_POSE);
    });

    it('scales the impact alphas with the ripple-strength multiplier', () => {
        expect(renderRipple({ rippleTuning: { ...DEFAULT_RIPPLE_TUNING, rippleStrength: 0 } }))
            .toContain('rgba(0,0,0,0)');
        expect(renderRipple({ rippleTuning: { ...DEFAULT_RIPPLE_TUNING, rippleStrength: 0 } }))
            .not.toContain('rgba(0,0,0,0.44)');
    });

    it('scales the ambient layer and the reflection with their own multipliers', () => {
        expect(renderRipple({ rippleTuning: { ...DEFAULT_RIPPLE_TUNING, ambientStrength: 2 } }))
            .toContain(`calc((${RIPPLE_AMBIENT_BASE_OPACITY} + var(--ripple-energy, 0) * ${RIPPLE_AMBIENT_ENERGY_OPACITY}) * 2)`);
        expect(renderRipple({ rippleTuning: { ...DEFAULT_RIPPLE_TUNING, reflectionStrength: 0.5 } }))
            .toContain('opacity:0.475');
    });

    it('scales the SVG displacement so the water can bend the glyphs more or less', () => {
        // 0 is a legitimate value: still water, a plain mirror with no refraction at all.
        expect(renderRipple({ rippleTuning: { ...DEFAULT_RIPPLE_TUNING, waterDistortion: 0 } }))
            .toContain('scale="0"');
        expect(renderRipple({ rippleTuning: { ...DEFAULT_RIPPLE_TUNING, waterDistortion: 2.5 } }))
            .toContain('scale="20"');
    });

    it('drops each water layer independently when its toggle is off', () => {
        const off = (patch: Record<string, unknown>) => renderRipple({
            rippleTuning: { ...DEFAULT_RIPPLE_TUNING, ...patch },
        });

        // Counted on the inline `animation:` shorthand wherever the animation is inline, and on the
        // state-scoped rule in the injected stylesheet for the two keyframe-driven ones — the
        // `@keyframes` declarations themselves are always present, so a bare name proves nothing.
        expect(off({ showWaterSurface: false })).not.toContain('animation:ripple-waterline-wobble');
        expect(off({ showWaterSurface: false })).not.toContain('animation:ripple-caustic-drift');
        expect(off({ showAmbient: false })).not.toContain('animation:ripple-ambient-expand');
        expect(off({ showSplash: false })).not.toContain('animation:ripple-droplet-arc');
        expect(off({ showImpact: false })).not.toContain('animation:ripple-impact-crown');
        expect(off({ showImpact: false })).not.toContain('animation:ripple-impact-well');
        expect(off({ showReflection: false })).not.toContain('filter:url(#ripple-water-');

        // Hiding the water decoration must not take the impact anchor with it: the splash is positioned
        // in that coordinate space, so the whole layer would jump to the centre of the frame.
        expect(off({ showWaterSurface: false })).toContain('--ripple-impact-x');
        expect(off({ showWaterSurface: false })).toContain('ripple-impact-ring');
    });
});
