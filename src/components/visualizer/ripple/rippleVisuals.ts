// src/components/visualizer/ripple/rippleVisuals.ts
// Geometry constants and CSS keyframes for the Ripple mode. Extracted from VisualizerRipple.tsx so
// the component stays focused on lyric timing/state while the look of the water (drop impact,
// surface ripple, ambient drift, reflection refraction) can be tuned in one place.
//
// The mode is built around one idea: every word is thrown into the water. Pending words hover above
// the surface, a landing word slams in and rings down to rest, and the impact answers with a whole
// splash — a crater that opens and springs back, a fan of droplets thrown up and falling again, and
// a decaying train of waves running outwards along the waterline.

/**
 * The "still in the air" pose. Pending words use it inline, and the drop animation starts from the
 * exact same pose, so a word never jumps when it stops waiting and starts falling. It is interpolated
 * into the keyframes below rather than duplicated, so the two can never drift apart.
 *
 * `dropHeight` is the tuning multiplier: `1` is the designed lift. The pose is *rebuilt* rather than
 * scaled with an extra transform because the `em` unit inside `translateY` is what ties the fall
 * distance to the lyric's own font size.
 */
export const RIPPLE_AIRBORNE_LIFT_EM = 0.9;

export const buildRippleAirbornePose = (dropHeight: number) => (
    `translateY(${(-RIPPLE_AIRBORNE_LIFT_EM * dropHeight).toFixed(3)}em) scale(1.05) rotate(-1.4deg)`
);

export const RIPPLE_AIRBORNE_POSE = buildRippleAirbornePose(1);
export const RIPPLE_AIRBORNE_BLUR_PX = 5;
export const RIPPLE_AIRBORNE_OPACITY = 0.16;

/**
 * Word opacity per reveal state. A pending word is a dim ghost up in the air; its reflection does not
 * exist yet, so `mirrorWaiting` is 0 — a reflection of a word that has not landed reads as a bug.
 */
export const RIPPLE_WORD_OPACITY = {
    mirrorWaiting: 0,
    mirrorRevealed: 0.34,
    waiting: RIPPLE_AIRBORNE_OPACITY,
    passed: 0.78,
    active: 1,
} as const;

/**
 * A word that has already sunk sits marginally below the words still being sung, as if it had gone
 * through the surface. Small enough to read as depth rather than as a misaligned baseline.
 */
export const RIPPLE_WORD_SETTLED_OFFSET_EM = 0.022;

/**
 * Ripple train emitted at the waterline when a word lands. `widthEm` is a ring's *final* diameter in
 * `em` of the lyric font size, so every ring shares one keyframe that scales up to 1 and the train's
 * shape comes from the sizes written here. Later rings are bigger, slower and fainter — the way a
 * real pebble's wave train decays.
 *
 * The rings are flat ellipses because this is a water *surface* seen at an angle; round rings read as
 * hoops floating in the air instead of waves travelling across a plane.
 *
 * `glowPx` is the halo/inset spread that keeps a ring from reading as a drawn wire: a wave front has
 * a lit crest and a soft body on either side of it.
 */
export const RIPPLE_IMPACT_ASPECT = 0.2;

const withImpactHeight = <T,>(ring: T & { widthEm: number }) => ({
    ...ring,
    heightEm: Number((ring.widthEm * RIPPLE_IMPACT_ASPECT).toFixed(3)),
});

export const RIPPLE_IMPACT_RINGS = [
    { widthEm: 1.95, durationSec: 1.35, delaySec: 0, borderPx: 1.7, colorAlpha: 0.72, glowPx: 9 },
    { widthEm: 2.9, durationSec: 1.85, delaySec: 0.14, borderPx: 1.4, colorAlpha: 0.52, glowPx: 12 },
    { widthEm: 3.95, durationSec: 2.45, delaySec: 0.3, borderPx: 1.2, colorAlpha: 0.36, glowPx: 15 },
    { widthEm: 5.15, durationSec: 3.2, delaySec: 0.5, borderPx: 1, colorAlpha: 0.22, glowPx: 18 },
    { widthEm: 6.6, durationSec: 4.1, delaySec: 0.74, borderPx: 0.9, colorAlpha: 0.13, glowPx: 22 },
].map(withImpactHeight);

/** The short bright bloom where the word breaks the surface — the crown of the splash. */
export const RIPPLE_IMPACT_FLASH = {
    widthEm: 1.4,
    heightEm: Number((1.4 * 0.34).toFixed(3)),
    durationSec: 0.62,
    colorAlpha: 0.5,
} as const;

/**
 * The crater itself. What sells the *weight* of a word on water is not another ring but the dent it
 * leaves: a darkened core where the surface is pushed down, ringed by the lit lip of the displaced
 * water. It opens faster than the wave train and springs back flatter, the way a real crater does.
 */
export const RIPPLE_IMPACT_WELL = {
    widthEm: 3.5,
    heightEm: Number((3.5 * 0.14).toFixed(3)),
    durationSec: 1.5,
    coreAlpha: 0.44,
    lipAlpha: 0.32,
} as const;

/**
 * Droplets thrown clear of the surface. Each one is a ballistic hop: it leaves the crater, decelerates
 * to an apex, then accelerates back down through the waterline.
 *
 * `angleDeg` is the launch direction in the surface plane (0 = straight up), so the set fans out like
 * a real crown splash. `scale` is applied as the droplet's own font size, which both sizes it and
 * scales how far it travels — a bigger drop is thrown further, and `em` inside the shared keyframe
 * means one keyframe serves the whole fan without per-droplet animation code.
 */
export const RIPPLE_SPLASH_PERSPECTIVE = 0.5;

export const RIPPLE_SPLASH_DROPLETS = [
    { angleDeg: 0, scale: 0.74, sizeRatio: 0.078, durationSec: 0.78, delaySec: 0, alpha: 0.82 },
    { angleDeg: -74, scale: 1.28, sizeRatio: 0.102, durationSec: 1.16, delaySec: 0.01, alpha: 0.95 },
    { angleDeg: -44, scale: 1.1, sizeRatio: 0.094, durationSec: 1.02, delaySec: 0.04, alpha: 0.9 },
    { angleDeg: -17, scale: 0.94, sizeRatio: 0.085, durationSec: 0.9, delaySec: 0.02, alpha: 0.85 },
    { angleDeg: 10, scale: 1.2, sizeRatio: 0.098, durationSec: 1.1, delaySec: 0.05, alpha: 0.92 },
    { angleDeg: 40, scale: 1.04, sizeRatio: 0.09, durationSec: 0.98, delaySec: 0.025, alpha: 0.87 },
    { angleDeg: 72, scale: 1.24, sizeRatio: 0.096, durationSec: 1.14, delaySec: 0.045, alpha: 0.9 },
] as const;

/**
 * The glow that blooms behind a word as it lands. It is what makes a landing feel *caught* by the
 * light rather than merely recoloured.
 *
 * It is drawn as a `::before` on the word span and attached through a state-scoped rule rather than
 * an inline animation: inline animations do not restart when React reuses the same DOM node for the
 * next line's word, and the rule also gives the pseudo-element the `z-index: -1` that puts it behind
 * the glyphs. The curve is deliberately front-loaded — by `42%` of the drop the glow is already at
 * `0.05`, so the moment the state flips to `passed` and the animation is dropped, there is nothing
 * bright left to cut.
 */
export const RIPPLE_IMPACT_BLOOM = {
    widthEm: 3.1,
    heightEm: 1.9,
    alpha: 0.52,
    restingScale: 0.22,
} as const;

/**
 * Ambient rings that keep the waterline alive between word drops. Negative delays start each ring
 * mid-flight so the surface is already moving on the very first frame instead of popping in. They are
 * deliberately faint: the impact train is the event, this is only the water's resting breath.
 */
export const RIPPLE_AMBIENT_RINGS = [
    { widthRem: 26, heightRem: 5.4, durationSec: 6.4, delaySec: -0.8, opacity: 0.3 },
    { widthRem: 34, heightRem: 7, durationSec: 8.2, delaySec: -2.6, opacity: 0.24 },
    { widthRem: 20, heightRem: 4.2, durationSec: 5.2, delaySec: -4.1, opacity: 0.22 },
    { widthRem: 44, heightRem: 9, durationSec: 10.5, delaySec: -6.3, opacity: 0.16 },
] as const;

export const RIPPLE_AMBIENT_BASE_OPACITY = 0.16;
export const RIPPLE_AMBIENT_ENERGY_OPACITY = 0.6;

/**
 * Slow pools of light drifting across the surface — the caustics a real body of water throws when
 * light moves over it. They travel at different speeds so the pattern never visibly repeats, and they
 * are pure gradient blobs: no filter, no canvas, nothing that costs a rasterisation per frame.
 */
export const RIPPLE_CAUSTIC_POOLS = [
    { widthRem: 20, heightRem: 3.4, durationSec: 12.5, delaySec: -1.4, opacity: 0.34 },
    { widthRem: 12, heightRem: 2.2, durationSec: 8.6, delaySec: -4.2, opacity: 0.28 },
    { widthRem: 26, heightRem: 4.2, durationSec: 16.4, delaySec: -8.1, opacity: 0.22 },
] as const;

export const RIPPLE_CAUSTIC_BASE_OPACITY = 0.3;
export const RIPPLE_CAUSTIC_ENERGY_OPACITY = 0.7;

/**
 * The broad wash of light lying on the surface plane. Without it the waterline is a hairline drawn on
 * nothing; with it the surface reads as a lit sheet the words fall through.
 */
export const RIPPLE_SURFACE_PLANE = {
    widthRem: 60,
    heightRem: 4.4,
    colorAlpha: 0.16,
    baseOpacity: 0.55,
    energyOpacity: 0.6,
} as const;

/**
 * How the mirrored lyric is presented before the water filter touches it: squashed like a real
 * reflection, held at a readable strength, softly blurred, and faded out with distance from the
 * surface. The mask is written pre-flip so it still reads correctly after `scaleY(-squash)`.
 */
export const RIPPLE_REFLECTION_SQUASH = 0.84;
export const RIPPLE_REFLECTION_OPACITY = 0.95;
export const RIPPLE_REFLECTION_BLUR_PX = 1;
export const RIPPLE_REFLECTION_MASK = 'linear-gradient(to top, rgba(0,0,0,0.66), transparent 76%)';

/**
 * Sway applied to the whole reflection, on a separate layer from the SVG filter so the compositor
 * can move it without re-running the filter chain for the transform itself.
 */
export const RIPPLE_REFLECTION_SWAY_DURATION_SEC = 9.5;

/** Length of the landing animation. The dip happens at the `10%` keyframe, i.e. ~0.12s in. */
export const RIPPLE_DROP_DURATION_SEC = 1.15;

/** How long the still waterline takes to rise and fall once. Scaled by the tuning's animation speed. */
export const RIPPLE_WATERLINE_WOBBLE_DURATION_SEC = 6.8;

/** One pass of the surface sheen. Declared here so the animation-speed multiplier covers it too. */
export const RIPPLE_SHEEN_DURATION_SEC = 6.5;

/**
 * Water refraction for the reflection: fractal noise plus a displacement map. `baseFrequency` is
 * anisotropic (long horizontal waves, shorter vertical ones), and `morphValues` walks it around a
 * loop so the noise field — and therefore the bend — keeps changing instead of freezing into a fixed
 * warp. Values are pairs of `<x> <y>` frequencies.
 */
export const RIPPLE_WATER_DISTORTION = {
    baseFrequency: '0.0062 0.058',
    morphValues: '0.0062 0.058;0.0118 0.074;0.0084 0.066;0.0062 0.058',
    morphDurationSec: 17,
    numOctaves: 1,
    seed: 9,
    /** Peak displacement is half of this, in pixels, in each direction. */
    scale: 8,
    /**
     * Filter region, relative to the reflected text box. Sized for the displacement travel only —
     * every extra percent here is pixels re-filtered on every animation frame.
     */
    region: { x: '-5%', y: '-16%', width: '110%', height: '132%' },
} as const;

/**
 * Keyframes are injected through a <style> tag, matching how the other CSS-driven visualizers (for
 * example Cappella) ship their animations without touching global stylesheets.
 *
 * Everything here is **scoped to `.visualizer-ripple`**: an injected <style> is global to the
 * document, so an unscoped `[data-ripple-state="active"]` rule would leak into every other mode.
 *
 * `--ripple-energy` (written by the component from the playback audio power) is only read outside of
 * keyframes: a custom property referenced *inside* a keyframe is not re-evaluated live in every
 * engine, so modulating the whole ambient layer's opacity is both cheaper and more reliable.
 *
 * Two shapes worth noting. The impact animations are attached through state-scoped rules rather than
 * inline `animation` declarations, because the word spans are keyed by index and therefore reused
 * across lines — an inline animation would never restart on the second line. And the arc of a droplet
 * is written as a single keyframe with a *per-segment* timing function: `ease-out` on the way up and
 * `ease-in` on the way down is what makes it read as gravity instead of as a ping-pong.
 *
 * The two values the tuning can change — the drop length and the airborne pose a word falls from —
 * are *template inputs* rather than free-floating CSS variables, because a custom property read from
 * inside a keyframe is not live-updated in every engine. `RIPPLE_KEYFRAMES` is the default build, so
 * anything comparing against the shipped stylesheet still sees exactly those bytes.
 */
export interface RippleKeyframeOptions {
    /** Length of the landing animation, already divided by the animation-speed multiplier. */
    dropDurationSec: number;
    /** The airborne pose the drop starts from, already scaled by the drop-height multiplier. */
    airbornePose: string;
}

export const buildRippleKeyframes = ({ dropDurationSec, airbornePose }: RippleKeyframeOptions) => `
.visualizer-ripple [data-ripple-state="active"] {
    animation: ripple-word-drop ${dropDurationSec}s ease-out both;
}

.visualizer-ripple [data-ripple-state]:not([data-ripple-state="reflection"])::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: ${RIPPLE_IMPACT_BLOOM.widthEm}em;
    height: ${RIPPLE_IMPACT_BLOOM.heightEm}em;
    margin: ${-RIPPLE_IMPACT_BLOOM.heightEm / 2}em 0 0 ${-RIPPLE_IMPACT_BLOOM.widthEm / 2}em;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0;
    transform: scale(${RIPPLE_IMPACT_BLOOM.restingScale});
    background: radial-gradient(ellipse 50% 50% at 50% 50%, var(--ripple-bloom-core, transparent), transparent 72%);
    z-index: -1;
}

.visualizer-ripple [data-ripple-state="active"]::before {
    animation: ripple-word-bloom ${RIPPLE_DROP_DURATION_SEC}s ease-out both;
}

/* Gravity on the way down, damping on the way back up: the word overshoots under the waterline and
   rings down through ever smaller bounces, like something with mass settling on water. */
@keyframes ripple-word-drop {
    0% {
        transform: ${airbornePose};
        opacity: ${RIPPLE_AIRBORNE_OPACITY};
        filter: blur(${RIPPLE_AIRBORNE_BLUR_PX}px);
        animation-timing-function: cubic-bezier(0.55, 0, 0.9, 0.5);
    }
    10% {
        transform: translateY(0.135em) scale(0.962) rotate(0.95deg);
        opacity: 1;
        filter: blur(0px);
        animation-timing-function: cubic-bezier(0.2, 0.8, 0.35, 1);
    }
    24% { transform: translateY(-0.085em) scale(1.021) rotate(-0.55deg); opacity: 1; filter: blur(0px); }
    38% { transform: translateY(0.052em) scale(0.989) rotate(0.32deg); opacity: 1; }
    54% { transform: translateY(-0.03em) scale(1.007) rotate(-0.17deg); opacity: 1; }
    70% { transform: translateY(0.016em) scale(0.997) rotate(0.08deg); opacity: 1; }
    85% { transform: translateY(-0.007em) scale(1.002) rotate(-0.03deg); opacity: 1; }
    100% { transform: translateY(0em) scale(1) rotate(0deg); opacity: 1; filter: blur(0px); }
}

/* Light gathering around the word as it breaks the surface, then letting go almost at once — the
   flash of a splash is brief. The tail is kept nearly invisible on purpose: this animation is dropped
   the instant the word stops being the active one, and a bright tail would be cut off there. */
@keyframes ripple-word-bloom {
    0% { transform: scale(${RIPPLE_IMPACT_BLOOM.restingScale}); opacity: 0; }
    9% { transform: scale(1.02); opacity: 0.95; }
    26% { transform: scale(1.2); opacity: 0.36; }
    42% { transform: scale(1.34); opacity: 0.05; }
    100% { transform: scale(1.5); opacity: 0; }
}

/* One keyframe drives the whole ripple train: a ring's final size is its own width/height and its
   strength is the alpha of its border colour, so nothing has to be threaded through a custom
   property that a keyframe could not re-read anyway. */
@keyframes ripple-impact-ring {
    0% { transform: scale(0.055); opacity: 0; }
    9% { opacity: 1; }
    62% { opacity: 0.6; }
    100% { transform: scale(1); opacity: 0; }
}

@keyframes ripple-impact-crown {
    0% { transform: scale(0.34); opacity: 0.95; }
    100% { transform: scale(2.3); opacity: 0; }
}

/* The crater: it opens, springs back shallow, and settles. Scale is deliberately non-uniform — the
   surface is being pushed *down*, so the dent deepens before it widens. */
@keyframes ripple-impact-well {
    0% { transform: scale(0.34) scaleY(0.42); opacity: 0; }
    9% { transform: scale(1.02) scaleY(1); opacity: 1; }
    34% { transform: scale(1.17) scaleY(0.68); opacity: 0.7; }
    64% { transform: scale(1.07) scaleY(0.92); opacity: 0.38; }
    100% { transform: scale(1) scaleY(1); opacity: 0; }
}

/* A droplet's ballistic hop. The rise decelerates and the fall accelerates, so the apex is a real
   turning point rather than the midpoint of a linear sweep. */
@keyframes ripple-droplet-arc {
    0% {
        transform: translateY(0em) scale(0.45);
        opacity: 0;
        animation-timing-function: cubic-bezier(0.14, 0.72, 0.42, 1);
    }
    13% { opacity: 1; }
    52% {
        transform: translateY(-0.62em) scale(1);
        opacity: 0.96;
        animation-timing-function: cubic-bezier(0.62, 0.02, 0.9, 0.46);
    }
    100% { transform: translateY(0.11em) scale(0.68); opacity: 0; }
}

@keyframes ripple-ambient-expand {
    0% { transform: translate(-50%, -50%) scale(0.34); opacity: 0; }
    14% { opacity: 0.5; }
    100% { transform: translate(-50%, -50%) scale(2.7); opacity: 0; }
}

/* Caustics: pools of light sliding across the plane. Same drift distance for every pool, but each
   runs on its own duration and negative delay, so the pattern never lines up with itself. */
@keyframes ripple-caustic-drift {
    0% { transform: translate(-50%, -50%) translateX(-7.5rem) scale(0.82); opacity: 0; }
    28% { opacity: 0.62; }
    68% { opacity: 0.48; }
    100% { transform: translate(-50%, -50%) translateX(7.5rem) scale(1.12); opacity: 0; }
}

@keyframes ripple-sheen-drift {
    0% { transform: translateX(-120%); opacity: 0; }
    30% { opacity: 0.85; }
    70% { opacity: 0.85; }
    100% { transform: translateX(360%); opacity: 0; }
}

/* The reflection rocks on the swell. Skew is what makes the mirrored glyphs lean the way they do
   when the water underneath them is not flat. */
@keyframes ripple-reflection-sway {
    0% { transform: translate3d(-1.1px, 0, 0) scaleX(1.014) skewX(0.55deg); }
    25% { transform: translate3d(0.6px, 0, 0) scaleX(0.993) skewX(-0.4deg); }
    50% { transform: translate3d(1.3px, 0, 0) scaleX(1.008) skewX(0.7deg); }
    75% { transform: translate3d(-0.4px, 0, 0) scaleX(0.995) skewX(-0.5deg); }
    100% { transform: translate3d(-1.1px, 0, 0) scaleX(1.014) skewX(0.55deg); }
}

/* The waterline itself rises and falls with the swell, widening slightly as it comes up. */
@keyframes ripple-waterline-wobble {
    0%, 100% { transform: translateY(-0.5px) scaleX(0.996); }
    50% { transform: translateY(0.5px) scaleX(1.006); }
}
`;

/** The shipped stylesheet: default drop length and the designed airborne lift. */
export const RIPPLE_KEYFRAMES = buildRippleKeyframes({
    dropDurationSec: RIPPLE_DROP_DURATION_SEC,
    airbornePose: RIPPLE_AIRBORNE_POSE,
});
