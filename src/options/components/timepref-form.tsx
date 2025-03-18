import React, { useState } from "react";
import { TimePreference } from '../../utils/storage';
import { PREDEFINED_CATEGORIES, CUSTOM_OPTION, DAYS_OF_WEEK, HOURS, FormErrors } from "../contants";
import { v4 as uuidv4 } from 'uuid';

interface TimePreferenceFormProps {
    onSave: (preference: TimePreference) => void;
    existingPreference?: TimePreference;
    onCancel?: () => void;
    errors: FormErrors;
}

// Time preference form component
export function TimePreferenceForm({ onSave, existingPreference, onCancel, errors }: TimePreferenceFormProps) {
    const [days, setDays] = useState<number[]>(existingPreference?.days || []);
    const [startHour, setStartHour] = useState<number>(existingPreference?.startHour || 9);
    const [endHour, setEndHour] = useState<number>(existingPreference?.endHour || 17);
    const [preference, setPreference] = useState<string>(existingPreference?.preference || PREDEFINED_CATEGORIES[0]);
    const [isCustomPreference, setIsCustomPreference] = useState<boolean>(
        existingPreference ? !PREDEFINED_CATEGORIES.includes(existingPreference.preference) : false
    );
    const [customPreference, setCustomPreference] = useState<string>(
        existingPreference && !PREDEFINED_CATEGORIES.includes(existingPreference.preference)
            ? existingPreference.preference
            : ""
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Capitalize first letter of custom preference
        let finalPreference = preference;
        if (isCustomPreference) {
            finalPreference = customPreference.trim();
            if (finalPreference.length > 0) {
                finalPreference = finalPreference.charAt(0).toUpperCase() + finalPreference.slice(1);
            }
        }

        const newPreference: TimePreference = {
            id: existingPreference?.id || uuidv4(),
            days,
            startHour,
            endHour,
            preference: finalPreference,
            enabled: true, // Always enabled since we're not using a toggle
        };

        onSave(newPreference);
    };

    const toggleDay = (day: number) => {
        setDays(prevDays =>
            prevDays.includes(day)
                ? prevDays.filter(d => d !== day)
                : [...prevDays, day]
        );
    };

    const handlePreferenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === CUSTOM_OPTION) {
            setIsCustomPreference(true);
        } else {
            setIsCustomPreference(false);
            setPreference(value);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-3">
                {existingPreference ? 'Edit Time Preference' : 'Add New Time Preference'}
            </h3>

            {/* Days selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
                <div className="flex space-x-1">
                    {DAYS_OF_WEEK.map(day => (
                        <button
                            key={day.value}
                            type="button"
                            className={`w-8 h-8 rounded-full text-sm font-medium
                ${days.includes(day.value)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                } transition-colors`}
                            onClick={() => toggleDay(day.value)}
                            title={day.fullName}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
                {errors.days && <p className="text-red-500 text-xs mt-1">{errors.days}</p>}
            </div>

            {/* Time range selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <div className="flex items-center space-x-2">
                    <div className="relative w-full">
                        <select
                            value={startHour}
                            onChange={e => setStartHour(Number(e.target.value))}
                            className="block w-full rounded-md border-gray-300 pl-3 pr-8 py-2 appearance-none bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                            {HOURS.map(hour => (
                                <option key={`start-${hour.value}`} value={hour.value}>
                                    {hour.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>
                    <span className="text-gray-500 font-medium">to</span>
                    <div className="relative w-full">
                        <select
                            value={endHour}
                            onChange={e => setEndHour(Number(e.target.value))}
                            className="block w-full rounded-md border-gray-300 pl-3 pr-8 py-2 appearance-none bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                            {HOURS.map(hour => (
                                <option key={`end-${hour.value}`} value={hour.value}>
                                    {hour.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>
                </div>
                {errors.timeRange && <p className="text-red-500 text-xs mt-1">{errors.timeRange}</p>}
            </div>

            {/* Preference selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Category</label>
                {isCustomPreference ? (
                    <div className="flex items-center space-x-2">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={customPreference}
                                onChange={e => setCustomPreference(e.target.value)}
                                placeholder="Enter custom category"
                                className="block w-full rounded-md border-gray-300 pl-3 pr-8 py-2 appearance-none bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCustomPreference(false)}
                            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                            title="Use predefined category"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <select
                            value={preference}
                            onChange={handlePreferenceChange}
                            className="block w-full rounded-md border-gray-300 pl-3 pr-8 py-2 appearance-none bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                            {PREDEFINED_CATEGORIES.map(category => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                            <option value={CUSTOM_OPTION}>{CUSTOM_OPTION}</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>
                )}
                {errors.preference && <p className="text-red-500 text-xs mt-1">{errors.preference}</p>}
            </div>

            {/* Overlap error */}
            {errors.overlap && (
                <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">
                    {errors.overlap}
                </div>
            )}

            {/* Form actions */}
            <div className="flex justify-end space-x-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {existingPreference ? 'Update' : 'Add'}
                </button>
            </div>
        </form>
    );
};