// Types
export interface TimePreference {
  id: string;           // Unique identifier (UUID)
  startHour: number;    // Hour of day (0-23)
  endHour: number;      // Hour of day (0-23)
  days: number[];       // Days of week (0-6, where 0 is Sunday)
  preference: string;   // The YouTube category to select
  enabled: boolean;     // Whether this time preference is active
}

type TimePreferences = TimePreference[];

type StorageKey = 'globalPref' | 'timePreferences';
type StorageData = {
    globalPref: string | null;
    timePreferences: TimePreferences;
};

/**
 * Storage state management
 */
class PreferenceStorage {
    private static instance: PreferenceStorage;
    private tempPreference: string | null = null;
    private tempPreferenceSource: 'global' | 'time' | null = null;

    private constructor() { }

    public static getInstance(): PreferenceStorage {
        if (!PreferenceStorage.instance) {
            PreferenceStorage.instance = new PreferenceStorage();
        }
        return PreferenceStorage.instance;
    }

    /**
     * Gets the global preference from Chrome storage
     */
    public async getGlobalPreference(): Promise<string | null> {
        try {
            const { globalPref } = await chrome.storage.sync.get(['globalPref']) as Partial<StorageData>;
            return globalPref ?? null;
        } catch (error) {
            console.error('Error getting global preference:', error);
            return null;
        }
    }

    /**
     * Gets all time preferences from Chrome storage
     */
    public async getTimePreferences(): Promise<TimePreferences> {
        try {
            const { timePreferences } = await chrome.storage.sync.get(['timePreferences']) as Partial<StorageData>;
            return timePreferences ?? [];
        } catch (error) {
            console.error('Error getting time preferences:', error);
            return [];
        }
    }

    /**
     * Saves a new time preference to Chrome storage
     */
    public async saveTimePreference(pref: TimePreference): Promise<void> {
        try {
            const timePreferences = await this.getTimePreferences();
            
            // Check for overlaps
            if (this.checkForTimePreferenceOverlap(pref, timePreferences)) {
                throw new Error('Time preference overlaps with an existing preference');
            }
            
            timePreferences.push(pref);
            await chrome.storage.sync.set({ timePreferences });
        } catch (error) {
            console.error('Error saving time preference:', error);
            throw error;
        }
    }

    /**
     * Updates an existing time preference
     */
    public async updateTimePreference(id: string, updates: Partial<TimePreference>): Promise<void> {
        try {
            const timePreferences = await this.getTimePreferences();
            const index = timePreferences.findIndex(p => p.id === id);
            
            if (index === -1) {
                throw new Error(`Time preference with id ${id} not found`);
            }
            
            const updatedPref = { ...timePreferences[index], ...updates };
            
            // Check for overlaps (excluding this preference)
            const otherPrefs = timePreferences.filter(p => p.id !== id);
            if (this.checkForTimePreferenceOverlap(updatedPref, otherPrefs)) {
                throw new Error('Updated time preference overlaps with an existing preference');
            }
            
            timePreferences[index] = updatedPref;
            await chrome.storage.sync.set({ timePreferences });
        } catch (error) {
            console.error('Error updating time preference:', error);
            throw error;
        }
    }

    /**
     * Deletes a time preference
     */
    public async deleteTimePreference(id: string): Promise<void> {
        try {
            const timePreferences = await this.getTimePreferences();
            const filteredPrefs = timePreferences.filter(p => p.id !== id);
            
            if (filteredPrefs.length === timePreferences.length) {
                throw new Error(`Time preference with id ${id} not found`);
            }
            
            await chrome.storage.sync.set({ timePreferences: filteredPrefs });
        } catch (error) {
            console.error('Error deleting time preference:', error);
            throw error;
        }
    }

    /**
     * Gets the currently active time preference based on current time and day
     */
    public async getActiveTimePreference(): Promise<TimePreference | null> {
        try {
            const timePreferences = await this.getTimePreferences();
            if (!timePreferences.length) return null;
            
            const now = new Date();
            const currentHour = now.getHours();
            const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
            
            // Find an enabled preference that matches current time and day
            const activePref = timePreferences.find(pref => {
                if (!pref.enabled) return false;
                
                // Check if current day is in the preference's days
                if (!pref.days.includes(currentDay)) return false;
                
                // Check if current hour is within the preference's time range
                if (pref.startHour <= pref.endHour) {
                    // Normal time range (e.g., 9-17)
                    return currentHour >= pref.startHour && currentHour < pref.endHour;
                } else {
                    // Overnight time range (e.g., 22-6)
                    return currentHour >= pref.startHour || currentHour < pref.endHour;
                }
            });
            
            return activePref || null;
        } catch (error) {
            console.error('Error getting active time preference:', error);
            return null;
        }
    }

    /**
     * Checks if a time preference overlaps with existing preferences
     */
    public checkForTimePreferenceOverlap(newPref: TimePreference, existingPrefs: TimePreferences): boolean {
        return existingPrefs.some(existingPref => {
            // Skip disabled preferences
            if (!existingPref.enabled || !newPref.enabled) return false;
            
            // Check for day overlap
            const dayOverlap = newPref.days.some(day => existingPref.days.includes(day));
            if (!dayOverlap) return false;
            
            // Check for time overlap
            const newStartsBeforeExistingEnds = 
                (newPref.startHour < existingPref.endHour) || 
                (existingPref.endHour <= existingPref.startHour && newPref.startHour < existingPref.endHour);
                
            const newEndsAfterExistingStarts = 
                (newPref.endHour > existingPref.startHour) || 
                (newPref.endHour <= newPref.startHour && existingPref.startHour < newPref.endHour);
            
            return newStartsBeforeExistingEnds && newEndsAfterExistingStarts;
        });
    }

    /**
     * Sets the temporary preference when exact match is not found
     */
    public setTempPreference(pref: string | null, source: 'global' | 'time' | null = null): void {
        this.tempPreference = pref;
        this.tempPreferenceSource = source;
        console.log(`Temporary preference ${pref ? `set to "${pref}"` : 'cleared'} (source: ${source || 'none'})`);
    }

    /**
     * Gets the temporary preference
     */
    public getTempPreference(): string | null {
        return this.tempPreference;
    }

    /**
     * Gets the source of the temporary preference
     */
    public getTempPreferenceSource(): 'global' | 'time' | null {
        return this.tempPreferenceSource;
    }
}

// Export singleton instance methods
const preferenceStorage = PreferenceStorage.getInstance();

export const getGlobalPreference = preferenceStorage.getGlobalPreference.bind(preferenceStorage);
export const getTimePreferences = preferenceStorage.getTimePreferences.bind(preferenceStorage);
export const saveTimePreference = preferenceStorage.saveTimePreference.bind(preferenceStorage);
export const updateTimePreference = preferenceStorage.updateTimePreference.bind(preferenceStorage);
export const deleteTimePreference = preferenceStorage.deleteTimePreference.bind(preferenceStorage);
export const getActiveTimePreference = preferenceStorage.getActiveTimePreference.bind(preferenceStorage);
export const checkForTimePreferenceOverlap = preferenceStorage.checkForTimePreferenceOverlap.bind(preferenceStorage);
export const setTempPreference = preferenceStorage.setTempPreference.bind(preferenceStorage);
export const getTempPreference = preferenceStorage.getTempPreference.bind(preferenceStorage);
export const getTempPreferenceSource = preferenceStorage.getTempPreferenceSource.bind(preferenceStorage); 