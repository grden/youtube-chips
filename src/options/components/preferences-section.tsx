import React from 'react'
import { TimePreference, checkForTimePreferenceOverlap } from '../../utils/storage'
import { TimePreferenceForm } from './timepref-form'
import TimePreferenceCard from './timepref-card'
import { FormErrors } from '../constants/contant'

interface PreferencesSectionProps {
  timePreferences: TimePreference[]
  showForm: boolean
  editingId: string | null
  formErrors: FormErrors
  onAddNew: () => void
  onSave: (pref: TimePreference) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onCancel: () => void
}

export function PreferencesSection({
  timePreferences,
  showForm,
  editingId,
  formErrors,
  onAddNew,
  onSave,
  onEdit,
  onDelete,
  onCancel
}: PreferencesSectionProps) {
  const getEditingPreference = (): TimePreference | undefined => {
    if (!editingId) return undefined;
    return timePreferences.find(p => p.id === editingId);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Time-Based Preferences</h2>
        {!showForm && (
          <button
            onClick={onAddNew}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Add New
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Set YouTube categories to be automatically selected during specific time periods.
        These will override your global preference during the specified times.
      </p>

      {showForm && (
        <TimePreferenceForm
          onSave={onSave}
          existingPreference={getEditingPreference()}
          onCancel={onCancel}
          errors={formErrors}
        />
      )}

      {timePreferences.length > 0 ? (
        <div className="mt-4">
          {timePreferences.map(pref => (
            <TimePreferenceCard
              key={pref.id}
              preference={pref}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          No time preferences set. Add one to get started.
        </div>
      )}
    </div>
  )
} 