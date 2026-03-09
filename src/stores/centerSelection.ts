// src/stores/centerSelection.ts
import React from 'react';
import { create } from 'zustand';

interface CenterSelectionState {
    selectedCenterId: number | null; // null means all / default
    selectedCenterName: string | null;
    setCenter: (centerId: number | null, centerName?: string | null) => void;
    clearCenter: () => void;
    loadFromStorage: () => void;
}

const STORAGE_KEY = 'selectedCenter';

export const useCenterSelection = create<CenterSelectionState>((set) => ({
    selectedCenterId: null,
    selectedCenterName: null,
    setCenter: (centerId, centerName) => {
        try {
            if (centerId === null) {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ centerId, centerName: centerName || null }));
            }
        } catch (err) {
            // ignore storage errors
        }
        set({ selectedCenterId: centerId, selectedCenterName: centerName || null });
    },
    clearCenter: () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
            // ignore storage errors
        }
        set({ selectedCenterId: null, selectedCenterName: null });
    },
    loadFromStorage: () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                set({ selectedCenterId: parsed.centerId ?? null, selectedCenterName: parsed.centerName ?? null });
            }
        } catch (err) {
            // ignore
        }
    },
}));

// Helper hook to ensure store is initialized on first mount
export const useEnsureCenterLoaded = () => {
    const load = useCenterSelection((s) => s.loadFromStorage);
    React.useEffect(() => {
        load();
    }, [load]);
};
