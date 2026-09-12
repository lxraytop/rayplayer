import React, { useEffect, useId, useMemo, useState } from 'react';
import { RIPPLE_WATER_DISTORTION } from './rippleVisuals';

// src/components/visualizer/ripple/RippleWaterFilter.tsx
// SVG filter defs that bend the reflection. `feTurbulence` generates the wave field and
// `feDisplacementMap` pushes every pixel of the mirrored lyric along it, which is the same primitive
// pair every "seen through water" effect is built from.
//
// The defs live in a zero-sized <svg> rather than a stylesheet so each renderer instance owns a
// unique filter id. Several instances of this mode can be alive at once (main window, OBS browser
// source, wallpaper layer, VisPlayground), and a shared hardcoded id would break as soon as one of
// them unmounted. A zero-sized inline <svg> is used instead of `display: none` because a filter
// reference has to stay in the render tree to resolve.

/**
 * Tracks `prefers-reduced-motion` so the morphing can be dropped while the still refraction stays.
 * Mirrors the helper used by `MonetBackgroundLayer`, including reacting to preference changes.
 */
const useRippleWaterMotionEnabled = () => {
    const [enabled, setEnabled] = useState(() => (
        typeof window === 'undefined'
        || typeof window.matchMedia !== 'function'
        || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ));

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return;
        }

        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setEnabled(!query.matches);
        sync();
        query.addEventListener('change', sync);
        return () => query.removeEventListener('change', sync);
    }, []);

    return enabled;
};

/**
 * Builds the per-instance filter ids. React's `useId` punctuation is stripped so the result stays a
 * valid `url(#…)` fragment across React versions.
 */
export const useRippleWaterFilterId = () => {
    const rawId = useId();
    const suffix = rawId.replace(/[^a-zA-Z0-9_-]/g, '') || 'layer';
    return useMemo(() => `ripple-water-${suffix}`, [suffix]);
};

interface RippleWaterFilterDefsProps {
    filterId: string;
    /** Peak displacement in px, already scaled by the tuning's water-distortion multiplier. */
    distortionScale?: number;
    /** Morph loop length in seconds, already divided by the tuning's animation-speed multiplier. */
    morphDurationSec?: number;
}

const RippleWaterFilterDefs: React.FC<RippleWaterFilterDefsProps> = ({
    filterId,
    distortionScale,
    morphDurationSec,
}) => {
    const motionEnabled = useRippleWaterMotionEnabled();
    const base = RIPPLE_WATER_DISTORTION;
    const { baseFrequency, morphValues, numOctaves, seed, region } = base;
    const scale = distortionScale ?? base.scale;
    const duration = morphDurationSec ?? base.morphDurationSec;

    return (
        <svg
            aria-hidden="true"
            focusable="false"
            width={0}
            height={0}
            style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        >
            <defs>
                {/* The region only needs to cover the displacement travel, not a blurred halo, so it
                    is kept tight: the filter re-rasterises every frame the morph animation runs and
                    the cost is proportional to this box. */}
                <filter
                    id={filterId}
                    x={region.x}
                    y={region.y}
                    width={region.width}
                    height={region.height}
                    colorInterpolationFilters="sRGB"
                >
                    {/* The noise is anisotropic on purpose: a low horizontal frequency and a higher
                        vertical one produce long horizontal bands, which is how a reflection actually
                        breaks up on moving water. */}
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency={baseFrequency}
                        numOctaves={numOctaves}
                        seed={seed}
                        result="ripple-water-noise"
                    >
                        {motionEnabled && (
                            <animate
                                attributeName="baseFrequency"
                                dur={`${duration}s`}
                                values={morphValues}
                                repeatCount="indefinite"
                            />
                        )}
                    </feTurbulence>
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="ripple-water-noise"
                        scale={scale}
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>
            </defs>
        </svg>
    );
};

export default RippleWaterFilterDefs;
