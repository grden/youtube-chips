type ExtensionState = {
    isProgrammaticClick: boolean;
    preferenceApplied: boolean;
    lastAppliedTime: number;
    currentChipSource: 'manual' | 'time_pref' | null;
};

export const state: ExtensionState = {
    isProgrammaticClick: false,
    preferenceApplied: false,
    lastAppliedTime: 0,
    currentChipSource: null,
};
