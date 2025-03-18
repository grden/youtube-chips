import React from "react";
import { TimePreference } from "../../utils/storage";
import { DAYS_OF_WEEK } from "../contants";

interface TimePreferenceCardProps {
    preference: TimePreference;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function TimePreferenceCard({ preference, onEdit, onDelete }: TimePreferenceCardProps) {
    // Format days for display
    const formatDays = (days: number[]): string => {
        return days.map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label || '').join(', ');
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
            <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-900">
                    {formatDays(preference.days)} • {preference.startHour}:00-{preference.endHour}:00
                </div>
                <div className="text-sm text-blue-600 font-semibold">
                    {preference.preference}
                </div>
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => onEdit(preference.id)}
                    className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                >
                    Edit
                </button>
                <button
                    onClick={() => onDelete(preference.id)}
                    className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};