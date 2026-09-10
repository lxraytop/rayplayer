import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LibraryViewMode } from '../../stores/useLibraryViewModeStore';

// src/components/library-list/ViewModeToggleButton.tsx
// Shared card / list switch used by the library surfaces. It renders the layout the user will get
// after clicking, and mirrors the pill styling of the home grid actions so both surfaces read as
// the same control.

export interface ViewModeToggleButtonProps {
    viewMode: LibraryViewMode;
    onToggle: () => void;
    isDaylight: boolean;
    className?: string;
}

export const ViewModeToggleButton: React.FC<ViewModeToggleButtonProps> = ({
    viewMode,
    onToggle,
    isDaylight,
    className = '',
}) => {
    const { t } = useTranslation();
    const switchesToList = viewMode === 'card';

    return (
        <button
            type="button"
            onClick={onToggle}
            title={t(switchesToList ? 'ui.switchToListView' : 'ui.switchToCardView')}
            aria-label={t(switchesToList ? 'ui.switchToListView' : 'ui.switchToCardView')}
            className={`flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 ${className}`}
            style={{
                backgroundColor: isDaylight ? 'rgba(255,255,255,0.62)' : 'rgba(25,25,25,0.58)',
                color: 'var(--text-primary)',
            }}
        >
            {switchesToList ? <List size={14} /> : <LayoutGrid size={14} />}
            <span className="whitespace-nowrap">
                {t(switchesToList ? 'ui.viewList' : 'ui.viewCard')}
            </span>
        </button>
    );
};

export default ViewModeToggleButton;
