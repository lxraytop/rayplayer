import { useEffect, useLayoutEffect, type RefObject } from 'react';

// src/components/visualizer/ripple/useRippleImpactAnchor.ts
// Keeps `--ripple-impact-x` pointing at the word that just landed, so its ripple train can be drawn
// in the water layer (at the waterline, in the right place) instead of inside the glyph box.
//
// Why measure instead of nesting the ripple in the word span: a ripple belongs on the water surface,
// which is a different box from the lyric row — and for a wrapped line the row's bottom is nowhere
// near the waterline. Writing one CSS variable on the surface wrapper is also a DOM-only update, so
// the per-frame playback clock still never re-renders React; this hook only runs when a word lands or
// the layout actually changes.

/**
 * `useLayoutEffect` runs before paint in the browser (so a ripple never gets painted at the stale
 * offset for one frame) but warns when a component is rendered on the server, which the unit tests do
 * through `renderToStaticMarkup`. The guard picks the right one for each environment.
 */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const RIPPLE_IMPACT_ANCHOR_ATTRIBUTE = 'data-ripple-word-index';

export const useRippleImpactAnchor = (
    hostRef: RefObject<HTMLDivElement | null>,
    surfaceRef: RefObject<HTMLDivElement | null>,
    activeWordIndex: number,
    layoutKey: string,
) => {
    useIsomorphicLayoutEffect(() => {
        const host = hostRef.current;
        const surface = surfaceRef.current;
        if (!host || !surface) {
            return;
        }

        const sync = () => {
            const target = activeWordIndex >= 0
                ? host.querySelector<HTMLElement>(`[${RIPPLE_IMPACT_ANCHOR_ATTRIBUTE}="${activeWordIndex}"]`)
                : null;
            if (!target) {
                return;
            }

            const surfaceRect = surface.getBoundingClientRect();
            const wordRect = target.getBoundingClientRect();
            if (surfaceRect.width <= 0 || wordRect.width <= 0) {
                return;
            }

            // Both boxes are centred in the same column, so the word's offset from the surface's own
            // centre is all the anchor needs — no absolute page coordinates involved.
            const offset = wordRect.left + wordRect.width / 2 - (surfaceRect.left + surfaceRect.width / 2);
            surface.style.setProperty('--ripple-impact-x', `${offset.toFixed(2)}px`);
        };

        sync();

        if (typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver(sync);
        observer.observe(host);
        observer.observe(surface);
        return () => observer.disconnect();
    }, [hostRef, surfaceRef, activeWordIndex, layoutKey]);
};
