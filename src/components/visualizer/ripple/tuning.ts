import { defineVisualizerTuning } from '../tuningRegistry';

// src/components/visualizer/ripple/tuning.ts
// Injects Ripple's strongly typed tuning at the renderer boundary.
export default defineVisualizerTuning({
    mode: 'ripple',
    settingsKey: 'rippleTuning',
    settingsSetterKey: 'handleSetRippleTuning',
    apply: (props, tuning) => ({ ...props, rippleTuning: tuning }),
});
