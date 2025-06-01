/**
 * Shared DOM selectors
 */
export const selectors = {
    chipContainer: "ytd-feed-filter-chip-bar-renderer",
    chip: "yt-chip-cloud-chip-renderer",
    videoTitle: "yt-formatted-string#video-title",
    videoItemContainerParent: [
        "ytd-rich-item-renderer",
        "ytd-video-renderer",
        "ytd-compact-video-renderer",
        "ytd-grid-video-renderer",
        "ytd-playlist-panel-video-renderer",
        "ytd-playlist-video-renderer",
        "ytd-compact-radio-renderer",
        "ytd-radio-renderer",
    ].join(", "),
    secondaryVideoTitle: [
        "#video-title.ytd-rich-grid-media",
        ".title.ytd-rich-grid-media",
        "#video-title-link yt-formatted-string",
        "#title h3.title-and-badge",
        "#title yt-formatted-string",
    ].join(", "),
    searchForm: 'form[action="/results"]',
    searchInput: 'input[name="search_query"]',
    searchButton: 'button.ytSearchboxComponentSearchButton',
} as const;

/**
 * Timing constants (in milliseconds)
 */
export const timing = {
    COOLDOWN_PERIOD: 2000,
    CLICK_RESET_DELAY: 100,
    MINIMUM_SESSION_DURATION_SECONDS: 5,
    CHIP_FETCH_RETRY_DELAY: 500,
} as const; 