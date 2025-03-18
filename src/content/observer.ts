import { selectors } from './constants';

// Types
type ObserverCallbacks = {
    resetState: () => void;
    applyPreference: () => void;
    isProgrammaticClick: () => boolean;
    isPreferenceApplied: () => boolean;
};

// Constants
const DELAYS = {
    INITIAL_LOAD: 1500,
    PAGE_LOAD: 1000,
    CHIPS_LOAD: 500,
} as const;

/**
 * Creates a mutation observer for YouTube title changes (SPA navigation)
 */
const createNavigationObserver = (callbacks: ObserverCallbacks): MutationObserver => {
    return new MutationObserver((mutations) => {
        if (callbacks.isProgrammaticClick()) return;

        const titleChanged = mutations.some(mutation => 
            mutation.target.nodeName === 'TITLE'
        );

        if (titleChanged) {
            console.log('Title changed, resetting state');
            callbacks.resetState();
            setTimeout(callbacks.applyPreference, DELAYS.PAGE_LOAD);
        }
    });
};

/**
 * Creates a mutation observer for chips container changes
 */
const createChipsObserver = (callbacks: ObserverCallbacks): MutationObserver => {
    return new MutationObserver((mutations) => {
        if (callbacks.isProgrammaticClick() || callbacks.isPreferenceApplied()) return;

        const hasNewChips = mutations.some(mutation => 
            mutation.addedNodes.length && 
            document.querySelector(selectors.chip)
        );

        if (hasNewChips) {
            console.log('Chips found, applying preference');
            setTimeout(callbacks.applyPreference, DELAYS.CHIPS_LOAD);
        }
    });
};

/**
 * Sets up observers to watch for YouTube navigation and chip container changes
 */
export const setupObservers = (
    resetState: () => void,
    applyPreference: () => void,
    isProgrammaticClick: () => boolean,
    isPreferenceApplied: () => boolean
): void => {
    const callbacks: ObserverCallbacks = {
        resetState,
        applyPreference,
        isProgrammaticClick,
        isPreferenceApplied,
    };

    // Create and start navigation observer
    const navigationObserver = createNavigationObserver(callbacks);
    const head = document.querySelector('head');
    if (head) {
        navigationObserver.observe(head, { 
            subtree: true, 
            childList: true 
        });
    }

    // Create and start chips observer
    const chipsObserver = createChipsObserver(callbacks);
    chipsObserver.observe(document.body, { 
        childList: true, 
        subtree: true 
    });

    // Initial application
    setTimeout(callbacks.applyPreference, DELAYS.INITIAL_LOAD);
}; 