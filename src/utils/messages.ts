import { YouTubeChip } from './interface';
import { getTempPreference, getTempPreferenceSource } from './storage';

// Types
type MessageType = 'GET_CHIPS' | 'CLICK_CHIP';

interface BaseMessage {
    type: MessageType;
}

export interface GetChipsMessage extends BaseMessage {
    type: 'GET_CHIPS';
}

export interface ClickChipMessage extends BaseMessage {
    type: 'CLICK_CHIP';
    text: string;
    clearTempPref?: boolean;
}

type Message = GetChipsMessage | ClickChipMessage;

export interface GetChipsResponse {
    chips: YouTubeChip[];
    tempPref: string | null;
    tempPrefSource: 'global' | 'time' | null;
}

export interface ClickChipResponse {
    success: boolean;
}

type MessageResponse = GetChipsResponse | ClickChipResponse;

type MessageHandlers = {
    getChips: () => YouTubeChip[];
    clickChip: (text: string, clearTempPref?: boolean) => boolean;
};

/**
 * Type-safe wrapper for sending messages to tabs
 */
export const sendTabMessage = <T extends Message, R extends MessageResponse>(
    tabId: number,
    message: T
): Promise<R> => {
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, message, (response: R) => {
            resolve(response);
        });
    });
};

/**
 * Handles incoming messages from the extension
 */
const handleMessage = (
    message: Message,
    handlers: MessageHandlers,
    sendResponse: (response: MessageResponse) => void
): boolean => {
    switch (message.type) {
        case 'GET_CHIPS': {
            const chips = handlers.getChips();
            const tempPref = getTempPreference();
            const tempPrefSource = getTempPreferenceSource();
            sendResponse({ chips, tempPref, tempPrefSource });
            return true;
        }
        case 'CLICK_CHIP': {
            const success = handlers.clickChip(message.text, message.clearTempPref);
            sendResponse({ success });
            return true;
        }
        default: {
            console.error('Unknown message type:', (message as BaseMessage).type);
            sendResponse({ success: false } as ClickChipResponse);
            return false;
        }
    }
};

/**
 * Sets up message listeners for communication with the popup
 */
export function setupMessageListeners(
    getChipsFunction: () => YouTubeChip[],
    clickChipFunction: (text: string, clearTempPref?: boolean) => boolean
): void {
    const handlers: MessageHandlers = {
        getChips: getChipsFunction,
        clickChip: clickChipFunction,
    };

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        return handleMessage(message, handlers, sendResponse);
    });
} 