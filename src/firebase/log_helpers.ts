import { logEvent, EventTypes } from './logging';
import type { ChipSource } from './logging';

export const logManualChipSelection = (chipText: string) => {
  return logEvent(EventTypes.MANUAL_CHIP_SELECTED, {
    chip_text: chipText,
    source: 'manual',
  });
};

export const logTimePrefChipSelection = (chipText: string, timeRange: string) => {
  return logEvent(EventTypes.TIMEPREF_CHIP_SELECTED, {
    chip_text: chipText,
    source: 'time_pref',
    time_range: timeRange,
  });
};

export const logYoutubeUsage = (
  durationSeconds: number,
  chipSource: ChipSource,
  chipText?: string
) => {
  return logEvent(EventTypes.YOUTUBE_USAGE, {
    duration_seconds: durationSeconds,
    chip_source: chipSource,
    chip_text: chipText,
  });
};

export const logSearchQuery = (
  searchQuery: string,
  chipSource: ChipSource,
  chipText?: string
) => {
  return logEvent(EventTypes.SEARCH_QUERY_ENTERED, {
    search_query: searchQuery,
    chip_source: chipSource,
    chip_text: chipText,
  });
};

export const logMainpageAction = (
  action: 'click' | 'search',
  chipSource: ChipSource,
  chipText?: string
) => {
  return logEvent(EventTypes.MAINPAGE_ACTION, {
    action,
    chip_source: chipSource,
    chip_text: chipText,
  });
};

export const logVideoClick = (
  videoId: string,
  videoTitle: string,
  chipSource: ChipSource,
  chipText?: string
) => {
  return logEvent(EventTypes.VIDEO_CLICKED, {
    video_id: videoId,
    video_title: videoTitle,
    chip_source: chipSource,
    chip_text: chipText,
  });
};

export const logError = (error: Error, context?: Record<string, any>) => {
  return logEvent(EventTypes.ERROR_OCCURRED, {
    error_message: error.message,
    error_stack: error.stack,
    ...context,
  });
}; 