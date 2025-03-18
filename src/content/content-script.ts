import { YouTubeChip } from '../utils/interface';
import { getGlobalPreference, setTempPreference } from '../utils/storage';
import { setupMessageListeners } from '../utils/messages';
import { setupObservers } from './observer';
import { findSimilarChip } from './find-similar';
import { selectors, timing } from './constants';

// State management
type ExtensionState = {
    isProgrammaticClick: boolean;
    preferenceApplied: boolean;
    lastAppliedTime: number;
};

const state: ExtensionState = {
    isProgrammaticClick: false,
    preferenceApplied: false,
    lastAppliedTime: 0,
};

// Utility functions
const getChipText = (element: Element): string => {
    const text = element.textContent?.trim() || '';
    return text.substring(0, text.length / 2).trim();
};

const isChipElement = (element: Element): element is HTMLElement => {
    return element.tagName.toLowerCase() === selectors.chip.toLowerCase();
};

/**
 * Retrieves all YouTube category chips from the page
 */
const getChips = (): YouTubeChip[] => {
    try {
        const chipContainer = document.querySelector(selectors.chipContainer);
        if (!chipContainer) {
            console.log("Chip container not found");
            return [];
        }

        const queryYtChips = chipContainer.querySelectorAll(selectors.chip);
        if (!queryYtChips.length) {
            console.log("No chips found in container");
            return [];
        }

        const chips: YouTubeChip[] = Array.from(queryYtChips)
            .filter(element => element.closest(selectors.chipContainer))
            .map((element, index) => {
                const text = getChipText(element);
                return text ? { text, index } : null;
            })
            .filter((chip): chip is YouTubeChip => chip !== null);

        console.log(`Found ${chips.length} category chips`);
        return chips;
    } catch (error) {
        console.error('Error getting chips:', error);
        return [];
    }
};

/**
 * Checks if a specific chip is currently selected
 */
const isChipSelected = (text: string): boolean => {
    try {
        const chips = document.querySelectorAll(selectors.chip);

        // Special case for "All" chip - we need to check if any other chip is selected
        if (text === "All") {
            // If any other chip is visibly selected, then "All" is not actually selected
            const anyOtherChipSelected = Array.from(chips).some(chip => {
                const chipText = getChipText(chip);
                if (chipText !== "All") {
                    const isSelected = chip.hasAttribute('selected') ||
                        chip.getAttribute('aria-selected') === 'true' ||
                        chip.classList.contains('selected') ||
                        (chip as HTMLElement).style.backgroundColor !== '';
                    return isSelected;
                }
                return false;
            });

            // If any other chip is selected, then "All" is not actually selected
            if (anyOtherChipSelected) {
                console.log(`[DEBUG] "All" chip is not actually selected because another chip is selected`);
                return false;
            }
        }

        // Regular selection check for other chips
        return Array.from(chips).some(chip => {
            const actualText = getChipText(chip);
            const isSelected = chip.hasAttribute('selected') ||
                chip.getAttribute('aria-selected') === 'true' ||
                chip.classList.contains('selected') ||
                (chip as HTMLElement).style.backgroundColor !== '';

            return actualText === text && isSelected;
        });
    } catch (error) {
        console.error('Error checking if chip is selected:', error);
        return false;
    }
};

/**
 * Programmatically clicks a chip with the specified text
 */
const clickChip = (text: string): boolean => {
    try {
        console.log(`[DEBUG] Attempting to click chip "${text}"`);

        // For the "All" chip, we'll force a click regardless of selection state
        const forceClick = text === "All";

        if (!forceClick && isChipSelected(text)) {
            console.log(`[DEBUG] Chip "${text}" is already selected according to isChipSelected()`);
            return true;
        }

        const chips = document.querySelectorAll(selectors.chip);
        const targetChip = Array.from(chips).find(chip => getChipText(chip) === text);

        if (targetChip && isChipElement(targetChip)) {
            state.isProgrammaticClick = true;
            state.preferenceApplied = true;

            console.log(`[DEBUG] Clicking chip "${text}"`);
            targetChip.click();

            setTimeout(() => {
                state.isProgrammaticClick = false;
            }, timing.CLICK_RESET_DELAY);

            return true;
        }
        return false;
    } catch (error) {
        console.error('Error clicking chip:', error);
        state.isProgrammaticClick = false;
        return false;
    }
};

/**
 * Applies the global preference for chip selection
 */
const applyGlobalPreference = async (): Promise<void> => {
    if (state.isProgrammaticClick) return;

    const now = Date.now();
    if (now - state.lastAppliedTime < timing.COOLDOWN_PERIOD) return;

    state.lastAppliedTime = now;

    try {
        // First check if there's an active time preference
        let activeTimePreference = null;
        try {
            const { activeTimePreference: activePref } = await chrome.storage.local.get('activeTimePreference');
            activeTimePreference = activePref;
        } catch (error) {
            console.error('Error getting active time preference:', error);
        }

        // Use the active time preference if available, otherwise use global preference
        let preferenceToApply = null;
        let preferenceSource: 'global' | 'time' = 'global';

        if (activeTimePreference && activeTimePreference.preference) {
            preferenceToApply = activeTimePreference.preference;
            preferenceSource = 'time';
            console.log(`Using time preference: ${preferenceToApply}`);
        } else {
            const globalPref = await getGlobalPreference();
            preferenceToApply = globalPref;
            console.log(`Using global preference: ${preferenceToApply}`);
        }

        if (!preferenceToApply) return;

        state.preferenceApplied = false;
        const exactClickSuccess = clickChip(preferenceToApply);

        if (!exactClickSuccess) {
            const availableChips = getChips();
            const similarChip = findSimilarChip(preferenceToApply, availableChips);

            if (similarChip) {
                await setTempPreference(similarChip.text, preferenceSource);
                console.log(`Using similar chip "${similarChip.text}" instead of "${preferenceToApply}"`);
                clickChip(similarChip.text);
            } else {
                await setTempPreference(null);
            }
        } else {
            await setTempPreference(null);
        }
    } catch (error) {
        console.error('Error applying preference:', error);
    }
};

/**
 * Hides the YouTube chips container
 */
const hideChipsContainer = (): void => {
    try {
        const chipContainer = document.querySelector(selectors.chipContainer);
        if (chipContainer instanceof HTMLElement) {
            chipContainer.style.display = 'none';
        }
    } catch (error) {
        console.error('Error hiding chips container:', error);
    }
};

/**
 * Resets extension state when navigating to a new page
 */
const resetState = (): void => {
    state.preferenceApplied = false;
    hideChipsContainer();
};

// Initialize extension
const initializeExtension = (): void => {
    // Setup message listeners
    setupMessageListeners(
        getChips,
        (text: string, clearTempPref?: boolean) => {
            state.isProgrammaticClick = false;
            state.preferenceApplied = false;

            // Clear temp preference if requested
            if (clearTempPref) {
                setTempPreference(null);
            }

            return clickChip(text);
        }
    );

    // Setup observers
    setupObservers(
        resetState,
        applyGlobalPreference,
        () => state.isProgrammaticClick,
        () => state.preferenceApplied
    );

    // Hide chips container immediately
    hideChipsContainer();
};

// Start the extension
initializeExtension();
