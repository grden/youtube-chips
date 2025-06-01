import { logMainpageAction } from '../firebase';

export const trackMainPageAction = (action: 'click' | 'search', chipSource: 'manual' | 'time_pref' | null, chipText?: string) => {
    logMainpageAction(action, chipSource, chipText);
}; 