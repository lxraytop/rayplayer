import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { DEFAULT_RIPPLE_TUNING, type RippleTuning } from '../../../types';
import { resolveThemeFontStack, resolveThemeFontWeight, resolveThemeTranslationFontStack } from '../../../utils/fontStacks';
import { colorWithAlpha, mixColors } from '../colorMix';
import type { VisualizerSharedProps } from '../definition';
import { useVisualizerRuntime } from '../runtime';
import VisualizerShell from '../VisualizerShell';
import { resolveWordColor } from '../wordColoring';
import {
    buildRippleWords,
    resolveRippleActiveWordIndex,
    resolveRippleWordState,
    type RippleWord,
    type RippleWordState,
} from './rippleModel';
import RippleWaterFilterDefs, { useRippleWaterFilterId } from './RippleWaterFilter';
import { RIPPLE_IMPACT_ANCHOR_ATTRIBUTE, useRippleImpactAnchor } from './useRippleImpactAnchor';
import {
    RIPPLE_AIRBORNE_BLUR_PX,
    RIPPLE_AMBIENT_BASE_OPACITY,
    RIPPLE_AMBIENT_ENERGY_OPACITY,
    RIPPLE_AMBIENT_RINGS,
    RIPPLE_CAUSTIC_BASE_OPACITY,
    RIPPLE_CAUSTIC_ENERGY_OPACITY,
    RIPPLE_CAUSTIC_POOLS,
    RIPPLE_DROP_DURATION_SEC,
    RIPPLE_IMPACT_BLOOM,
    RIPPLE_IMPACT_FLASH,
    RIPPLE_IMPACT_RINGS,
    RIPPLE_IMPACT_WELL,
    RIPPLE_REFLECTION_BLUR_PX,
    RIPPLE_REFLECTION_MASK,
    RIPPLE_REFLECTION_OPACITY,
    RIPPLE_REFLECTION_SQUASH,
    RIPPLE_REFLECTION_SWAY_DURATION_SEC,
    RIPPLE_SHEEN_DURATION_SEC,
    RIPPLE_SPLASH_DROPLETS,
    RIPPLE_SPLASH_PERSPECTIVE,
    RIPPLE_SURFACE_PLANE,
    RIPPLE_WATER_DISTORTION,
    RIPPLE_WATERLINE_WOBBLE_DURATION_SEC,
    RIPPLE_WORD_OPACITY,
    RIPPLE_WORD_SETTLED_OFFSET_EM,
    buildRippleAirbornePose,
    buildRippleKeyframes,
} from './rippleVisuals';

// src/components/visualizer/ripple/VisualizerRipple.tsx
// "Ripple" — every word is thrown into the water. Pending words hang above the surface blurred and
// dim, a landing word slams in and rings down to rest, and the impact answers with a full splash: a
// crater that opens and springs back, droplets thrown up and falling again, a decaying train of waves
// running outwards along the waterline, and a brief bloom of light around the word itself.
// Only discrete word-level state enters React; the playback clock and audio energy stay on
// MotionValue / CSS variables so a 60fps clock never triggers a re-render.
//
// Every visual constant here is multiplied by the user's `rippleTuning`, so the shipped look is
// exactly the `1.00x` default and the settings panel can dial it from "barely there" to "storm".

const RIPPLE_TRANSITION_MS = 260;

const clampAlpha = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Turns a tuning speed multiplier into an animation length. Dividing by the multiplier is what makes
 * the slider read as "speed": 2.00x halves every duration, 0.50x doubles it. A speed of 0 or below
 * would produce an infinite duration, so it falls back to 1 (the store already clamps to a floor).
 */
const resolveAtSpeed = (baseSec: number, speed: number) => Number((baseSec / (speed > 0 ? speed : 1)).toFixed(3));

/**
 * Paint for one ripple ring. A wave front is not a drawn line: it has a lit crest with a soft body of
 * displaced water on either side of it, so the crisp border is paired with a gradient band and a
 * glow. `glowPx` grows with the ring so the outer, slower waves look heavier rather than merely
 * fainter. `strength` is the user's multiplier and is applied to every alpha, so `1` is the design.
 */
const buildRingStyle = (
    ring: (typeof RIPPLE_IMPACT_RINGS)[number],
    color: string,
    strength: number,
    durationSec: number,
    delaySec: number,
): React.CSSProperties => {
    const alpha = clampAlpha(ring.colorAlpha * strength);
    const crest = colorWithAlpha(color, alpha);
    const band = colorWithAlpha(color, Number((alpha * 0.32).toFixed(3)));
    const halo = colorWithAlpha(color, Number((alpha * 0.4).toFixed(3)));
    const innerHalo = colorWithAlpha(color, Number((alpha * 0.26).toFixed(3)));

    return {
        width: `${ring.widthEm}em`,
        height: `${ring.heightEm}em`,
        marginLeft: `${-ring.widthEm / 2}em`,
        marginTop: `${-ring.heightEm / 2}em`,
        border: `${ring.borderPx}px solid ${crest}`,
        background: `radial-gradient(ellipse 50% 50% at 50% 50%, transparent 68%, ${band} 86%, transparent 100%)`,
        boxShadow: `0 0 ${ring.glowPx}px ${halo}, inset 0 0 ${ring.glowPx}px ${innerHalo}`,
        // A decelerating curve: a wave front slows as it travels, so it must not expand linearly.
        animation: `ripple-impact-ring ${durationSec}s cubic-bezier(0.16, 0.84, 0.28, 1) ${delaySec}s both`,
    };
};

const VisualizerRipple: React.FC<VisualizerSharedProps> = ({
    currentTime,
    currentLineIndex,
    lines,
    theme,
    subtitleTheme,
    isDaylight = false,
    audioPower,
    audioBands,
    showText = true,
    lyricsFontScale = 1,
    subtitleFontScale = 1,
    hideTranslationSubtitle = false,
    rippleTuning,
    ...sharedProps
}) => {
    const tuning: RippleTuning = rippleTuning ?? DEFAULT_RIPPLE_TUNING;
    const speed = tuning.animationSpeed;

    const { activeLine } = useVisualizerRuntime({ currentTime, currentLineIndex, lines });
    const words = useMemo(() => buildRippleWords(activeLine), [activeLine]);
    const [activeWordIndex, setActiveWordIndex] = useState(() => resolveRippleActiveWordIndex(words, currentTime.get()));
    const waterFilterId = useRippleWaterFilterId();

    // Discrete state only: the updater compares old and new so the per-frame clock never re-renders.
    useMotionValueEvent(currentTime, 'change', time => {
        const next = resolveRippleActiveWordIndex(words, time);
        setActiveWordIndex(previous => (previous === next ? previous : next));
    });

    // A new line must reset the surface immediately, even before the next clock tick arrives.
    useEffect(() => {
        setActiveWordIndex(resolveRippleActiveWordIndex(words, currentTime.get()));
    }, [words, currentTime]);

    // Audio energy drives the whole water surface (ambient ring strength, caustics, sheen, waterline
    // thickness) through one CSS variable on the surface wrapper, never through React state. The
    // tuning's audio-reactivity multiplier is applied here, before it is written, so the surface can
    // be made to breathe harder or to sit almost still — and it is re-written when the multiplier
    // changes, not only on the next audio tick, so the slider responds while paused.
    const surfaceRef = useRef<HTMLDivElement | null>(null);
    const energyRef = useRef(0);
    const writeSurfaceEnergy = useCallback(() => {
        const element = surfaceRef.current;
        if (!element) {
            return;
        }
        const energy = clampAlpha(energyRef.current * tuning.audioReactivity);
        element.style.setProperty('--ripple-energy', energy.toFixed(3));
    }, [tuning.audioReactivity]);

    useMotionValueEvent(audioPower, 'change', value => {
        energyRef.current = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
        writeSurfaceEnergy();
    });

    useEffect(() => {
        writeSurfaceEnergy();
    }, [writeSurfaceEnergy]);

    const resolvedSubtitleTheme = subtitleTheme ?? theme;
    const fontStack = resolveThemeFontStack(theme);
    const fontWeight = resolveThemeFontWeight(theme, 600);

    // Lyrics sit alone on the water, so they take the headline treatment other modes reserve for their
    // hero line. `lyricsFontScale` widens the clamp rather than scaling the box, which keeps the
    // ripple train — sized in `em` off this value — in the same coordinate space as the glyphs. The
    // mode's own `fontScale` multiplies on top so the water can be tuned without moving every other
    // mode's lyric size.
    const safeLyricsScale = lyricsFontScale > 0 ? lyricsFontScale : 1;
    const effectiveLyricsScale = safeLyricsScale * tuning.fontScale;
    const wordFontSize = `clamp(${(2.6 * effectiveLyricsScale).toFixed(3)}rem, ${(6.4 * effectiveLyricsScale).toFixed(3)}vw, ${(4.75 * effectiveLyricsScale).toFixed(3)}rem)`;
    const translationScale = effectiveLyricsScale * (subtitleFontScale > 0 ? subtitleFontScale : 1);
    const translationFontSize = `clamp(${(1.05 * translationScale).toFixed(3)}rem, ${(2.4 * translationScale).toFixed(3)}vw, ${(1.5 * translationScale).toFixed(3)}rem)`;

    // The falling pose and the drop length are the two values the keyframes themselves interpolate,
    // so they are rebuilt (not merely scaled) whenever the tuning changes. `buildRippleAirbornePose`
    // is shared with the waiting-word resting transform below, so a word never jumps on landing.
    const airbornePose = buildRippleAirbornePose(tuning.dropHeight);
    const keyframes = useMemo(() => buildRippleKeyframes({
        dropDurationSec: resolveAtSpeed(RIPPLE_DROP_DURATION_SEC, speed),
        airbornePose,
    }), [airbornePose, speed]);

    const transitionMs = Math.round(RIPPLE_TRANSITION_MS / (speed > 0 ? speed : 1));

    // The lyric column is the measuring scope for the impact anchor: it holds both the crisp row and
    // the reflection, and only the crisp row carries the word-index attribute the hook looks for.
    const lyricHostRef = useRef<HTMLDivElement | null>(null);
    useRippleImpactAnchor(lyricHostRef, surfaceRef, activeWordIndex, wordFontSize);

    // Words that have already hit the water. Their splash stays mounted so a train is never truncated
    // mid-expansion when the next word lands a fraction of a second later — each train's animation is
    // finite, so a finished one costs nothing to keep around.
    const landedWords = useMemo(
        () => words.filter(word => resolveRippleWordState(word, activeWordIndex) !== 'waiting'),
        [words, activeWordIndex],
    );

    const resolveColor = (word: RippleWord, state: RippleWordState) => {
        if (state === 'active') {
            return resolveWordColor(word.text, theme.wordColors, theme.accentColor);
        }
        if (state === 'passed') {
            return mixColors(theme.primaryColor, theme.secondaryColor, 0.4);
        }
        return colorWithAlpha(theme.secondaryColor, 0.75);
    };

    // The reflection re-renders the same revealed words; using the shared renderer keeps the
    // reflection from spoiling words that have not landed yet.
    const renderWordRow = (mirrored: boolean) => (
        <div
            className="flex flex-wrap items-center justify-center"
            style={{
                fontFamily: fontStack,
                fontWeight,
                fontSize: wordFontSize,
                letterSpacing: '0.012em',
                columnGap: '0.34em',
                rowGap: '0.16em',
            }}
        >
            {words.map(word => {
                const state = resolveRippleWordState(word, activeWordIndex);
                const color = resolveColor(word, state);
                const isWaiting = state === 'waiting';
                const opacity = mirrored
                    ? (isWaiting ? RIPPLE_WORD_OPACITY.mirrorWaiting : RIPPLE_WORD_OPACITY.mirrorRevealed)
                    : (isWaiting ? RIPPLE_WORD_OPACITY.waiting : state === 'passed' ? RIPPLE_WORD_OPACITY.passed : RIPPLE_WORD_OPACITY.active);
                // Waiting words are lifted clear of the surface, a sung word sits on it, and a word that
                // has already sunk rides fractionally lower — that small drop is what reads as depth.
                const restingTransform = isWaiting
                    ? airbornePose
                    : state === 'passed'
                        ? `translateY(${RIPPLE_WORD_SETTLED_OFFSET_EM}em)`
                        : 'translateY(0px)';

                return (
                    <span
                        key={`${mirrored ? 'mirror' : 'main'}-${word.index}`}
                        data-ripple-state={mirrored ? 'reflection' : state}
                        {...(mirrored ? {} : { [RIPPLE_IMPACT_ANCHOR_ATTRIBUTE]: word.index })}
                        className="relative inline-block"
                        style={{
                            color,
                            opacity,
                            transform: mirrored ? 'none' : restingTransform,
                            filter: mirrored ? 'none' : isWaiting ? `blur(${RIPPLE_AIRBORNE_BLUR_PX}px)` : 'blur(0px)',
                            textShadow: !mirrored && state === 'active' ? `0 0 0.5em ${colorWithAlpha(color, 0.5)}` : 'none',
                            transition: `color ${transitionMs}ms ease, opacity ${transitionMs}ms ease, transform ${transitionMs}ms ease, filter ${transitionMs}ms ease`,
                            ...(mirrored ? {} : {
                                // `isolate` gives every word its own stacking context so the `::before`
                                // bloom can sit at `z-index: -1` — behind the glyphs, but still in
                                // front of the water. Without it the glow would paint over the text.
                                isolation: 'isolate',
                                '--ripple-bloom-core': colorWithAlpha(color, RIPPLE_IMPACT_BLOOM.alpha),
                            }),
                        } as React.CSSProperties}
                    >
                        {word.text}
                    </span>
                );
            })}
        </div>
    );

    return (
        <VisualizerShell
            theme={theme}
            audioPower={audioPower}
            audioBands={audioBands}
            sharedProps={{ ...sharedProps, isDaylight }}
            className="visualizer-ripple"
        >
            <style>{keyframes}</style>
            <RippleWaterFilterDefs
                filterId={waterFilterId}
                distortionScale={RIPPLE_WATER_DISTORTION.scale * tuning.waterDistortion}
                morphDurationSec={resolveAtSpeed(RIPPLE_WATER_DISTORTION.morphDurationSec, speed)}
            />
            {showText && activeLine && (
                <div className="absolute inset-0 z-0 flex flex-col items-center justify-center px-8 pb-20 pointer-events-none">
                    <div ref={lyricHostRef} className="flex w-full max-w-[92rem] flex-col items-center">
                        {renderWordRow(false)}

                        {/* Water surface. The audio energy is written into --ripple-energy on this
                            wrapper and read by the plane glow, the caustics, the ambient rings, the
                            sheen and the waterline so the whole surface breathes as one layer.
                            --ripple-impact-x is written by useRippleImpactAnchor and carries the
                            landing word's horizontal offset. The wrapper itself always renders: it is
                            the coordinate space the impact anchor is written into, so hiding the water
                            decoration must not move the splash. */}
                        <div
                            ref={surfaceRef}
                            className="relative mt-[0.5em] w-full max-w-[46rem]"
                            style={{ '--ripple-energy': '0', '--ripple-impact-x': '0px' } as React.CSSProperties}
                        >
                            {tuning.showWaterSurface && (
                                <>
                                    {/* The broad wash of light on the plane. Without it the waterline is a
                                        hairline drawn on nothing. */}
                                    <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute left-1/2 top-1/2 rounded-[50%]"
                                        style={{
                                            width: `${RIPPLE_SURFACE_PLANE.widthRem}rem`,
                                            height: `${RIPPLE_SURFACE_PLANE.heightRem}rem`,
                                            transform: 'translate(-50%, -50%)',
                                            background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${colorWithAlpha(theme.accentColor, RIPPLE_SURFACE_PLANE.colorAlpha)}, transparent 74%)`,
                                            opacity: `calc(${RIPPLE_SURFACE_PLANE.baseOpacity} + var(--ripple-energy, 0) * ${RIPPLE_SURFACE_PLANE.energyOpacity})`,
                                        }}
                                    />

                                    {/* Caustics: pools of light sliding over the water, each on its own
                                        duration so the pattern never lines up with itself. */}
                                    <div
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0"
                                        style={{ opacity: `calc(${RIPPLE_CAUSTIC_BASE_OPACITY} + var(--ripple-energy, 0) * ${RIPPLE_CAUSTIC_ENERGY_OPACITY})` }}
                                    >
                                        {RIPPLE_CAUSTIC_POOLS.map((pool, index) => (
                                            <span
                                                key={`caustic-${index}`}
                                                className="absolute left-1/2 top-1/2 rounded-[50%]"
                                                style={{
                                                    width: `${pool.widthRem}rem`,
                                                    height: `${pool.heightRem}rem`,
                                                    background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${colorWithAlpha(theme.primaryColor, pool.opacity)}, transparent 72%)`,
                                                    // Blurred once and then moved by the compositor: the
                                                    // drift animation only touches transform and opacity.
                                                    filter: 'blur(6px)',
                                                    animation: `ripple-caustic-drift ${resolveAtSpeed(pool.durationSec, speed)}s ease-in-out infinite`,
                                                    animationDelay: `${resolveAtSpeed(pool.delaySec, speed)}s`,
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* A soft light sweeping along the surface, brightness gated by audio
                                        energy. */}
                                    <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute left-0 w-[38%] rounded-full"
                                        style={{
                                            top: 'calc(50% - 5px)',
                                            height: '10px',
                                            background: `radial-gradient(closest-side, ${colorWithAlpha(theme.primaryColor, 0.5)}, transparent)`,
                                            filter: 'blur(3px)',
                                            animation: `ripple-sheen-drift ${resolveAtSpeed(RIPPLE_SHEEN_DURATION_SEC, speed)}s ease-in-out infinite`,
                                        }}
                                    />

                                    {/* Waterline: the still surface the words are thrown into. Its thickness
                                        follows the audio energy written into --ripple-energy above, and the
                                        swell is animated on a wrapper so the two transforms do not
                                        overwrite each other. */}
                                    <div style={{ animation: `ripple-waterline-wobble ${resolveAtSpeed(RIPPLE_WATERLINE_WOBBLE_DURATION_SEC, speed)}s ease-in-out infinite` }}>
                                        <div
                                            className="relative h-[1.5px] w-full rounded-full"
                                            style={{
                                                background: `linear-gradient(90deg, transparent, ${colorWithAlpha(theme.accentColor, 0.75)}, transparent)`,
                                                transform: 'scaleY(calc(0.9 + var(--ripple-energy, 0) * 2.2))',
                                                boxShadow: `0 0 22px ${colorWithAlpha(theme.accentColor, 0.4)}`,
                                            }}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Ambient rings keep the water moving between word drops. The tuning's
                                ambient multiplier scales the whole layer, energy term included, so 0
                                stills the surface without touching the impact rings. */}
                            {tuning.showAmbient && (
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-0"
                                    style={{ opacity: `calc((${RIPPLE_AMBIENT_BASE_OPACITY} + var(--ripple-energy, 0) * ${RIPPLE_AMBIENT_ENERGY_OPACITY}) * ${tuning.ambientStrength})` }}
                                >
                                    {RIPPLE_AMBIENT_RINGS.map((ring, index) => (
                                        <span
                                            key={`ambient-${index}`}
                                            className="absolute left-1/2 top-1/2 rounded-[50%]"
                                            style={{
                                                width: `${ring.widthRem}rem`,
                                                height: `${ring.heightRem}rem`,
                                                transform: 'translate(-50%, -50%)',
                                                border: `1px solid ${colorWithAlpha(theme.accentColor, ring.opacity)}`,
                                                animation: `ripple-ambient-expand ${resolveAtSpeed(ring.durationSec, speed)}s ease-out infinite`,
                                                animationDelay: `${resolveAtSpeed(ring.delaySec, speed)}s`,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Splash trains. The anchor is a zero-sized point sitting exactly on the
                                waterline, offset horizontally to the word that landed. Each landed word
                                drops a crater, a decaying train of flat ellipses, a crown flash and a
                                fan of droplets, in that paint order — crater behind, droplets in front.
                                Flat rather than round because this is a surface seen at an angle, and
                                `zIndex` keeps the splash reading as sitting *on* the water rather than
                                behind it. */}
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute top-1/2"
                                style={{
                                    left: 'calc(50% + var(--ripple-impact-x, 0px))',
                                    zIndex: 2,
                                    fontSize: wordFontSize,
                                }}
                            >
                                {landedWords.map(word => {
                                    const rippleColor = resolveWordColor(word.text, theme.wordColors, theme.accentColor);
                                    const wellCoreAlpha = clampAlpha(RIPPLE_IMPACT_WELL.coreAlpha * tuning.rippleStrength);
                                    const wellLipAlpha = clampAlpha(RIPPLE_IMPACT_WELL.lipAlpha * tuning.rippleStrength);

                                    return (
                                        <React.Fragment key={`impact-${currentLineIndex}-${word.index}`}>
                                            {tuning.showImpact && (
                                                <>
                                                    {/* The crater: a darkened core where the surface is pushed
                                                        down, ringed by the lit lip of the displaced water. */}
                                                    <span
                                                        className="pointer-events-none absolute left-0 top-0 rounded-[50%]"
                                                        style={{
                                                            width: `${RIPPLE_IMPACT_WELL.widthEm}em`,
                                                            height: `${RIPPLE_IMPACT_WELL.heightEm}em`,
                                                            marginLeft: `${-RIPPLE_IMPACT_WELL.widthEm / 2}em`,
                                                            marginTop: `${-RIPPLE_IMPACT_WELL.heightEm / 2}em`,
                                                            background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,${wellCoreAlpha}) 0%, rgba(0,0,0,${Number((wellCoreAlpha * 0.4).toFixed(2))}) 40%, transparent 58%, ${colorWithAlpha(rippleColor, wellLipAlpha)} 78%, transparent 100%)`,
                                                            animation: `ripple-impact-well ${resolveAtSpeed(RIPPLE_IMPACT_WELL.durationSec, speed)}s cubic-bezier(0.16, 0.84, 0.28, 1) both`,
                                                        }}
                                                    />
                                                    {RIPPLE_IMPACT_RINGS.map((ring, layer) => (
                                                        <span
                                                            key={`ring-${layer}`}
                                                            className="pointer-events-none absolute left-0 top-0 rounded-[50%]"
                                                            style={buildRingStyle(
                                                                ring,
                                                                rippleColor,
                                                                tuning.rippleStrength,
                                                                resolveAtSpeed(ring.durationSec, speed),
                                                                resolveAtSpeed(ring.delaySec, speed),
                                                            )}
                                                        />
                                                    ))}
                                                    <span
                                                        className="pointer-events-none absolute left-0 top-0 rounded-[50%]"
                                                        style={{
                                                            width: `${RIPPLE_IMPACT_FLASH.widthEm}em`,
                                                            height: `${RIPPLE_IMPACT_FLASH.heightEm}em`,
                                                            marginLeft: `${-RIPPLE_IMPACT_FLASH.widthEm / 2}em`,
                                                            marginTop: `${-RIPPLE_IMPACT_FLASH.heightEm / 2}em`,
                                                            background: `radial-gradient(closest-side, ${colorWithAlpha(rippleColor, clampAlpha(RIPPLE_IMPACT_FLASH.colorAlpha * tuning.rippleStrength))}, transparent 76%)`,
                                                            filter: 'blur(1.5px)',
                                                            animation: `ripple-impact-crown ${resolveAtSpeed(RIPPLE_IMPACT_FLASH.durationSec, speed)}s ease-out both`,
                                                        }}
                                                    />
                                                </>
                                            )}
                                            {/* Droplets thrown clear of the crater. The outer span only
                                                aims the launch (rotate) and squashes it into the tilted
                                                plane (scaleY); the inner span runs one shared ballistic
                                                keyframe whose travel is scaled by the droplet's own
                                                font size, so a bigger drop is thrown further. */}
                                            {tuning.showSplash && RIPPLE_SPLASH_DROPLETS.map((droplet, dropIndex) => (
                                                <span
                                                    key={`droplet-${dropIndex}`}
                                                    className="pointer-events-none absolute left-0 top-0"
                                                    style={{ transform: `rotate(${droplet.angleDeg}deg) scaleY(${RIPPLE_SPLASH_PERSPECTIVE})` }}
                                                >
                                                    <span
                                                        className="pointer-events-none absolute left-0 top-0 rounded-[50%]"
                                                        style={{
                                                            width: `${droplet.sizeRatio}em`,
                                                            height: `${droplet.sizeRatio}em`,
                                                            marginLeft: `${-droplet.sizeRatio / 2}em`,
                                                            marginTop: `${-droplet.sizeRatio / 2}em`,
                                                            fontSize: `${droplet.scale}em`,
                                                            background: `radial-gradient(closest-side, ${colorWithAlpha(rippleColor, clampAlpha(droplet.alpha * tuning.splashStrength))}, ${colorWithAlpha(rippleColor, Number((clampAlpha(droplet.alpha * tuning.splashStrength) * 0.5).toFixed(3)))} 42%, transparent 100%)`,
                                                            animation: `ripple-droplet-arc ${resolveAtSpeed(droplet.durationSec, speed)}s ease-out ${resolveAtSpeed(droplet.delaySec, speed)}s both`,
                                                        }}
                                                    />
                                                </span>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mirrored reflection. This is the one place the water is allowed to bend the
                            image: the SVG water filter displaces the glyphs, and the sway layer moves
                            the already-bent result so the refraction reads as a moving surface rather
                            than a fixed warp. */}
                        {tuning.showReflection && (
                            <div
                                className="w-full overflow-hidden"
                                style={{
                                    transform: `scaleY(${-RIPPLE_REFLECTION_SQUASH})`,
                                    transformOrigin: 'center',
                                    maskImage: RIPPLE_REFLECTION_MASK,
                                    WebkitMaskImage: RIPPLE_REFLECTION_MASK,
                                }}
                            >
                                <div
                                    style={{
                                        animation: `ripple-reflection-sway ${resolveAtSpeed(RIPPLE_REFLECTION_SWAY_DURATION_SEC, speed)}s ease-in-out infinite`,
                                        willChange: 'transform',
                                    }}
                                >
                                    {/* `fit-content` keeps the filtered box hugging the rendered text; the
                                        water filter re-rasterises every frame, so its cost scales with
                                        this box rather than with the full lyric column width. */}
                                    <div
                                        className="mx-auto"
                                        style={{
                                            width: 'fit-content',
                                            maxWidth: '100%',
                                            filter: `url(#${waterFilterId})`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                filter: `blur(${RIPPLE_REFLECTION_BLUR_PX}px)`,
                                                opacity: clampAlpha(RIPPLE_REFLECTION_OPACITY * tuning.reflectionStrength),
                                            }}
                                        >
                                            {renderWordRow(true)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeLine.translation && !hideTranslationSubtitle && (
                            <div
                                className="mt-8 text-center"
                                style={{
                                    color: resolvedSubtitleTheme.secondaryColor,
                                    fontFamily: resolveThemeTranslationFontStack(resolvedSubtitleTheme),
                                    fontWeight: resolveThemeFontWeight(resolvedSubtitleTheme, 400),
                                    fontSize: translationFontSize,
                                    letterSpacing: '0.08em',
                                    opacity: 0.85,
                                }}
                            >
                                {activeLine.translation}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </VisualizerShell>
    );
};

export default VisualizerRipple;
