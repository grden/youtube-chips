import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { getUserId } from './user_id';

export const EventTypes = {
  MANUAL_CHIP_SELECTED: 'manual_chip_selected',
  TIMEPREF_CHIP_SELECTED: 'timepref_chip_selected',
  YOUTUBE_USAGE: 'youtube_usage',
  SEARCH_QUERY_ENTERED: 'search_query_entered',
  MAINPAGE_ACTION: 'mainpage_action',
  VIDEO_CLICKED: 'video_clicked',
  EXTENSION_INSTALLED: 'extension_installed',
  ERROR_OCCURRED: 'error_occurred',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

export type ChipSource = 'manual' | 'time_pref' | null;

interface BaseEventData {
  user_id: string;
  timestamp: any;
  event_type: EventType;
  extensionVersion: string;
}

interface ManualChipSelected {
  chip_text: string;
  source: 'manual';
}

interface TimePrefChipSelected {
  chip_text: string;
  source: 'time_pref';
  time_range: string;
}

interface YoutubeUsed {
  duration_seconds: number;
  chip_source: ChipSource;
  chip_text?: string;
}

interface SearchQueryEntered {
  search_query: string;
  chip_source: ChipSource;
  chip_text?: string;
}

interface MainpageAction {
  action: 'click' | 'search';
  chip_source: ChipSource;
  chip_text?: string;
}

interface VideoClicked {
  video_id: string;
  video_title: string;
  chip_source: ChipSource;
  chip_text?: string;
}

type EventData =
  | ManualChipSelected
  | TimePrefChipSelected
  | YoutubeUsed
  | SearchQueryEntered
  | MainpageAction
  | VideoClicked
  | Record<string, any>; // For extension_installed and error_occurred

export const logEvent = async (eventType: EventType, data: EventData) => {
  try {
    const userId = await getUserId();
    
    const logEntry: BaseEventData & { data: EventData } = {
      user_id: userId,
      event_type: eventType,
      timestamp: serverTimestamp(),
      extensionVersion: chrome.runtime.getManifest().version,
      data,
    };

    const logsCollection = collection(db, 'logs');
    const docRef = await addDoc(logsCollection, logEntry);
    console.log('Event logged successfully:', eventType, 'DocID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error logging event:', error);
    throw error;
  }
};