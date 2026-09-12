import React, { useMemo } from 'react';
import {
    DEFAULT_RIPPLE_TUNING,
    RIPPLE_TUNING_LIMITS,
    type RippleTuning,
} from '../../../types';
import { colorWithAlpha } from '../colorMix';
import type { VisualizerSettingsPanelProps } from '../definition';
import VisualizerPresetGroup, { type VisualizerPresetOption } from '../VisualizerPresetGroup';
import { VisualizerRangeControl, VisualizerSettingsSection } from '../VisualizerRangeControl';

// src/components/visualizer/ripple/RippleSettingsPanel.tsx
// Ripple's user-facing style controls. Every numeric field is a *multiplier* over the geometry in
// `rippleVisuals.ts`, so 1.00x reproduces the shipped look and the reset button lands exactly on the
// designed default. Ranges come from `RIPPLE_TUNING_LIMITS` — the same table the store clamps with,
// so a slider can never ask for a value the store would silently reject.
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const RippleSettingsPanel: React.FC<VisualizerSettingsPanelProps> = ({
    t,
    isDaylight,
    theme,
    rangeInputClass,
    controlCardBg,
    rippleTuning = DEFAULT_RIPPLE_TUNING,
    onRippleTuningChange,
    onSliderPointerDown,
    onSliderCommit,
}) => {
    const resolved: RippleTuning = useMemo(() => ({
        fontScale: clamp(rippleTuning.fontScale ?? DEFAULT_RIPPLE_TUNING.fontScale, RIPPLE_TUNING_LIMITS.fontScale.min, RIPPLE_TUNING_LIMITS.fontScale.max),
        animationSpeed: clamp(rippleTuning.animationSpeed ?? DEFAULT_RIPPLE_TUNING.animationSpeed, RIPPLE_TUNING_LIMITS.animationSpeed.min, RIPPLE_TUNING_LIMITS.animationSpeed.max),
        rippleStrength: clamp(rippleTuning.rippleStrength ?? DEFAULT_RIPPLE_TUNING.rippleStrength, RIPPLE_TUNING_LIMITS.rippleStrength.min, RIPPLE_TUNING_LIMITS.rippleStrength.max),
        splashStrength: clamp(rippleTuning.splashStrength ?? DEFAULT_RIPPLE_TUNING.splashStrength, RIPPLE_TUNING_LIMITS.splashStrength.min, RIPPLE_TUNING_LIMITS.splashStrength.max),
        ambientStrength: clamp(rippleTuning.ambientStrength ?? DEFAULT_RIPPLE_TUNING.ambientStrength, RIPPLE_TUNING_LIMITS.ambientStrength.min, RIPPLE_TUNING_LIMITS.ambientStrength.max),
        waterDistortion: clamp(rippleTuning.waterDistortion ?? DEFAULT_RIPPLE_TUNING.waterDistortion, RIPPLE_TUNING_LIMITS.waterDistortion.min, RIPPLE_TUNING_LIMITS.waterDistortion.max),
        reflectionStrength: clamp(rippleTuning.reflectionStrength ?? DEFAULT_RIPPLE_TUNING.reflectionStrength, RIPPLE_TUNING_LIMITS.reflectionStrength.min, RIPPLE_TUNING_LIMITS.reflectionStrength.max),
        audioReactivity: clamp(rippleTuning.audioReactivity ?? DEFAULT_RIPPLE_TUNING.audioReactivity, RIPPLE_TUNING_LIMITS.audioReactivity.min, RIPPLE_TUNING_LIMITS.audioReactivity.max),
        dropHeight: clamp(rippleTuning.dropHeight ?? DEFAULT_RIPPLE_TUNING.dropHeight, RIPPLE_TUNING_LIMITS.dropHeight.min, RIPPLE_TUNING_LIMITS.dropHeight.max),
        showWaterSurface: rippleTuning.showWaterSurface ?? DEFAULT_RIPPLE_TUNING.showWaterSurface,
        showReflection: rippleTuning.showReflection ?? DEFAULT_RIPPLE_TUNING.showReflection,
        showImpact: rippleTuning.showImpact ?? DEFAULT_RIPPLE_TUNING.showImpact,
        showSplash: rippleTuning.showSplash ?? DEFAULT_RIPPLE_TUNING.showSplash,
        showAmbient: rippleTuning.showAmbient ?? DEFAULT_RIPPLE_TUNING.showAmbient,
    }), [rippleTuning]);

    const handleChange = (patch: Partial<RippleTuning>) => {
        onRippleTuningChange?.(patch);
    };

    const onOffOptions: VisualizerPresetOption<boolean>[] = useMemo(() => ([
        { value: true, label: t('options.rippleToggleOn') },
        { value: false, label: t('options.rippleToggleOff') },
    ]), [t]);

    // The multiplier read-out is the same `1.00x` form every other tuning panel uses; the shared
    // control's default formatter already produces it, so no field overrides it.
    const rangeProps = {
        rangeInputClass,
        onPointerDown: onSliderPointerDown,
        onPointerUp: onSliderCommit,
    };

    return (
        <div
            className="rounded-[24px] border border-white/10 p-4 space-y-4"
            style={{ backgroundColor: controlCardBg }}
        >
            <div className="space-y-1">
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {t('options.rippleSettings')}
                </div>
                <div className="text-xs opacity-50" style={{ color: 'var(--text-secondary)' }}>
                    {t('options.rippleSettingsDesc')}
                </div>
            </div>

            <VisualizerSettingsSection title={t('options.rippleSectionTypography')}>
                <VisualizerRangeControl
                    {...rangeProps}
                    label={t('options.rippleFontScale')}
                    value={resolved.fontScale}
                    min={RIPPLE_TUNING_LIMITS.fontScale.min}
                    max={RIPPLE_TUNING_LIMITS.fontScale.max}
                    onChange={value => handleChange({ fontScale: value })}
                />
            </VisualizerSettingsSection>

            <VisualizerSettingsSection title={t('options.rippleSectionMotion')}>
                <VisualizerRangeControl
                    {...rangeProps}
                    label={t('options.rippleAnimationSpeed')}
                    value={resolved.animationSpeed}
                    min={RIPPLE_TUNING_LIMITS.animationSpeed.min}
                    max={RIPPLE_TUNING_LIMITS.animationSpeed.max}
                    onChange={value => handleChange({ animationSpeed: value })}
                />
                <VisualizerRangeControl
                    {...rangeProps}
                    label={t('options.rippleDropHeight')}
                    value={resolved.dropHeight}
                    min={RIPPLE_TUNING_LIMITS.dropHeight.min}
                    max={RIPPLE_TUNING_LIMITS.dropHeight.max}
                    onChange={value => handleChange({ dropHeight: value })}
                />
            </VisualizerSettingsSection>

            <VisualizerSettingsSection title={t('options.rippleSectionWater')}>
                <VisualizerRangeControl
                    {...rangeProps}
                    label={t('options.rippleRippleStrength')}
                    value={resolved.rippleStrength}
                    min={RIPPLE_TUNING_LIMITS.rippleStrength.min}
                    max={RIPPLE_TUNING_LIMITS.rippleStrength.max}
                    onChange={value => handleChange({ rippleStrength: value })}
                />
                <VisualizerRangeControl
                    {...rangeProps}
                    label={t('options.rippleSplashStrength')}
                    value={resolved.splashStrength}
                    min={RIPPLE_TUNING_LIMITS.splashStrength.min}
                    max={RIPPLE_TUNING_LIMITS.splashStrength.max}
                    onChange={value => handleChange({ splashStrength: value })}
                />
                <VisualizerRangeControl
                    {...rangeProps}
                    label={t('options.rippleAmbientStrength')}
                    value={resolved.ambientStrength}
                    min={RIPPLE_TUNING_LIMITS.ambientStrength.min}
                    max={RIPPLE_TUNING_LIMITS.ambientStrength.max}
                    onChange={value => handleChange({ ambientStrength: value })}
                />
                <VisualizerRangeControl
                    {...rangeProps}
                    label={t('options.rippleWaterDistortion')}
                    value={resolved.waterDistortion}
                    min={RIPPLE_TUNING_LIMITS.waterDistortion.min}
                    max={RIPPLE_TUNING_LIMITS.waterDistortion.max}
                    onChange={value => handleChange({ waterDistortion: value })}
                />
                <VisualizerRangeControl
                    {...rangeProps}
                    label={t('options.rippleReflectionStrength')}
                    value={resolved.reflectionStrength}
                    min={RIPPLE_TUNING_LIMITS.reflectionStrength.min}
                    max={RIPPLE_TUNING_LIMITS.reflectionStrength.max}
                    onChange={value => handleChange({ reflectionStrength: value })}
                />
                <VisualizerRangeControl
                    {...rangeProps}
                    label={t('options.rippleAudioReactivity')}
                    value={resolved.audioReactivity}
                    min={RIPPLE_TUNING_LIMITS.audioReactivity.min}
                    max={RIPPLE_TUNING_LIMITS.audioReactivity.max}
                    onChange={value => handleChange({ audioReactivity: value })}
                />
            </VisualizerSettingsSection>

            <VisualizerSettingsSection title={t('options.rippleSectionLayers')}>
                <div
                    className="space-y-4 rounded-2xl border px-3.5 py-3.5"
                    style={{
                        borderColor: colorWithAlpha(theme.secondaryColor, isDaylight ? 0.17 : 0.14),
                        backgroundColor: colorWithAlpha(theme.backgroundColor, isDaylight ? 0.24 : 0.34),
                    }}
                >
                    <VisualizerPresetGroup
                        label={t('options.rippleShowWaterSurface')}
                        value={resolved.showWaterSurface}
                        options={onOffOptions}
                        onChange={next => handleChange({ showWaterSurface: next })}
                        isDaylight={isDaylight}
                        theme={theme}
                    />
                    <VisualizerPresetGroup
                        label={t('options.rippleShowReflection')}
                        value={resolved.showReflection}
                        options={onOffOptions}
                        onChange={next => handleChange({ showReflection: next })}
                        isDaylight={isDaylight}
                        theme={theme}
                    />
                    <VisualizerPresetGroup
                        label={t('options.rippleShowImpact')}
                        value={resolved.showImpact}
                        options={onOffOptions}
                        onChange={next => handleChange({ showImpact: next })}
                        isDaylight={isDaylight}
                        theme={theme}
                    />
                    <VisualizerPresetGroup
                        label={t('options.rippleShowSplash')}
                        value={resolved.showSplash}
                        options={onOffOptions}
                        onChange={next => handleChange({ showSplash: next })}
                        isDaylight={isDaylight}
                        theme={theme}
                    />
                    <VisualizerPresetGroup
                        label={t('options.rippleShowAmbient')}
                        value={resolved.showAmbient}
                        options={onOffOptions}
                        onChange={next => handleChange({ showAmbient: next })}
                        isDaylight={isDaylight}
                        theme={theme}
                    />
                </div>
            </VisualizerSettingsSection>
        </div>
    );
};

export default RippleSettingsPanel;
