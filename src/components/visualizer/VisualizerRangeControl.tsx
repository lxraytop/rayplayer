import React from 'react';

// src/components/visualizer/VisualizerRangeControl.tsx
// Section + slider primitives shared by visualizer tuning panels. Extracted from Tempera's
// mode-local controls so a second mode (Ripple) does not ship a near-identical copy; Tempera
// re-exports these to keep its own call sites unchanged.

export interface VisualizerSettingsSectionProps {
    title: string;
    children: React.ReactNode;
}

export const VisualizerSettingsSection: React.FC<VisualizerSettingsSectionProps> = ({ title, children }) => (
    <section className="space-y-4 border-t border-white/10 pt-4">
        <h3
            className="text-xs font-medium uppercase tracking-[0.24em] opacity-45"
            style={{ color: 'var(--text-secondary)' }}
        >
            {title}
        </h3>
        {children}
    </section>
);

export interface VisualizerRangeControlProps {
    label: string;
    value: number;
    rangeInputClass: string;
    onChange: (value: number) => void;
    onPointerDown?: () => void;
    onPointerUp?: () => void;
    /** Pointer capture can be lost mid-drag; without this the host never commits the value. */
    onPointerCancel?: () => void;
    min?: number;
    max?: number;
    step?: number;
    /** Renders the read-out on the right of the label. Defaults to the `1.00x` multiplier form. */
    formatValue?: (value: number) => string;
}

const defaultFormatValue = (value: number) => `${value.toFixed(2)}x`;

export const VisualizerRangeControl: React.FC<VisualizerRangeControlProps> = ({
    label,
    value,
    rangeInputClass,
    onChange,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    min = 0,
    max = 2,
    step = 0.05,
    formatValue = defaultFormatValue,
}) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
            <span>{label}</span>
            <span className="shrink-0 font-mono opacity-70" style={{ color: 'var(--text-secondary)' }}>
                {formatValue(value)}
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={event => onChange(Number(event.target.value))}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel ?? onPointerUp}
            className={rangeInputClass}
        />
    </div>
);
