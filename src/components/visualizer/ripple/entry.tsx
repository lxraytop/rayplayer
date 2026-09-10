import React from 'react';
import { defineVisualizer } from '../definition';
import VisualizerRipple from './VisualizerRipple';

// src/components/visualizer/ripple/entry.tsx
// Registers the Ripple visualizer mode.
export default defineVisualizer({
    mode: 'ripple',
    order: 95,
    labelKey: 'ui.visualizerRipple',
    labelFallback: 'Ripple',
    previewSeed: 'ripple',
    previewStartOffset: 0,
    tuningKind: 'none',
    render: props => <VisualizerRipple {...props} />,
});
