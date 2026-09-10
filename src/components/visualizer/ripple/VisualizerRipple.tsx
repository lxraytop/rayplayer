import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValueEvent } from 'framer-motion';
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

// src/components/visualizer/ripple/VisualizerRipple.tsx
// "Ripple" — lyrics rest on a still water surface. Each word drops in as the vocal lands, emitting
// concentric rings and leaving a mirrored reflection under the waterline. Only discrete word-level
// state enters React; the playback clock and audio energy stay on MotionValue / CSS variables so a
// 60fps clock never triggers a re-render.

const RIPPLE_TRANSITION_MS = 260;

const RING_SIZE_PX = 96;

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
    ...sharedProps
}) => {
    const { activeLine } = useVisualizerRuntime({ currentTime, currentLineIndex, lines });
    const words = useMemo(() => buildRippleWords(activeLine), [activeLine]);
    const [activeWordIndex, setActiveWordIndex] = useState(() => resolveRippleActiveWordIndex(words, currentTime.get()));

    // Discrete state only: the updater compares old and new so the per-frame clock never re-renders.
    useMotionValueEvent(currentTime, 'change', time => {
        const next = resolveRippleActiveWordIndex(words, time);
        setActiveWordIndex(previous => (previous === next ? previous : next));
    });

    // A new line must reset the surface immediately, even before the next clock tick arrives.
    useEffect(() => {
        setActiveWordIndex(resolveRippleActiveWordIndex(words, currentTime.get()));
    }, [words, currentTime]);

    // Audio energy drives the waterline depth through a CSS variable, never through React state.
    const waterlineRef = useRef<HTMLDivElement | null>(null);
    useMotionValueEvent(audioPower, 'change', value => {
        const element = waterlineRef.current;
        if (!element) {
            return;
        }
        const energy = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
        element.style.setProperty('--ripple-energy', energy.toFixed(3));
    });

    const resolvedSubtitleTheme = subtitleTheme ?? theme;
    const fontStack = resolveThemeFontStack(theme);
    const fontWeight = resolveThemeFontWeight(theme, 600);

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
    // reflection from spoiling words that have not dropped yet.
    const renderWordRow = (mirrored: boolean) => (
        <div
            className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 ${mirrored ? 'blur-[1px]' : ''}`}
            style={{ fontFamily: fontStack, fontWeight, scale: lyricsFontScale, transformOrigin: 'center' }}
        >
            {words.map(word => {
                const state = resolveRippleWordState(word, activeWordIndex);
                const color = resolveColor(word, state);
                const opacity = mirrored
                    ? (state === 'waiting' ? 0.05 : 0.16)
                    : (state === 'waiting' ? 0.3 : state === 'passed' ? 0.72 : 1);

                return (
                    <span
                        key={`${mirrored ? 'mirror' : 'main'}-${word.index}`}
                        data-ripple-state={mirrored ? 'reflection' : state}
                        className="relative inline-block"
                        style={{
                            color,
                            opacity,
                            transform: `translateY(${mirrored ? 0 : state === 'waiting' ? 10 : 0}px)`,
                            filter: mirrored ? 'none' : state === 'waiting' ? 'blur(3px)' : 'blur(0px)',
                            textShadow: !mirrored && state === 'active' ? `0 0 24px ${colorWithAlpha(color, 0.45)}` : 'none',
                            transition: `color ${RIPPLE_TRANSITION_MS}ms ease, opacity ${RIPPLE_TRANSITION_MS}ms ease, transform ${RIPPLE_TRANSITION_MS}ms ease, filter ${RIPPLE_TRANSITION_MS}ms ease`,
                        }}
                    >
                        {word.text}
                        {!mirrored && state === 'active' && (
                            <>
                                <motion.span
                                    key={`ring-outer-${currentLineIndex}-${activeWordIndex}`}
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
                                    style={{
                                        width: RING_SIZE_PX,
                                        height: RING_SIZE_PX,
                                        marginLeft: -RING_SIZE_PX / 2,
                                        marginTop: -RING_SIZE_PX / 2,
                                        border: `1px solid ${colorWithAlpha(theme.accentColor, 0.55)}`,
                                    }}
                                    initial={{ scale: 0.18, opacity: 0.6 }}
                                    animate={{ scale: 1.7, opacity: 0 }}
                                    transition={{ duration: 1.05, ease: 'easeOut' }}
                                />
                                <motion.span
                                    key={`ring-inner-${currentLineIndex}-${activeWordIndex}`}
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
                                    style={{
                                        width: RING_SIZE_PX,
                                        height: RING_SIZE_PX,
                                        marginLeft: -RING_SIZE_PX / 2,
                                        marginTop: -RING_SIZE_PX / 2,
                                        border: `1px solid ${colorWithAlpha(theme.accentColor, 0.35)}`,
                                    }}
                                    initial={{ scale: 0.18, opacity: 0 }}
                                    animate={{ scale: 1.25, opacity: [0, 0.45, 0] }}
                                    transition={{ duration: 1.3, ease: 'easeOut', delay: 0.12 }}
                                />
                            </>
                        )}
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
            {showText && activeLine && (
                <div className="absolute inset-0 z-0 flex flex-col items-center justify-center px-10 pb-24 pointer-events-none">
                    <div className="flex w-full max-w-5xl flex-col items-center">
                        {renderWordRow(false)}

                        {/* Waterline: the still surface the words drop onto. Its thickness follows the
                            audio energy written into --ripple-energy above. */}
                        <div
                            ref={waterlineRef}
                            className="mt-1 h-[2px] w-full max-w-3xl rounded-full"
                            style={{
                                '--ripple-energy': '0',
                                background: `linear-gradient(90deg, transparent, ${colorWithAlpha(theme.accentColor, 0.55)}, transparent)`,
                                transform: 'scaleY(calc(0.8 + var(--ripple-energy, 0) * 1.8))',
                                boxShadow: `0 0 18px ${colorWithAlpha(theme.accentColor, 0.35)}`,
                            } as React.CSSProperties}
                        />

                        {/* Mirrored reflection, strongest at the surface and fading downward. The mask is
                            expressed pre-flip so it still reads correctly after scaleY(-1). */}
                        <div
                            className="-mt-1 w-full overflow-hidden"
                            style={{
                                transform: 'scaleY(-1)',
                                maskImage: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 72%)',
                                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 72%)',
                            }}
                        >
                            {renderWordRow(true)}
                        </div>

                        {activeLine.translation && !hideTranslationSubtitle && (
                            <div
                                className="mt-6 text-center tracking-wide"
                                style={{
                                    color: resolvedSubtitleTheme.secondaryColor,
                                    fontFamily: resolveThemeTranslationFontStack(resolvedSubtitleTheme),
                                    fontWeight: resolveThemeFontWeight(resolvedSubtitleTheme, 400),
                                    fontSize: '1.35rem',
                                    scale: lyricsFontScale * subtitleFontScale,
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
