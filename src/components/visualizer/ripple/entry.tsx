import React from 'react';
import { DEFAULT_RIPPLE_TUNING } from '../../../types';
import { defineVisualizer } from '../definition';
import RippleSettingsPanel from './RippleSettingsPanel';
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
    tuningKind: 'ripple',
    render: props => <VisualizerRipple {...props} />,
    renderSettingsPanel: props => <RippleSettingsPanel {...props} />,
    resetSettings: ({ resetRippleTuning, setDraftRippleTuning }) => {
        setDraftRippleTuning?.(DEFAULT_RIPPLE_TUNING);
        resetRippleTuning?.();
    },
});
