import { YouTubeChip } from '../utils/interface';
import { getGlobalPreference, setTempPreference } from '../utils/storage';
import { setupMessageListeners } from '../utils/messages';
import { setupObservers } from './observer';
import { findSimilarChip } from './find-similar';
import { selectors, timing } from './constants';
import { logEvent, EventTypes, logVideoClick, logSearchQuery, logMainpageAction } from '../firebase';
import { state } from './states';

// Session tracking state for YOUTUBE_USAGE event
let sessionStartTime: number = 0;
let sessionChipText: string | null = null;
let sessionChipSource: 'manual' | 'time_pref' | null = null;

// Utility functions
/**
 * Extracts the visible text from a chip element.
 * @param element The chip element.
 * @returns The trimmed text of the chip.
 */
const getChipText = (element: Element): string => {
    const text = element.textContent?.trim() || '';
    return text.substring(0, text.length / 2).trim();
};

/**
 * Checks if an element is an HTMLElement representing a YouTube chip.
 * @param element The element to check.
 * @returns True if the element is a chip element, false otherwise.
 */
const isChipElement = (element: Element): element is HTMLElement => {
    return element.tagName.toLowerCase() === selectors.chip.toLowerCase();
};

/**
 * Checks if the current page context is the YouTube main page.
 * @returns True if the current page is the main YouTube page, false otherwise.
 */
const getIsMainPageContext = (): boolean => {
    const pathname = window.location.pathname;
    const search = window.location.search;
    // Main page is https://www.youtube.com/ (no extra path or query params)
    const isMain = pathname === '/' && search === '';
    return isMain;
};

/**
 * Extracts the video title from a given anchor element.
 * It tries various selectors and attributes to find the title.
 * @param clickedLink The HTMLAnchorElement that was clicked.
 * @returns The extracted video title, or "Unknown Title" if not found.
 */
const extractVideoTitleFromElement = (clickedLink: HTMLAnchorElement): string => {
    let videoTitle: string | null = null;

    // 1. Directly inside the link
    let titleElement = clickedLink.querySelector(selectors.videoTitle) as HTMLElement;
    if (titleElement) videoTitle = titleElement.textContent?.trim();

    // 2. If not found, check common video item containers
    if (!videoTitle) {
        const videoItemContainer = clickedLink.closest(selectors.videoItemContainerParent);
        if (videoItemContainer) {
            titleElement = videoItemContainer.querySelector(selectors.videoTitle) as HTMLElement;
            if (titleElement) videoTitle = titleElement.textContent?.trim();
        }
    }
    // 3. Fallback to aria-label or title attribute on the link itself
    if (!videoTitle) {
        videoTitle = clickedLink.getAttribute('aria-label') || clickedLink.getAttribute('title');
        // Clean up duration from aria-label if present (e.g., "Video Title 1 minute, 30 seconds")
        if (videoTitle) videoTitle = videoTitle.replace(/\s*\d+\s*(minute|second|hour)s?(\s*,*\s*\d*\s*(minute|second|hour)s?)*/gi, '').trim();
    }
    // 4. Fallback for other title structures sometimes found within the link
    if (!videoTitle) {
        const secondaryTitleElementInsideLink = clickedLink.querySelector(selectors.secondaryVideoTitle) as HTMLElement;
        if (secondaryTitleElementInsideLink) videoTitle = secondaryTitleElementInsideLink.getAttribute('title') || secondaryTitleElementInsideLink.textContent?.trim();
    }
    // 5. Last resort: Try to derive from textContent of the link, cleaning it up
    if (!videoTitle && clickedLink.textContent) {
        const lines = clickedLink.textContent.trim().split('\n');
        if (lines.length > 0) {
            videoTitle = lines[0].trim().replace(/\s{2,}/g, ' '); // Consolidate multiple spaces
            // Remove common YouTube junk text that sometimes gets appended
            videoTitle = videoTitle.replace(/SearchInfoShoppingTap to unmute.*/i, '').trim();
        }
    }
    return videoTitle || 'Unknown Title';
};

/**
 * Retrieves all YouTube category chips from the page.
 * @returns An array of YouTubeChip objects, or an empty array if none are found or an error occurs.
 */
const getChips = (): YouTubeChip[] => {
    try {
        const chipContainer = document.querySelector(selectors.chipContainer);
        if (!chipContainer) return [];
        const queryYtChips = chipContainer.querySelectorAll(selectors.chip);
        if (!queryYtChips.length) return [];

        return Array.from(queryYtChips)
            .filter(element => element.closest(selectors.chipContainer))
            .map((element) => {
                const text = getChipText(element);
                return text ? { text, index: 0 } : null; // Index isn't strictly used later, default to 0
            })
            .filter((chip): chip is YouTubeChip => chip !== null);
    } catch (error) {
        handleError('getChips', error as Error);
        return [];
    }
};

/**
 * Checks if a specific chip is currently selected on the page.
 * @param text The text of the chip to check.
 * @returns True if the chip is selected, false otherwise or if an error occurs.
 */
const isChipSelected = (text: string): boolean => {
    try {
        const chips = document.querySelectorAll(selectors.chip);
        if (text === "All") {
            return !Array.from(chips).some(chip => {
                const chipText = getChipText(chip);
                if (chipText !== "All") {
                    return chip.hasAttribute('selected') || chip.getAttribute('aria-selected') === 'true' || chip.classList.contains('selected') || (chip as HTMLElement).style.backgroundColor !== '';
                }
                return false;
            });
        }
        return Array.from(chips).some(chip => {
            const actualText = getChipText(chip);
            const isSelected = chip.hasAttribute('selected') || chip.getAttribute('aria-selected') === 'true' || chip.classList.contains('selected') || (chip as HTMLElement).style.backgroundColor !== '';
            return actualText === text && isSelected;
        });
    } catch (error) {
        handleError('isChipSelected', error as Error);
        return false;
    }
};

/**
 * Ends the current chip session and logs its duration and details to Firebase.
 * @returns A promise that resolves when the event is logged or immediately if no session was active.
 */
const endCurrentChipSessionAndLog = (): Promise<string | void> => {
    if (sessionStartTime > 0) {
        const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
        // Only log if duration is meaningful (e.g., more than a fleeting moment or our defined minimum)
        if (durationSeconds >= timing.MINIMUM_SESSION_DURATION_SECONDS) {
            const payload: {
                duration_seconds: number;
                chip_source: 'manual' | 'time_pref' | null;
                chip_text?: string;
            } = {
                duration_seconds: durationSeconds,
                chip_source: sessionChipSource,
            };
            if (sessionChipText !== null) { // Ensure "All" or other texts are included
                payload.chip_text = sessionChipText;
            }
            // Ensure EventTypes.YOUTUBE_USAGE is correctly defined and used in your firebase.ts
            return logEvent(EventTypes.YOUTUBE_USAGE, payload)
                .catch(err => handleError('endCurrentChipSessionAndLog.logEvent', err as Error));
        }
    }
    sessionStartTime = 0; // Reset start time to prevent re-logging empty sessions or very short ones
    return Promise.resolve();
};

/**
 * Starts a new chip session, ending and logging any previous session.
 * @param newChipText The text of the newly selected chip, or null.
 * @param newChipSource The source of the chip selection ('manual', 'time_pref'), or null.
 */
const startNewChipSession = (newChipText: string | null, newChipSource: 'manual' | 'time_pref' | null): void => {
    endCurrentChipSessionAndLog(); // End and log previous session first

    sessionStartTime = Date.now();
    sessionChipText = newChipText;
    sessionChipSource = newChipSource;
    state.currentChipSource = newChipSource; // Update global state for other log types
};

/**
 * Programmatically clicks a chip with the specified text.
 * @param text The text of the chip to click.
 * @param isManual True if the click is a manual user action, false for programmatic clicks.
 * @returns True if the chip was found and clicked (or already selected for manual interaction), false otherwise.
 */
const clickChip = (text: string, isManual: boolean = false): boolean => {
    try {
        const forceClick = text === "All";
        if (!forceClick && isChipSelected(text)) {
            if (isManual) {
                // If chip is already selected and it's a manual click,
                // we still want to ensure the session reflects this manual (re)affirmation.
                startNewChipSession(text, 'manual');
            }
            return true;
        }
        const chips = document.querySelectorAll(selectors.chip);
        const targetChip = Array.from(chips).find(chip => getChipText(chip) === text);
        if (targetChip && isChipElement(targetChip)) {
            if (isManual) {
                logEvent(EventTypes.MANUAL_CHIP_SELECTED, { chip_text: text, source: 'manual' })
                    .catch(err => handleError('clickChip.logEventManual', err as Error));
                startNewChipSession(text, 'manual');
            }
            state.isProgrammaticClick = !isManual;
            state.preferenceApplied = true; // This seems related to UI state
            targetChip.click();
            setTimeout(() => { state.isProgrammaticClick = false; }, timing.CLICK_RESET_DELAY);
            return true;
        }
        return false;
    } catch (error) {
        handleError('clickChip', error as Error);
        state.isProgrammaticClick = false;
        return false;
    }
};

/**
 * Applies the global or time-based preference for chip selection.
 * It handles cooldown periods and attempts to click the preferred chip,
 * falling back to similar chips or a default if necessary.
 * Includes a retry mechanism if chips are not immediately found.
 * @returns A promise that resolves when the preference application attempt is complete.
 */
const applyGlobalPreference = async (): Promise<void> => {
    if (state.isProgrammaticClick) return;
    const now = Date.now();
    if (now - state.lastAppliedTime < timing.COOLDOWN_PERIOD) return;
    state.lastAppliedTime = now;

    try {
        let availableChips = getChips();
        if (availableChips.length === 0) {
            // Chips not found initially, try again after a short delay
            await new Promise(resolve => setTimeout(resolve, timing.CHIP_FETCH_RETRY_DELAY));
            availableChips = getChips();
            if (availableChips.length === 0) {
                console.warn('[YTC] applyGlobalPreference: Chips still not found after retry. Defaulting session to "All".');
                // If chips are persistently not found, default the session.
                // This might happen if the chip bar isn't present on the page.
                startNewChipSession("All", null);
                return;
            }
        }

        let activeTimePreference: { preference: string; startHour: string; endHour: string; } | null = null;
        try {
            const { activeTimePreference: activePref } = await chrome.storage.local.get('activeTimePreference');
            activeTimePreference = activePref;
        } catch (error) {
            handleError('applyGlobalPreference.getActiveTimePreference', error as Error);
            // Continue, as global preference might still apply
        }

        let preferenceToApply: string | null = null;
        let preferenceSourceForChip: 'time_pref' | 'manual' | null = null;

        if (activeTimePreference && activeTimePreference.preference) {
            preferenceToApply = activeTimePreference.preference;
            preferenceSourceForChip = 'time_pref';
            // Logging for time_pref moved to just before action
        } else {
            const globalPref = await getGlobalPreference();
            if (globalPref) {
                preferenceToApply = globalPref;
                preferenceSourceForChip = 'manual'; // Source for global default preference
            }
        }
        
        if (!preferenceToApply) {
            // No specific preference set (neither time-based nor global).
            // Determine current visually selected chip from the (potentially retried) availableChips.
            const currentVisuallySelectedChip = availableChips.find(chip => isChipSelected(chip.text));
            startNewChipSession(currentVisuallySelectedChip ? currentVisuallySelectedChip.text : "All", null);
            return;
        }

        // If we have a preference to apply, and it's from a time preference, log it now.
        if (preferenceSourceForChip === 'time_pref' && activeTimePreference && preferenceToApply) {
            await logEvent(EventTypes.TIMEPREF_CHIP_SELECTED, {
                chip_text: preferenceToApply,
                source: 'time_pref',
                time_range: `${activeTimePreference.startHour}-${activeTimePreference.endHour}`
            }).catch(err => handleError('applyGlobalPreference.logEventTimePref', err as Error));
        }

        state.preferenceApplied = true; // UI related state
        const exactClickSuccess = clickChip(preferenceToApply, false); // isManual is false

        if (!exactClickSuccess) {
            // `availableChips` is already populated (with retry if it was initially empty)
            const similarChip = findSimilarChip(preferenceToApply, availableChips);
            if (similarChip) {
                await setTempPreference(similarChip.text, preferenceSourceForChip === 'time_pref' ? 'time' : 'global');
                clickChip(similarChip.text, false); // Programmatic click
                startNewChipSession(similarChip.text, preferenceSourceForChip);
            } else {
                // Failed to find exact or similar.
                // Fallback to what is visually selected from `availableChips` or "All".
                await setTempPreference(null);
                const currentVisuallySelectedChip = availableChips.find(chip => isChipSelected(chip.text));
                startNewChipSession(currentVisuallySelectedChip ? currentVisuallySelectedChip.text : "All", null);
            }
        } else {
            // Exact click was successful
            await setTempPreference(null);
            startNewChipSession(preferenceToApply, preferenceSourceForChip);
        }
    } catch (error) {
        handleError('applyGlobalPreference', error as Error);
    }
};

/**
 * Hides the YouTube chips container element from view and adjusts related layout,
 * ensuring the header background remains opaque.
 */
const hideChipsContainer = (): void => {
    try {
        // 1. Hide the chip renderer element itself (e.g., ytd-feed-filter-chip-bar-renderer)
        const chipRendererElement = document.querySelector(selectors.chipContainer);
        if (chipRendererElement instanceof HTMLElement) {
            chipRendererElement.style.display = 'none';
        }

        // 2. Hide the wrapper element for chips within the masthead (e.g., #chips-wrapper)
        const chipsWrapperInMasthead = document.querySelector('ytd-masthead #chips-wrapper');
        if (chipsWrapperInMasthead instanceof HTMLElement) {
            chipsWrapperInMasthead.style.display = 'none';
        }

        // 3. Signal to the main masthead component that chips are not present
        // and ensure its background remains opaque.
        const mastheadElement = document.querySelector('ytd-masthead#masthead');
        if (mastheadElement) {
            mastheadElement.removeAttribute('chips');
            // Target the inner #container div for background styling if possible,
            // as it's often the main content block of the masthead.
            const mastheadContainer = mastheadElement.querySelector('#container') as HTMLElement;
            if (mastheadContainer) {
                mastheadContainer.style.backgroundColor = 'var(--yt-spec-brand-background-primary)';
            } else {
                // Fallback to styling the masthead custom element directly if #container isn't found
                (mastheadElement as HTMLElement).style.backgroundColor = 'var(--yt-spec-brand-background-primary)';
            }
        }
        
        // 4. Address the `with-chipbar` class on `#frosted-glass` and ensure its background.
        // This element might contribute to the header's overall appearance or background.
        const frostedGlassElement = document.getElementById('frosted-glass') as HTMLElement;
        if (frostedGlassElement) {
            if (frostedGlassElement.classList.contains('with-chipbar')) {
                frostedGlassElement.classList.remove('with-chipbar');
            }
            // Ensure frosted-glass also has a background, as its transparency
            // could be the issue if masthead relies on it.
            frostedGlassElement.style.backgroundColor = 'var(--yt-spec-brand-background-primary)';
        }

    } catch (error) {
        handleError('hideChipsContainer', error as Error);
    }
};

/**
 * Resets parts of the extension's state, typically related to UI or preference application.
 * It sets `preferenceApplied` to false and hides the chips container.
 */
const resetState = (): void => {
    state.preferenceApplied = false;
    hideChipsContainer();
};

// New 'beforeunload' listener for YOUTUBE_USAGE session logging
window.addEventListener('beforeunload', () => {
    endCurrentChipSessionAndLog();
});

/**
 * Sets up event listeners to track search events (form submissions, button clicks, Enter key).
 * Logs search actions and queries to Firebase.
 */
const trackSearchEvents = () => {
    const searchForm = document.querySelector(selectors.searchForm) as HTMLFormElement;
    const searchInput = document.querySelector(selectors.searchInput) as HTMLInputElement;
    const searchButton = document.querySelector(selectors.searchButton) as HTMLButtonElement;

    if (!searchInput) {
        console.warn("Search input not found. Aborting trackSearchEvents setup.");
        return;
    }

    const handleSearch = (queryValue?: string) => { 
        const query = queryValue !== undefined ? queryValue : searchInput.value.trim();
        const currentChip = getChips().find(chip => isChipSelected(chip.text));

        logMainpageAction('search', state.currentChipSource, currentChip?.text)
            .catch(err => {
                handleError('trackSearchEvents.logMainpageActionSearch', err as Error);
            });

        if (query) {
            logSearchQuery(query, state.currentChipSource, currentChip?.text)
                .catch(err => {
                    handleError('trackSearchEvents.logSearchQuery', err as Error);
                });
        }
    };

    if (searchForm) {
        searchForm.addEventListener('submit', () => {
            setTimeout(() => handleSearch(), 150); 
        });
    } else {
        console.warn("Search form not found, submit listener not attached.");
    }

    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const queryFromInput = searchInput.value.trim();
            handleSearch(queryFromInput);
        });
    } else {
        console.warn("Search button not found, click listener not attached.");
    }

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const queryFromInput = searchInput.value.trim();
            setTimeout(() => handleSearch(queryFromInput), 150);
        }
    });
};

/**
 * Sets up a document-wide click listener to track clicks on video links.
 * Logs video click events to Firebase if on the main page.
 */
const trackVideoClicks = () => {
    document.addEventListener('click', (e) => {
        const targetElement = e.target as Element;
        let clickedLink: HTMLAnchorElement | null = null;
        let currentElement: Element | null = targetElement;

        // Traverse up the DOM to find the parent <a> tag for the video link
        while (currentElement && currentElement !== document.body) {
            if (currentElement.tagName === 'A' && (currentElement as HTMLAnchorElement).href.includes('/watch?v=')) {
                clickedLink = currentElement as HTMLAnchorElement;
                break;
            }
            currentElement = currentElement.parentElement;
        }
        
        if (clickedLink) {
            const href = clickedLink.getAttribute('href');
            if (!href) return; 
            const videoIdMatch = href.match(/v=([^&]+)/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;
            if (!videoId) return;

            const videoTitle = extractVideoTitleFromElement(clickedLink);

            const currentChip = getChips().find(chip => isChipSelected(chip.text));
            const chipSourceForLog = state.currentChipSource;

            // Only log MAINPAGE_ACTION (click) and VIDEO_CLICKED if on the main page
            if (getIsMainPageContext()) {
                logMainpageAction('click', chipSourceForLog, currentChip?.text)
                    .catch(err => handleError('trackVideoClicks.logMainpageActionClick', err as Error));
                
                logVideoClick(videoId, videoTitle, chipSourceForLog, currentChip?.text)
                    .catch(err => handleError('trackVideoClicks.logVideoClick', err as Error));
            }
        }
    }, true); // Use capture phase to catch clicks early
};

/**
 * Initializes the content script functionalities.
 * Sets up observers, message listeners, event trackers,
 * initial chip session, and applies global preferences.
 */
const initializeExtension = (): void => {
    setupObservers(resetState, applyGlobalPreference, () => state.isProgrammaticClick, () => state.preferenceApplied);
    
    setupMessageListeners(
        getChips,
        (text: string, clearTempPref?: boolean) => {
            if (clearTempPref) setTempPreference(null);
            // clickChip with isManual=true will handle starting the new session
            return clickChip(text, true); 
        }
    );

    hideChipsContainer();
    trackSearchEvents();
    trackVideoClicks();
    
    // Initial application of preferences will be handled by observers (e.g., on yt-navigate-finish)
};

/**
 * Handles errors by logging them to the console and to Firebase.
 * Includes a mechanism to prevent infinite logging loops for Firebase errors.
 * @param context A string describing the context in which the error occurred.
 * @param error The error object.
 */
const handleError = (context: string, error: Error) => {
    console.error(`Error in ${context}:`, error);
    // Avoid logging errors that occur during the logging process itself to prevent infinite loops.
    if (context.startsWith('trackSearchEvents.log') || 
        context.startsWith('trackVideoClicks.log') || 
        context.startsWith('endCurrentChipSessionAndLog.logEvent') || 
        context.startsWith('clickChip.logEventManual') || 
        context.startsWith('determinePreferenceToApply.logEventTimePref') || 
        context.startsWith('applyGlobalPreference.logEventTimePref') 
    ) {
        console.error(`Firebase logging error suppressed for context: ${context} to avoid loop.`);
        return;
    }
    logEvent(EventTypes.ERROR_OCCURRED, {
        context,
        error_message: error.message,
        error_stack: error.stack // Be mindful of PII if stacks are very detailed
    }).catch(loggingError => {
        // This is a critical failure: we couldn't even log an error.
        console.error("CRITICAL: Failed to log an error to Firebase. Context:", context, "Original Error:", error, "Logging Error:", loggingError);
    });
};

initializeExtension();
