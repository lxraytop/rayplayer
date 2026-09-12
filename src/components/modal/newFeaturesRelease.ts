import { Droplets, LayoutList, Monitor, SlidersHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// src/components/modal/newFeaturesRelease.ts

type NewFeatureCard = {
    id: string;
    icon: LucideIcon;
    daylightIconClassName: string;
    darkIconClassName: string;
};

type NewFeaturesRelease = {
    i18nKey: string;
    features: NewFeatureCard[];
};

// Defines the current release's cards; their localized text lives under i18nKey in every locale.
export const NEW_FEATURES_RELEASE: NewFeaturesRelease = {
    i18nKey: 'releaseNotes.v1_6_0',
    features: [
        { id: 'windowsDesktopWallpaper', icon: Monitor, daylightIconClassName: 'text-sky-600', darkIconClassName: 'text-sky-400' },
        { id: 'rippleLyricVisualizer', icon: Droplets, daylightIconClassName: 'text-cyan-600', darkIconClassName: 'text-cyan-400' },
        { id: 'rippleStyleSettings', icon: SlidersHorizontal, daylightIconClassName: 'text-violet-600', darkIconClassName: 'text-violet-400' },
        { id: 'libraryViewSwitch', icon: LayoutList, daylightIconClassName: 'text-emerald-600', darkIconClassName: 'text-emerald-400' },
    ],
};
