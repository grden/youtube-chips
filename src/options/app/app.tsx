import React, { useState, useEffect } from 'react';
import { TimePreference, getTimePreferences, saveTimePreference, updateTimePreference, deleteTimePreference, checkForTimePreferenceOverlap } from '../../utils/storage';
import { Layout } from '../components/layout';
import { StatusMessage } from '../components/status-message';
import { PreferencesSection } from '../components/preferences-section';
import { FormErrors } from '../contants';

// Status message type
type StatusMessage = {
    type: 'success' | 'error';
    text: string;
};

export default function App() {
    const [timePreferences, setTimePreferences] = useState<TimePreference[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [status, setStatus] = useState<StatusMessage | null>(null);
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    // Load time preferences
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const prefs = await getTimePreferences();
                setTimePreferences(prefs);
            } catch (error) {
                console.error('Error loading time preferences:', error);
                setStatus({
                    type: 'error',
                    text: 'Failed to load time preferences'
                });
            }
        };

        loadPreferences();
    }, []);

    // Validate time preference
    const validateTimePreference = (pref: TimePreference): FormErrors => {
        const errors: FormErrors = {};

        if (pref.days.length === 0) {
            errors.days = 'Please select at least one day';
        }

        if (pref.startHour === pref.endHour) {
            errors.timeRange = 'Start and end time cannot be the same';
        }

        // Check for overlaps with existing preferences
        const existingPrefs = timePreferences.filter(p => p.id !== pref.id);
        if (checkForTimePreferenceOverlap(pref, existingPrefs)) {
            errors.overlap = 'This time preference overlaps with an existing one';
        }

        return errors;
    };

    // Handle save preference
    const handleSavePreference = async (pref: TimePreference) => {
        const errors = validateTimePreference(pref);

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            if (editingId) {
                await updateTimePreference(editingId, pref);
                setStatus({
                    type: 'success',
                    text: 'Time preference updated successfully'
                });
            } else {
                await saveTimePreference(pref);
                setStatus({
                    type: 'success',
                    text: 'Time preference added successfully'
                });
            }

            // Refresh the list
            const updatedPrefs = await getTimePreferences();
            setTimePreferences(updatedPrefs);

            // Reset form state
            setEditingId(null);
            setShowForm(false);
            setFormErrors({});
        } catch (error) {
            console.error('Error saving time preference:', error);
            setStatus({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to save time preference'
            });
        }
    };

    // Handle edit preference
    const handleEditPreference = (id: string) => {
        setEditingId(id);
        setShowForm(true);
        setFormErrors({});
    };

    // Handle delete preference
    const handleDeletePreference = async (id: string) => {
        try {
            await deleteTimePreference(id);

            // Refresh the list
            const updatedPrefs = await getTimePreferences();
            setTimePreferences(updatedPrefs);

            setStatus({
                type: 'success',
                text: 'Time preference deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting time preference:', error);
            setStatus({
                type: 'error',
                text: 'Failed to delete time preference'
            });
        }
    };

    return (
        <Layout>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">YouTube Chips Preferences</h1>
            <StatusMessage status={status} />
            <PreferencesSection
                timePreferences={timePreferences}
                showForm={showForm}
                editingId={editingId}
                formErrors={formErrors}
                onAddNew={() => {
                    setShowForm(true);
                    setEditingId(null);
                    setFormErrors({});
                }}
                onSave={handleSavePreference}
                onEdit={handleEditPreference}
                onDelete={handleDeletePreference}
                onCancel={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormErrors({});
                }}
            />
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-medium text-blue-700 mb-2">How Time Preferences Work</h3>
                <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                    <li>Time preferences automatically select YouTube categories during specified hours and days</li>
                    <li>They override your global preference when active</li>
                    <li>If a specific category isn't available, a similar one will be selected</li>
                    <li>Time ranges are in 24-hour format (e.g., 13:00 is 1:00 PM)</li>
                    <li>Multiple time preferences cannot overlap for the same days and hours</li>
                </ul>
            </div>
        </Layout>
    );
}