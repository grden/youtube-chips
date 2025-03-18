import React from "react";

export interface ActiveTimePreference {
    id: string;
    startHour: number;
    endHour: number;
    days: number[];
    preference: string;
    enabled: boolean;
}

interface FooterProps {
    selectedChip: string;
    tempPref: string | null;
    tempPrefSource: 'global' | 'time' | null;
    activeTimePreference: ActiveTimePreference | null;
}

export function Footer({ selectedChip, tempPref, tempPrefSource, activeTimePreference }: FooterProps) {
    const isTimePreferenceActive = !!activeTimePreference;

    return (
        <div className="border-t border-gray-200 bg-white pt-2 pb-3 px-4 shadow-md">
            {isTimePreferenceActive && (
                <div className="mb-2 text-xs font-medium text-blue-600 bg-blue-50 p-2 rounded-md">
                    A time-based preference (${activeTimePreference.startHour}:00-${activeTimePreference.endHour}:00) is currently active.
                    Manual selection is disabled.
                </div>
            )}

            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Current Preference:</span>
                {selectedChip ? (
                    <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-1 text-sm font-medium rounded-lg ${activeTimePreference
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {selectedChip}
                        </span>
                        {tempPref && tempPref !== selectedChip && (
                            <span className="flex items-center gap-1.5 text-sm font-medium text-yellow-500">
                                <p>→</p>
                                <p>{tempPref}</p>
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-sm text-gray-500 italic">None selected</span>
                )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
                {tempPref && tempPref !== selectedChip ? (
                    "Using similar category since the preferred one isn't available."
                ) : (
                    "This category will be automatically selected when you visit YouTube."
                )}
            </p>
        </div>
    );
};