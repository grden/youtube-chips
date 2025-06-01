import { logEvent, EventTypes } from './logging';

// UUID v4 generator function
const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const getUserId = async (): Promise<string> => {
    try {
        const result = await chrome.storage.local.get(['user_id']);
        
        if (result.user_id) {
            return result.user_id;
        }

        // Generate new user ID if not exists
        const newUserId = generateUUID();
        await chrome.storage.local.set({ user_id: newUserId });
        
        // Log installation event
        await logEvent(EventTypes.EXTENSION_INSTALLED, { user_id: newUserId });
        
        return newUserId;
    } catch (error) {
        console.error('Error managing user ID:', error);
        throw error;
    }
}; 