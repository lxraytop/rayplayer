import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import RippleSettingsPanel from '@/components/visualizer/ripple/RippleSettingsPanel';
import { DEFAULT_THEME } from '@/services/baseThemes';
import { DEFAULT_RIPPLE_TUNING, RIPPLE_TUNING_LIMITS, type RippleTuning } from '@/types';

// test/unit/visualizer/rippleSettingsPanel.test.ts
// Guards the user-facing Ripple style panel: every control is present, the labels are real i18n keys
// (a typo would render the raw key and no longer match here), and the slider read-outs are clamped by
// the same range table the store clamps with.

/** Stand-in for `t`: echoing the key makes a wrong/typo'd key visible in the assertion. */
const t = (key: string) => key;

const renderPanel = (overrides: Partial<RippleTuning> = {}) => renderToStaticMarkup(
    React.createElement(RippleSettingsPanel, {
        t,
        isDaylight: false,
        theme: DEFAULT_THEME,
        controlCardBg: 'rgb(0, 0, 0)',
        rangeInputClass: 'range-input',
        rippleTuning: { ...DEFAULT_RIPPLE_TUNING, ...overrides },
    }),
);

describe('RippleSettingsPanel', () => {
    it('renders the panel header and every section', () => {
        const markup = renderPanel();

        expect(markup).toContain('options.rippleSettings');
        expect(markup).toContain('options.rippleSettingsDesc');
        expect(markup).toContain('options.rippleSectionTypography');
        expect(markup).toContain('options.rippleSectionMotion');
        expect(markup).toContain('options.rippleSectionWater');
        expect(markup).toContain('options.rippleSectionLayers');
    });

    it('renders every numeric control', () => {
        const markup = renderPanel();

        for (const key of [
            'rippleFontScale',
            'rippleAnimationSpeed',
            'rippleDropHeight',
            'rippleRippleStrength',
            'rippleSplashStrength',
            'rippleAmbientStrength',
            'rippleWaterDistortion',
            'rippleReflectionStrength',
            'rippleAudioReactivity',
        ]) {
            expect(markup).toContain(`options.${key}`);
        }

        // Nine sliders: one typography, two motion, six water.
        expect(markup.match(/type="range"/g)?.length ?? 0).toBe(9);
    });

    it('renders every layer toggle with its on/off pills', () => {
        const markup = renderPanel();

        for (const key of [
            'rippleShowWaterSurface',
            'rippleShowReflection',
            'rippleShowImpact',
            'rippleShowSplash',
            'rippleShowAmbient',
        ]) {
            expect(markup).toContain(`options.${key}`);
        }

        expect(markup.match(/options\.rippleToggleOn/g)?.length ?? 0).toBe(5);
        expect(markup.match(/options\.rippleToggleOff/g)?.length ?? 0).toBe(5);
    });

    it('shows the multiplier read-out for the designed default', () => {
        const markup = renderPanel();

        // Ten numbers on screen (nine sliders + nothing else), all at the designed 1.00x.
        expect(markup.match(/>1\.00x</g)?.length ?? 0).toBe(9);
    });

    it('clamps a stored value into the slider range the store enforces', () => {
        // A hand-edited localStorage entry or an imported config can carry anything; the panel must
        // never show a value its own slider cannot reach.
        const markup = renderPanel({
            fontScale: 99,
            animationSpeed: 0,
            waterDistortion: 42,
        });

        expect(markup).toContain(`>${RIPPLE_TUNING_LIMITS.fontScale.max.toFixed(2)}x<`);
        expect(markup).toContain(`>${RIPPLE_TUNING_LIMITS.animationSpeed.min.toFixed(2)}x<`);
        expect(markup).toContain(`>${RIPPLE_TUNING_LIMITS.waterDistortion.max.toFixed(2)}x<`);
        expect(markup).not.toContain('>99.00x<');
        expect(markup).not.toContain('>0.00x<');
    });

    it('falls back to the designed default when no tuning reaches the panel', () => {
        const markup = renderToStaticMarkup(React.createElement(RippleSettingsPanel, {
            t,
            isDaylight: false,
            theme: DEFAULT_THEME,
            controlCardBg: 'rgb(0, 0, 0)',
            rangeInputClass: 'range-input',
        }));

        expect(markup).toContain('options.rippleSettings');
        expect(markup.match(/>1\.00x</g)?.length ?? 0).toBe(9);
    });
});
