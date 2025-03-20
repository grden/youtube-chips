import { getActiveTimePreference } from '../utils/storage';

// Constants
const ALARM_NAME = 'timePreferenceCheck';
const CHECK_INTERVAL_MINUTES = 60; // Check every hour

/**
 * Sets up the alarm to check time preferences
 */
const setupAlarm = (): void => {
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: CHECK_INTERVAL_MINUTES,
  });

  console.log(`Set up alarm to check time preferences every ${CHECK_INTERVAL_MINUTES} minutes`);

  // Run an initial check immediately
  checkTimePreferences();
};

/**
 * Checks if any time preference is currently active and refreshes the active YouTube tab if necessary
 */
const checkTimePreferences = async (): Promise<void> => {
  try {
    console.log('Checking for active time preferences...');

    const activePref = await getActiveTimePreference();

    // Store active preference in local storage for quick access
    if (activePref) {
      await chrome.storage.local.set({ activeTimePreference: activePref });
      console.log(`Active time preference found: ${activePref.preference} (${activePref.startHour}-${activePref.endHour})`);

      // Refresh the active YouTube tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: false, url: 'https://www.youtube.com/*' });
      if (activeTab?.url) {
        console.log('Refreshing active YouTube tab...');
        chrome.tabs.reload(activeTab.id);
      }
    } else {
      // Clear any previously active preference
      await chrome.storage.local.remove('activeTimePreference');
      console.log('No active time preference found');
    }
  } catch (error) {
    console.error('Error checking time preferences:', error);
  }
};

// Set up event listeners
chrome.runtime.onInstalled.addListener((): void => {
  console.log('Extension installed or updated');
  setupAlarm();
});

chrome.runtime.onStartup.addListener((): void => {
  console.log('Browser started');
  setupAlarm();
});

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm): void => {
  if (alarm.name === ALARM_NAME) {
    checkTimePreferences();
  }
});

// Listen for storage changes to automatically check when time preferences are modified
chrome.storage.onChanged.addListener((changes, areaName): void => {
  if (areaName === 'sync' && changes.timePreferences) {
    console.log('Time preferences changed, checking for active preferences...');
    checkTimePreferences();
  }
});

// Also check when user changes their timezone or system time
// or when explicitly requested by other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse): boolean => {
  if (message.type === 'CHECK_TIME_PREFERENCES') {
    checkTimePreferences()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Indicates we'll respond asynchronously
  }
});

// Initialize when the background script loads
setupAlarm();
