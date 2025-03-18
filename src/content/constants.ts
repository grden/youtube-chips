/**
 * Shared DOM selectors
 */
export const selectors = {
    chipContainer: "ytd-feed-filter-chip-bar-renderer",
    chip: "yt-chip-cloud-chip-renderer",
} as const;

/**
 * Timing constants (in milliseconds)
 */
export const timing = {
    COOLDOWN_PERIOD: 2000,
    CLICK_RESET_DELAY: 500,
} as const; 