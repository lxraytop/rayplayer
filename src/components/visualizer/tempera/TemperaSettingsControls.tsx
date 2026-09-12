import React from 'react';
import {
    VisualizerRangeControl,
    VisualizerSettingsSection,
    type VisualizerRangeControlProps,
} from '../VisualizerRangeControl';

// src/components/visualizer/tempera/TemperaSettingsControls.tsx
// Tempera's compact section and slider primitives. The implementations now live in the shared
// `VisualizerRangeControl` module (Ripple needs the same primitives); these aliases keep Tempera's
// own imports and props stable while the default `1.00x` read-out stays exactly as it was.
export { VisualizerSettingsSection as TemperaSettingsSection };

export type TemperaRangeControlProps = VisualizerRangeControlProps;

export const TemperaRangeControl: React.FC<TemperaRangeControlProps> = props => (
    <VisualizerRangeControl {...props} />
);
